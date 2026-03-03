/**
 * TS-07: Auto-OVERDUE 일일 점검 + 알림
 *
 * cron Job이 마감 초과 ActionItem을 자동 OVERDUE 전환
 * 알림 생성 + send-reminder Job 트리거
 * 최대 3회 초과 시 알림 스킵
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActionItemStatus, NotificationType } from "@prisma/client";

const mockFindMany = vi.fn();
const mockUpdate = vi.fn();
const mockCount = vi.fn();
const mockCreate = vi.fn();
const mockTrigger = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    actionItem: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    notificationLog: {
      count: (...args: unknown[]) => mockCount(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

vi.mock("@trigger.dev/sdk/v3", () => ({
  schedules: {
    task: (config: { run: (...args: unknown[]) => unknown }) => config,
  },
  tasks: {
    trigger: (...args: unknown[]) => mockTrigger(...args),
  },
}));

import { checkOverdue } from "@/trigger/check-overdue";

type CheckOverdueRunner = {
  run: () => Promise<{ transitioned: number; notified: number }>;
};

describe("TS-07: Auto-OVERDUE 일일 점검", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
    mockTrigger.mockResolvedValue({});
  });

  it("마감 초과 아이템 없으면 아무 동작 안 함", async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await (checkOverdue as unknown as CheckOverdueRunner).run();

    expect(result).toEqual({ transitioned: 0, notified: 0 });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("IN_PROGRESS + 마감 초과 → OVERDUE 전환 + 알림", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "ai-1",
        assigneeUserId: "user-1",
        status: ActionItemStatus.IN_PROGRESS,
      },
    ]);
    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue({ id: "notif-1" });

    const result = await (checkOverdue as unknown as CheckOverdueRunner).run();

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "ai-1" },
      data: { status: ActionItemStatus.OVERDUE },
    });
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        actionItemId: "ai-1",
        type: NotificationType.OVERDUE,
      }),
    });
    expect(mockTrigger).toHaveBeenCalledWith("send-reminder", {
      notificationLogId: "notif-1",
    });
    expect(result).toEqual({ transitioned: 1, notified: 1 });
  });

  it("CONFIRMED + 마감 초과 → OVERDUE 전환", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "ai-2",
        assigneeUserId: "user-2",
        status: ActionItemStatus.CONFIRMED,
      },
    ]);
    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue({ id: "notif-2" });

    const result = await (checkOverdue as unknown as CheckOverdueRunner).run();

    expect(result.transitioned).toBe(1);
  });

  it("기존 OVERDUE 알림 3회 도달 → 전환은 하되 알림 스킵", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "ai-3",
        assigneeUserId: "user-3",
        status: ActionItemStatus.IN_PROGRESS,
      },
    ]);
    mockCount.mockResolvedValue(3);

    const result = await (checkOverdue as unknown as CheckOverdueRunner).run();

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(result).toEqual({ transitioned: 1, notified: 0 });
  });

  it("복수 아이템: 혼합 알림 상태 정확 처리", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "ai-a",
        assigneeUserId: "user-a",
        status: ActionItemStatus.IN_PROGRESS,
      },
      {
        id: "ai-b",
        assigneeUserId: "user-b",
        status: ActionItemStatus.CONFIRMED,
      },
      {
        id: "ai-c",
        assigneeUserId: "user-c",
        status: ActionItemStatus.IN_PROGRESS,
      },
    ]);
    mockCount
      .mockResolvedValueOnce(0) // ai-a: 0회
      .mockResolvedValueOnce(3) // ai-b: 3회 (스킵)
      .mockResolvedValueOnce(1); // ai-c: 1회
    mockCreate
      .mockResolvedValueOnce({ id: "notif-a" })
      .mockResolvedValueOnce({ id: "notif-c" });

    const result = await (checkOverdue as unknown as CheckOverdueRunner).run();

    expect(result).toEqual({ transitioned: 3, notified: 2 });
    expect(mockUpdate).toHaveBeenCalledTimes(3);
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(mockTrigger).toHaveBeenCalledTimes(2);
  });
});
