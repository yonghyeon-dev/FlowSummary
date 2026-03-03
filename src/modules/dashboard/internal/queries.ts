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

  // 주간 회의 수 추이 (최근 8주)
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const weeklyMeetings = await prisma.meeting.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      createdAt: { gte: eightWeeksAgo },
    },
    select: { createdAt: true },
  });

  const weeklyMeetingCounts = getWeeklyCounts(weeklyMeetings.map((m) => m.createdAt));

  // 주간 완료 액션아이템 추이 (최근 8주)
  const weeklyDone = await prisma.actionItem.findMany({
    where: {
      workspaceId,
      status: ActionItemStatus.DONE,
      completedAt: { not: null, gte: eightWeeksAgo },
    },
    select: { completedAt: true },
  });

  const weeklyDoneCounts = getWeeklyCounts(
    weeklyDone.map((a) => a.completedAt!),
  );

  return {
    meetingCount,
    incompleteCount,
    overdueCount,
    doneCount,
    totalItems,
    recentMeetings,
    recentActionItems,
    weeklyMeetingCounts,
    weeklyDoneCounts,
  };
}

function getWeeklyCounts(dates: Date[]): { week: string; count: number }[] {
  const weeks: { week: string; count: number }[] = [];
  const now = new Date();

  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    // 월요일 기준으로 맞춤
    const dayOfWeek = weekStart.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + diff);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const count = dates.filter((d) => d >= weekStart && d < weekEnd).length;
    const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
    weeks.push({ week: label, count });
  }

  return weeks;
}
