import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/modules/auth";
import { requireWorkspaceMembership } from "@/modules/workspace";
import { getMeetingDetail, transitionMeetingStatus } from "@/modules/meeting";
import { MeetingStatus, MembershipRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { tasks } from "@trigger.dev/sdk/v3";
import type { transcribeMeeting } from "@/trigger/transcribe";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params;
    const user = await requireUser();

    const meeting = await getMeetingDetail(meetingId);
    if (!meeting) {
      return NextResponse.json({ error: "회의를 찾을 수 없습니다" }, { status: 404 });
    }

    const membership = await requireWorkspaceMembership(user.id, meeting.workspaceId);

    if (membership.role === MembershipRole.MEMBER) {
      return NextResponse.json(
        { error: "재처리는 Admin 이상만 가능합니다" },
        { status: 403 }
      );
    }

    if (meeting.status !== MeetingStatus.FAILED) {
      return NextResponse.json(
        { error: `현재 상태(${meeting.status})에서는 재처리할 수 없습니다` },
        { status: 400 }
      );
    }

    // 재시도 카운트 증가
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { retryCount: { increment: 1 } },
    });

    // FAILED → PROCESSING
    await transitionMeetingStatus(
      prisma,
      meetingId,
      MeetingStatus.FAILED,
      MeetingStatus.PROCESSING
    );

    // 파일 기반이면 전사부터 재시작
    if (!meeting.isTextPaste && meeting.assets[0]) {
      await tasks.trigger<typeof transcribeMeeting>("transcribe-meeting", {
        meetingId,
        fileUrl: meeting.assets[0].storagePath,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "재처리 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
