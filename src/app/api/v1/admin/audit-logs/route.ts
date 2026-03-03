import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/modules/auth";
import { requireWorkspaceMembership } from "@/modules/workspace";
import { getAuditLogs } from "@/modules/audit";
import { MembershipRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId가 필요합니다" },
        { status: 400 }
      );
    }

    const membership = await requireWorkspaceMembership(user.id, workspaceId);

    // Admin 이상만 감사 로그 조회 가능
    if (membership.role === MembershipRole.MEMBER) {
      return NextResponse.json(
        { error: "감사 로그는 Admin 이상만 조회 가능합니다" },
        { status: 403 }
      );
    }

    const entity = searchParams.get("entity") ?? undefined;
    const entityId = searchParams.get("entityId") ?? undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : undefined;
    const cursor = searchParams.get("cursor") ?? undefined;

    const logs = await getAuditLogs({
      workspaceId,
      entity,
      entityId,
      limit,
      cursor,
    });

    return NextResponse.json({ data: logs });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "감사 로그 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
