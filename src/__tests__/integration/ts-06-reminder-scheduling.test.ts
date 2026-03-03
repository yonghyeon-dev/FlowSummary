/**
 * TS-06: 마감 리마인드 스케줄링 + 시간대 변환
 *
 * 마감 전일/당일 오전 9시(사용자 시간대) → UTC 변환 후 NotificationLog 생성
 * Overdue 리마인드 최대 3회 제한
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationType } from "@prisma/client";

const mockFindUnique = vi.fn();
const mockCreateMany = vi.fn();
const mockCount = vi.fn();
const mockCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    notificationLog: {
      createMany: (...args: unknown[]) => mockCreateMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

vi.mock("@trigger.dev/sdk/v3", () => ({
  tasks: {
    trigger: vi.fn(),
  },
}));

import {
  scheduleReminderNotifications,
  scheduleOverdueReminders,
} from "@/modules/notification/internal/actions";
import { toUtcFromTimezone } from "@/modules/notification/internal/timezone";

describe("TS-06: 마감 리마인드 스케줄링", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("시간대 UTC 변환", () => {
    it("Asia/Seoul 09:00 → UTC 00:00 (KST = UTC+9)", () => {
      const date = new Date("2026-03-10");
      const utc = toUtcFromTimezone(date, 9, "Asia/Seoul");

      expect(utc.getUTCHours()).toBe(0);
      expect(utc.getUTCDate()).toBe(10);
    });

    it("America/New_York 09:00 → UTC 14:00 (EST, 1월)", () => {
      // 1월은 EST(UTC-5) 적용
      const date = new Date("2026-01-15");
      const utc = toUtcFromTimezone(date, 9, "America/New_York");

      expect(utc.getUTCHours()).toBe(14);
    });

    it("America/New_York 09:00 → UTC 13:00 (EDT, 3월 DST)", () => {
      // 3월 10일은 EDT(UTC-4) 적용
      const date = new Date("2026-03-10");
      const utc = toUtcFromTimezone(date, 9, "America/New_York");

      expect(utc.getUTCHours()).toBe(13);
    });

    it("UTC 09:00 → UTC 09:00", () => {
      const date = new Date("2026-03-10");
      const utc = toUtcFromTimezone(date, 9, "UTC");

      expect(utc.getUTCHours()).toBe(9);
    });
  });

  describe("리마인드 스케줄", () => {
    it("미래 마감일 → 전일 + 당일 2개 스케줄 생성", async () => {
      // 마감일이 충분히 미래
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      mockFindUnique.mockResolvedValue({ timezone: "Asia/Seoul" });
      mockCreateMany.mockResolvedValue({ count: 2 });

      await scheduleReminderNotifications("ai-1", "user-1", futureDate);

      expect(mockCreateMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: "user-1",
            actionItemId: "ai-1",
            type: NotificationType.REMINDER,
          }),
        ]),
      });
    });

    it("timezone 없으면 Asia/Seoul 기본값", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      mockFindUnique.mockResolvedValue({ timezone: null });
      mockCreateMany.mockResolvedValue({ count: 2 });

      await scheduleReminderNotifications("ai-1", "user-1", futureDate);

      // 기본값 Asia/Seoul로 스케줄 생성됨
      expect(mockCreateMany).toHaveBeenCalled();
    });
  });

  describe("Overdue 리마인드 제한", () => {
    it("기존 0회 → 알림 생성", async () => {
      mockCount.mockResolvedValue(0);
      mockCreate.mockResolvedValue({ id: "notif-1" });

      const result = await scheduleOverdueReminders("ai-1", "user-1");

      expect(result).not.toBeNull();
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: NotificationType.OVERDUE,
          actionItemId: "ai-1",
        }),
      });
    });

    it("기존 2회 → 알림 생성 (3회 미만)", async () => {
      mockCount.mockResolvedValue(2);
      mockCreate.mockResolvedValue({ id: "notif-2" });

      const result = await scheduleOverdueReminders("ai-1", "user-1");

      expect(result).not.toBeNull();
    });

    it("기존 3회 이상 → 알림 생성 안 함 (최대 3회)", async () => {
      mockCount.mockResolvedValue(3);

      const result = await scheduleOverdueReminders("ai-1", "user-1");

      expect(result).toBeNull();
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });
});
