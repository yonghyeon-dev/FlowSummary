/**
 * TS-05: 게시 → 알림 스케줄링 플로우
 *
 * Meeting PUBLISHED 전환 시 확정된 ActionItem 담당자에게
 * ASSIGNMENT 알림 생성 + send-reminder Job 트리거
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationType } from "@prisma/client";

const mockFindMany = vi.fn();
const mockCreateManyAndReturn = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    actionItem: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
    notificationLog: {
      createManyAndReturn: (...args: unknown[]) =>
        mockCreateManyAndReturn(...args),
    },
  },
}));

const mockTrigger = vi.fn();
vi.mock("@trigger.dev/sdk/v3", () => ({
  tasks: {
    trigger: (...args: unknown[]) => mockTrigger(...args),
  },
}));

import { scheduleAssignmentNotifications } from "@/modules/notification/internal/actions";

describe("TS-05: 게시 → 알림 스케줄링", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTrigger.mockResolvedValue({});
  });

  it("확정된 담당자에게 ASSIGNMENT 알림 생성", async () => {
    mockFindMany.mockResolvedValue([
      { id: "ai-1", assigneeUserId: "user-1" },
      { id: "ai-2", assigneeUserId: "user-2" },
    ]);
    mockCreateManyAndReturn.mockResolvedValue([
      { id: "notif-1" },
      { id: "notif-2" },
    ]);

    const result = await scheduleAssignmentNotifications("mtg-1");

    expect(result).toHaveLength(2);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        meetingId: "mtg-1",
        assigneeUserId: { not: null },
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
      },
      select: { id: true, assigneeUserId: true },
    });
    expect(mockCreateManyAndReturn).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: "user-1",
          actionItemId: "ai-1",
          type: NotificationType.ASSIGNMENT,
        }),
        expect.objectContaining({
          userId: "user-2",
          actionItemId: "ai-2",
          type: NotificationType.ASSIGNMENT,
        }),
      ],
    });
  });

  it("알림 생성 후 send-reminder Job 트리거", async () => {
    mockFindMany.mockResolvedValue([
      { id: "ai-1", assigneeUserId: "user-1" },
    ]);
    mockCreateManyAndReturn.mockResolvedValue([{ id: "notif-1" }]);

    await scheduleAssignmentNotifications("mtg-1");

    expect(mockTrigger).toHaveBeenCalledWith("send-reminder", {
      notificationLogId: "notif-1",
    });
  });

  it("담당자 없는 ActionItem은 알림 대상 제외", async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await scheduleAssignmentNotifications("mtg-1");

    expect(result).toEqual([]);
    expect(mockCreateManyAndReturn).not.toHaveBeenCalled();
    expect(mockTrigger).not.toHaveBeenCalled();
  });
});
