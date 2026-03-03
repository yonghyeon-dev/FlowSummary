"use server";

import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { tasks } from "@trigger.dev/sdk/v3";
import type { sendReminder } from "@/trigger/remind";
import { toUtcFromTimezone } from "./timezone";

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

  // 사용자 시간대 조회
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  const timezone = user?.timezone ?? "Asia/Seoul";

  const scheduleList: { type: NotificationType; scheduledAt: Date }[] = [];

  // 마감 전일 오전 9시 (사용자 시간대)
  const dayBefore = new Date(dueDate);
  dayBefore.setDate(dayBefore.getDate() - 1);
  const dayBeforeUtc = toUtcFromTimezone(dayBefore, 9, timezone);
  if (dayBeforeUtc > now) {
    scheduleList.push({
      type: NotificationType.REMINDER,
      scheduledAt: dayBeforeUtc,
    });
  }

  // 마감 당일 오전 9시 (사용자 시간대)
  const dueDayUtc = toUtcFromTimezone(new Date(dueDate), 9, timezone);
  if (dueDayUtc > now) {
    scheduleList.push({
      type: NotificationType.REMINDER,
      scheduledAt: dueDayUtc,
    });
  }

  if (scheduleList.length === 0) return [];

  return prisma.notificationLog.createMany({
    data: scheduleList.map((s) => ({
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
