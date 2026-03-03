import { task } from "@trigger.dev/sdk/v3";

export const sendReminder = task({
  id: "send-reminder",
  maxDuration: 60,
  run: async (payload: { notificationLogId: string }) => {
    const { notificationLogId } = payload;

    // TODO: Phase 4에서 구현
    // 1. NotificationLog 조회
    // 2. ActionItem + User 조회
    // 3. Resend로 이메일 발송
    // 4. NotificationLog sent=true, sentAt 업데이트

    return {
      notificationLogId,
      status: "placeholder",
    };
  },
});
