import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/modules/auth";
import { requireWorkspaceMembership } from "@/modules/workspace";
import { getMeetingDetail, transitionMeetingStatus } from "@/modules/meeting";
import { MeetingStatus, MembershipRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/modules/audit";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params;
    const user = await requireUser();

    const meeting = await getMeetingDetail(meetingId);
    if (!meeting) {
      return NextResponse.json(
        { error: "회의를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const membership = await requireWorkspaceMembership(
      user.id,
      meeting.workspaceId
    );

    // Admin 이상만 보관 가능
    if (membership.role === MembershipRole.MEMBER) {
      return NextResponse.json(
        { error: "보관은 Admin 이상만 가능합니다" },
        { status: 403 }
      );
    }

    if (meeting.status !== MeetingStatus.PUBLISHED) {
      return NextResponse.json(
        { error: `현재 상태(${meeting.status})에서는 보관할 수 없습니다` },
        { status: 400 }
      );
    }

    await transitionMeetingStatus(
      prisma,
      meetingId,
      MeetingStatus.PUBLISHED,
      MeetingStatus.ARCHIVED
    );

    await createAuditLog({
      workspaceId: meeting.workspaceId,
      userId: user.id,
      action: "meeting.archived",
      entity: "meeting",
      entityId: meetingId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "보관 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
