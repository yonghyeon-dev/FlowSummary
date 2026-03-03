import { task } from "@trigger.dev/sdk/v3";
import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { NotificationType } from "@prisma/client";
import {
  assignmentEmailHtml,
  reminderEmailHtml,
} from "@/modules/notification";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://flowsummary.app";

export const sendReminder = task({
  id: "send-reminder",
  maxDuration: 60,
  run: async (payload: { notificationLogId: string }) => {
    const { notificationLogId } = payload;

    // 1. NotificationLog + 관련 데이터 조회
    const notification = await prisma.notificationLog.findUnique({
      where: { id: notificationLogId },
      include: {
        user: { select: { email: true, name: true, notificationEnabled: true } },
        actionItem: {
          select: {
            id: true,
            title: true,
            dueDate: true,
            meeting: {
              select: {
                id: true,
                title: true,
                workspaceId: true,
              },
            },
          },
        },
      },
    });

    if (!notification) {
      throw new Error(`NotificationLog not found: ${notificationLogId}`);
    }

    if (notification.sent) {
      return { notificationLogId, status: "already_sent" };
    }

    // 사용자가 알림을 비활성화한 경우 스킵
    if (!notification.user.notificationEnabled) {
      await prisma.notificationLog.update({
        where: { id: notificationLogId },
        data: { sent: true, sentAt: new Date(), errorMessage: "Notification disabled by user" },
      });
      return { notificationLogId, status: "skipped_disabled" };
    }

    const { user, actionItem } = notification;
    if (!actionItem) {
      // actionItem이 삭제된 경우 스킵
      await prisma.notificationLog.update({
        where: { id: notificationLogId },
        data: { sent: true, sentAt: new Date(), errorMessage: "ActionItem deleted" },
      });
      return { notificationLogId, status: "skipped" };
    }

    const meetingUrl = `${BASE_URL}/workspaces/${actionItem.meeting.workspaceId}/meetings/${actionItem.meeting.id}`;
    const userName = user.name ?? user.email;
    const dueDate = actionItem.dueDate
      ? new Date(actionItem.dueDate).toLocaleDateString("ko-KR")
      : null;

    // 2. 이메일 HTML 생성
    let subject: string;
    let html: string;

    switch (notification.type) {
      case NotificationType.ASSIGNMENT:
        subject = `[FlowSummary] 새 할 일: ${actionItem.title}`;
        html = assignmentEmailHtml({
          userName,
          meetingTitle: actionItem.meeting.title,
          actionItemTitle: actionItem.title,
          dueDate,
          meetingUrl,
        });
        break;

      case NotificationType.REMINDER:
        subject = `[FlowSummary] 마감 임박: ${actionItem.title}`;
        html = reminderEmailHtml({
          userName,
          actionItemTitle: actionItem.title,
          dueDate: dueDate ?? "미정",
          meetingTitle: actionItem.meeting.title,
          meetingUrl,
          isOverdue: false,
        });
        break;

      case NotificationType.OVERDUE:
        subject = `[FlowSummary] 마감 지연: ${actionItem.title}`;
        html = reminderEmailHtml({
          userName,
          actionItemTitle: actionItem.title,
          dueDate: dueDate ?? "미정",
          meetingTitle: actionItem.meeting.title,
          meetingUrl,
          isOverdue: true,
        });
        break;

      default:
        subject = `[FlowSummary] 알림`;
        html = `<p>알림이 있습니다.</p>`;
    }

    // 3. Resend로 이메일 발송
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject,
        html,
      });

      // 4. 발송 성공 기록
      await prisma.notificationLog.update({
        where: { id: notificationLogId },
        data: { sent: true, sentAt: new Date() },
      });

      return { notificationLogId, status: "sent" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "이메일 발송 실패";

      await prisma.notificationLog.update({
        where: { id: notificationLogId },
        data: { errorMessage },
      });

      throw error;
    }
  },
});
