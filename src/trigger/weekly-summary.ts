import { schedules } from "@trigger.dev/sdk/v3";
import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { weeklySummaryEmailHtml } from "@/modules/notification";
import {
  ActionItemStatus,
  MembershipRole,
  NotificationType,
} from "@prisma/client";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://flowsummary.app";

export const weeklySummary = schedules.task({
  id: "weekly-summary",
  // 매주 월요일 00:00 UTC
  cron: "0 0 * * 1",
  maxDuration: 300,
  run: async () => {
    // 1. 모든 워크스페이스 조회
    const workspaces = await prisma.workspace.findMany({
      select: { id: true, name: true },
    });

    let sentCount = 0;

    for (const workspace of workspaces) {
      // 2. 미완료 ActionItem 조회 (OVERDUE, CONFIRMED, IN_PROGRESS)
      const incompleteItems = await prisma.actionItem.findMany({
        where: {
          workspaceId: workspace.id,
          status: {
            in: [
              ActionItemStatus.OVERDUE,
              ActionItemStatus.CONFIRMED,
              ActionItemStatus.IN_PROGRESS,
            ],
          },
        },
        include: {
          assignee: { select: { name: true, email: true } },
        },
        orderBy: { dueDate: "asc" },
      });

      if (incompleteItems.length === 0) continue;

      const overdueCount = incompleteItems.filter(
        (item) => item.status === ActionItemStatus.OVERDUE
      ).length;
      const inProgressCount = incompleteItems.filter(
        (item) =>
          item.status === ActionItemStatus.IN_PROGRESS ||
          item.status === ActionItemStatus.CONFIRMED
      ).length;

      const items = incompleteItems.map((item) => ({
        title: item.title,
        assignee: item.assignee?.name ?? item.assignee?.email ?? "미배정",
        dueDate: item.dueDate
          ? new Date(item.dueDate).toLocaleDateString("ko-KR")
          : null,
      }));

      // 3. Admin/Owner 멤버 조회
      const adminMembers = await prisma.membership.findMany({
        where: {
          workspaceId: workspace.id,
          role: { in: [MembershipRole.OWNER, MembershipRole.ADMIN] },
          isActive: true,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      // 4. 각 Admin/Owner에게 이메일 발송
      for (const member of adminMembers) {
        const dashboardUrl = `${BASE_URL}/workspaces/${workspace.id}`;
        const html = weeklySummaryEmailHtml({
          userName: member.user.name ?? member.user.email,
          workspaceName: workspace.name,
          overdueCount,
          inProgressCount,
          items,
          dashboardUrl,
        });

        try {
          await resend.emails.send({
            from: EMAIL_FROM,
            to: member.user.email,
            subject: `[FlowSummary] ${workspace.name} 주간 미완료 작업 요약`,
            html,
          });

          // NotificationLog 기록
          await prisma.notificationLog.create({
            data: {
              userId: member.user.id,
              type: NotificationType.WEEKLY_SUMMARY,
              scheduledAt: new Date(),
              sent: true,
              sentAt: new Date(),
            },
          });

          sentCount++;
        } catch (error) {
          // 발송 실패해도 다른 멤버 계속 진행
          await prisma.notificationLog.create({
            data: {
              userId: member.user.id,
              type: NotificationType.WEEKLY_SUMMARY,
              scheduledAt: new Date(),
              errorMessage:
                error instanceof Error ? error.message : "발송 실패",
            },
          });
        }
      }
    }

    return { sentCount };
  },
});
