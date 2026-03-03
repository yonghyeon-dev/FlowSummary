"use server";

import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { tasks } from "@trigger.dev/sdk/v3";
import type { sendReminder } from "@/trigger/remind";

export async function scheduleAssignmentNotifications(meetingId: string) {
  const actionItems = await prisma.actionItem.findMany({
    where: {
      meetingId,
      assigneeUserId: { not: null },
      status: { in: ["CONFIRMED", "IN_PROGRESS"] },
    },
    select: {
      id: true,
      assigneeUserId: true,
    },
  });

  if (actionItems.length === 0) return [];

  const notifications = await prisma.notificationLog.createManyAndReturn({
    data: actionItems.map((item) => ({
      userId: item.assigneeUserId!,
      actionItemId: item.id,
      type: NotificationType.ASSIGNMENT,
      scheduledAt: new Date(),
    })),
  });

  // 각 알림에 대해 발송 Job 트리거
  for (const notif of notifications) {
    await tasks.trigger<typeof sendReminder>("send-reminder", {
      notificationLogId: notif.id,
    });
  }

  return notifications;
}

export async function scheduleReminderNotifications(
  actionItemId: string,
  userId: string,
  dueDate: Date
) {
  const now = new Date();
  const schedules: { type: NotificationType; scheduledAt: Date }[] = [];

  // 마감 전일 오전 9시 (사용자 시간대는 추후 반영, 현재 KST 기준)
  const dayBefore = new Date(dueDate);
  dayBefore.setDate(dayBefore.getDate() - 1);
  dayBefore.setHours(0, 0, 0, 0); // UTC 00:00 = KST 09:00
  if (dayBefore > now) {
    schedules.push({
      type: NotificationType.REMINDER,
      scheduledAt: dayBefore,
    });
  }

  // 마감 당일 오전 9시
  const dueDay = new Date(dueDate);
  dueDay.setHours(0, 0, 0, 0);
  if (dueDay > now) {
    schedules.push({
      type: NotificationType.REMINDER,
      scheduledAt: dueDay,
    });
  }

  if (schedules.length === 0) return [];

  return prisma.notificationLog.createMany({
    data: schedules.map((s) => ({
      userId,
      actionItemId,
      type: s.type,
      scheduledAt: s.scheduledAt,
    })),
  });
}

export async function scheduleOverdueReminders(
  actionItemId: string,
  userId: string
) {
  // 기존 overdue 알림 횟수 확인 (최대 3회)
  const existingCount = await prisma.notificationLog.count({
    where: {
      actionItemId,
      type: NotificationType.OVERDUE,
    },
  });

  if (existingCount >= 3) return null;

  return prisma.notificationLog.create({
    data: {
      userId,
      actionItemId,
      type: NotificationType.OVERDUE,
      scheduledAt: new Date(),
    },
  });
}
