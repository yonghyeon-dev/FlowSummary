import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth";
import { getPendingNotifications } from "@/modules/notification";
import { tasks } from "@trigger.dev/sdk/v3";
import type { sendReminder } from "@/trigger/remind";

// 대기 중인 알림을 조회하고 발송 트리거 (스케줄러 역할)
export async function POST() {
  try {
    await requireUser();

    const pending = await getPendingNotifications();

    let triggered = 0;
    for (const notif of pending) {
      await tasks.trigger<typeof sendReminder>("send-reminder", {
        notificationLogId: notif.id,
      });
      triggered++;
    }

    return NextResponse.json({
      success: true,
      pending: pending.length,
      triggered,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알림 처리 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
