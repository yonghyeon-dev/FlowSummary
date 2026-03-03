import { prisma } from "@/lib/prisma";
import { ActionItemStatus } from "@prisma/client";

export async function getDashboardStats(workspaceId: string) {
  const [meetingCount, actionItemStats, recentMeetings, recentActionItems] =
    await Promise.all([
      // 전체 회의 수
      prisma.meeting.count({ where: { workspaceId } }),

      // 액션아이템 상태별 집계
      prisma.actionItem.groupBy({
        by: ["status"],
        where: { workspaceId },
        _count: true,
      }),

      // 최근 회의 5건
      prisma.meeting.findMany({
        where: { workspaceId },
        select: {
          id: true,
          title: true,
          meetingDate: true,
          status: true,
          creator: { select: { name: true, email: true } },
          _count: { select: { actionItems: true } },
        },
        orderBy: { meetingDate: "desc" },
        take: 5,
      }),

      // 최근 액션아이템 변경 10건
      prisma.actionItemHistory.findMany({
        where: {
          actionItem: { workspaceId },
        },
        select: {
          id: true,
          field: true,
          oldValue: true,
          newValue: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          actionItem: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  // 상태별 카운트 계산
  const statusCounts: Record<string, number> = {};
  for (const stat of actionItemStats) {
    statusCounts[stat.status] = stat._count;
  }

  const activeStatuses = [
    ActionItemStatus.EXTRACTED,
    ActionItemStatus.CONFIRMED,
    ActionItemStatus.IN_PROGRESS,
  ];

  const incompleteCount = activeStatuses.reduce(
    (sum, s) => sum + (statusCounts[s] ?? 0),
    0
  );

  const overdueCount = statusCounts[ActionItemStatus.OVERDUE] ?? 0;
  const doneCount = statusCounts[ActionItemStatus.DONE] ?? 0;
  const totalItems = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return {
    meetingCount,
    incompleteCount,
    overdueCount,
    doneCount,
    totalItems,
    recentMeetings,
    recentActionItems,
  };
}
