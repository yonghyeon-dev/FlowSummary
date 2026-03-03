import { describe, it, expect, vi, beforeEach } from "vitest";

// Prisma mock
const mockCreate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

import { createAuditLog } from "../actions";

describe("createAuditLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({
      id: "log-1",
      workspaceId: "ws-1",
      userId: "user-1",
      action: "meeting.status_changed",
      entity: "meeting",
      entityId: "mtg-1",
      metadata: { from: "REVIEW_NEEDED", to: "PUBLISHED" },
      createdAt: new Date(),
    });
  });

  it("should create an audit log with all fields", async () => {
    const result = await createAuditLog({
      workspaceId: "ws-1",
      userId: "user-1",
      action: "meeting.status_changed",
      entity: "meeting",
      entityId: "mtg-1",
      metadata: { from: "REVIEW_NEEDED", to: "PUBLISHED" },
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        workspaceId: "ws-1",
        userId: "user-1",
        action: "meeting.status_changed",
        entity: "meeting",
        entityId: "mtg-1",
        metadata: { from: "REVIEW_NEEDED", to: "PUBLISHED" },
      },
    });
    expect(result.id).toBe("log-1");
  });

  it("should create an audit log without optional fields", async () => {
    mockCreate.mockResolvedValue({
      id: "log-2",
      workspaceId: "ws-1",
      userId: "user-1",
      action: "member.role_changed",
      entity: "membership",
      entityId: undefined,
      metadata: undefined,
      createdAt: new Date(),
    });

    await createAuditLog({
      workspaceId: "ws-1",
      userId: "user-1",
      action: "member.role_changed",
      entity: "membership",
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        workspaceId: "ws-1",
        userId: "user-1",
        action: "member.role_changed",
        entity: "membership",
        entityId: undefined,
        metadata: undefined,
      },
    });
  });
});
