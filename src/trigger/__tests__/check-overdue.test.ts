import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActionItemStatus, NotificationType } from "@prisma/client";

// Mock Prisma
const mockFindMany = vi.fn();
const mockUpdate = vi.fn();
const mockCount = vi.fn();
const mockCreate = vi.fn();

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

// Mock Trigger.dev
const mockTrigger = vi.fn();
vi.mock("@trigger.dev/sdk/v3", () => ({
  schedules: {
    task: (config: { run: (...args: unknown[]) => unknown }) => config,
  },
  tasks: {
    trigger: (...args: unknown[]) => mockTrigger(...args),
  },
}));

// Import after mocks
import { checkOverdue } from "../check-overdue";

describe("check-overdue job", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
    mockTrigger.mockResolvedValue({});
  });

  it("should return zero counts when no overdue items", async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await (checkOverdue as unknown as { run: () => Promise<{ transitioned: number; notified: number }> }).run();

    expect(result).toEqual({ transitioned: 0, notified: 0 });
  });

  it("should transition items to OVERDUE and create notifications", async () => {
    mockFindMany.mockResolvedValue([
      { id: "ai-1", assigneeUserId: "user-1", status: ActionItemStatus.IN_PROGRESS },
    ]);
    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue({ id: "notif-1" });

    const result = await (checkOverdue as unknown as { run: () => Promise<{ transitioned: number; notified: number }> }).run();

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

  it("should skip notification when max reminders reached (3)", async () => {
    mockFindMany.mockResolvedValue([
      { id: "ai-2", assigneeUserId: "user-2", status: ActionItemStatus.CONFIRMED },
    ]);
    mockCount.mockResolvedValue(3); // already at max

    const result = await (checkOverdue as unknown as { run: () => Promise<{ transitioned: number; notified: number }> }).run();

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(result).toEqual({ transitioned: 1, notified: 0 });
  });

  it("should handle multiple items with mixed notification states", async () => {
    mockFindMany.mockResolvedValue([
      { id: "ai-1", assigneeUserId: "user-1", status: ActionItemStatus.IN_PROGRESS },
      { id: "ai-2", assigneeUserId: "user-2", status: ActionItemStatus.CONFIRMED },
    ]);
    // First item: 0 existing, Second item: 3 existing
    mockCount
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(3);
    mockCreate.mockResolvedValue({ id: "notif-1" });

    const result = await (checkOverdue as unknown as { run: () => Promise<{ transitioned: number; notified: number }> }).run();

    expect(result).toEqual({ transitioned: 2, notified: 1 });
  });
});
