import { schedules, tasks } from "@trigger.dev/sdk/v3";
import { prisma } from "@/lib/prisma";
import { ActionItemStatus, NotificationType } from "@prisma/client";
import type { sendReminder } from "@/trigger/remind";

const MAX_OVERDUE_REMINDERS = 3;

export const checkOverdue = schedules.task({
  id: "check-overdue",
  // 매일 00:00 UTC 실행
  cron: "0 0 * * *",
  maxDuration: 120,
  run: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. dueDate < today인 CONFIRMED / IN_PROGRESS 액션아이템 조회
    const overdueItems = await prisma.actionItem.findMany({
      where: {
        status: { in: [ActionItemStatus.CONFIRMED, ActionItemStatus.IN_PROGRESS] },
        dueDate: { lt: today },
        assigneeUserId: { not: null },
      },
      select: {
        id: true,
        assigneeUserId: true,
        status: true,
      },
    });

    if (overdueItems.length === 0) {
      return { transitioned: 0, notified: 0 };
    }

    let transitioned = 0;
    let notified = 0;

    for (const item of overdueItems) {
      // 2. OVERDUE 상태로 전환
      await prisma.actionItem.update({
        where: { id: item.id },
        data: { status: ActionItemStatus.OVERDUE },
      });
      transitioned++;

      // 3. 기존 OVERDUE 알림 횟수 확인 (최대 3회)
      const existingCount = await prisma.notificationLog.count({
        where: {
          actionItemId: item.id,
          type: NotificationType.OVERDUE,
        },
      });

      if (existingCount >= MAX_OVERDUE_REMINDERS) {
        continue;
      }

      // 4. NotificationLog 생성 + remind Job 트리거
      const notification = await prisma.notificationLog.create({
        data: {
          userId: item.assigneeUserId!,
          actionItemId: item.id,
          type: NotificationType.OVERDUE,
          scheduledAt: new Date(),
        },
      });

      await tasks.trigger<typeof sendReminder>("send-reminder", {
        notificationLogId: notification.id,
      });
      notified++;
    }

    return { transitioned, notified };
  },
});
