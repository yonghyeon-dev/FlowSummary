import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/modules/auth";
import { requireWorkspaceMembership } from "@/modules/workspace";
import { getMeetingDetail } from "@/modules/meeting";
import { MembershipRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/modules/audit";

export async function DELETE(
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

    // Admin 이상만 삭제 가능
    if (membership.role === MembershipRole.MEMBER) {
      return NextResponse.json(
        { error: "삭제는 Admin 이상만 가능합니다" },
        { status: 403 }
      );
    }

    // Soft delete
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { deletedAt: new Date() },
    });

    await createAuditLog({
      workspaceId: meeting.workspaceId,
      userId: user.id,
      action: "meeting.deleted",
      entity: "meeting",
      entityId: meetingId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "삭제 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
