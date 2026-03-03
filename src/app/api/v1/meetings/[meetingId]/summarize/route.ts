import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/modules/auth";
import { requireWorkspaceMembership } from "@/modules/workspace";
import { getMeetingDetail } from "@/modules/meeting";
import { tasks } from "@trigger.dev/sdk/v3";
import type { summarizeMeeting } from "@/trigger/summarize";

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

    await requireWorkspaceMembership(user.id, meeting.workspaceId);

    if (meeting.status !== "REVIEW_NEEDED" && meeting.status !== "PROCESSING") {
      return NextResponse.json(
        { error: `현재 상태(${meeting.status})에서는 요약을 실행할 수 없습니다` },
        { status: 400 }
      );
    }

    if (meeting.segments.length === 0) {
      return NextResponse.json(
        { error: "전사 데이터가 없습니다" },
        { status: 400 }
      );
    }

    const handle = await tasks.trigger<typeof summarizeMeeting>(
      "summarize-meeting",
      { meetingId }
    );

    return NextResponse.json({
      success: true,
      taskId: handle.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "요약 트리거 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
