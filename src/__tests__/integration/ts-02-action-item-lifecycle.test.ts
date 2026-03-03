/**
 * TS-02: ActionItem 상태 전이 + 권한 검증
 *
 * extracted → confirmed → in_progress → done
 * overdue(시스템) / canceled(Admin) 규칙 검증
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActionItemStatus, MembershipRole } from "@prisma/client";

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockCreateMany = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    actionItem: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    actionItemHistory: {
      createMany: (...args: unknown[]) => mockCreateMany(...args),
    },
    $transaction: (fns: unknown[]) => mockTransaction(fns),
  },
}));

vi.mock("@/modules/auth", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/modules/workspace", () => ({
  requireWorkspaceMembership: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { updateActionItem } from "@/modules/action-item/internal/actions";
import { requireUser } from "@/modules/auth";
import { requireWorkspaceMembership } from "@/modules/workspace";
import {
  isValidActionTransition,
  VALID_ACTION_TRANSITIONS,
} from "@/modules/action-item/internal/state-machine";

describe("TS-02: ActionItem 상태 전이 + 권한 검증", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (fns: Promise<unknown>[]) => {
      for (const fn of fns) await fn;
    });
  });

  describe("상태 전이 규칙", () => {
    it("정상 사이클: extracted → confirmed → in_progress → done", () => {
      const cycle: ActionItemStatus[] = [
        ActionItemStatus.EXTRACTED,
        ActionItemStatus.CONFIRMED,
        ActionItemStatus.IN_PROGRESS,
        ActionItemStatus.DONE,
      ];

      for (let i = 0; i < cycle.length - 1; i++) {
        expect(isValidActionTransition(cycle[i], cycle[i + 1])).toBe(true);
      }
    });

    it("OVERDUE → IN_PROGRESS (재개) 허용", () => {
      expect(
        isValidActionTransition(
          ActionItemStatus.OVERDUE,
          ActionItemStatus.IN_PROGRESS
        )
      ).toBe(true);
    });

    it("OVERDUE → DONE 허용", () => {
      expect(
        isValidActionTransition(
          ActionItemStatus.OVERDUE,
          ActionItemStatus.DONE
        )
      ).toBe(true);
    });

    it("EXTRACTED → DONE 건너뛰기 금지", () => {
      expect(
        isValidActionTransition(
          ActionItemStatus.EXTRACTED,
          ActionItemStatus.DONE
        )
      ).toBe(false);
    });

    it("DONE / CANCELED 은 종단 상태", () => {
      expect(VALID_ACTION_TRANSITIONS[ActionItemStatus.DONE]).toEqual([]);
      expect(VALID_ACTION_TRANSITIONS[ActionItemStatus.CANCELED]).toEqual([]);
    });

    it("모든 비종단 상태에서 CANCELED 전이 가능", () => {
      const nonTerminal = [
        ActionItemStatus.EXTRACTED,
        ActionItemStatus.CONFIRMED,
        ActionItemStatus.IN_PROGRESS,
        ActionItemStatus.OVERDUE,
      ];

      for (const status of nonTerminal) {
        expect(
          isValidActionTransition(status, ActionItemStatus.CANCELED)
        ).toBe(true);
      }
    });
  });

  describe("권한 검증", () => {
    const baseItem = {
      id: "ai-1",
      status: ActionItemStatus.IN_PROGRESS,
      assigneeUserId: "user-assignee",
      title: "테스트 작업",
      dueDate: null,
      meeting: { workspaceId: "ws-1" },
    };

    it("DONE 전환: 담당자 본인 허용", async () => {
      vi.mocked(requireUser).mockResolvedValue({ id: "user-assignee" } as never);
      vi.mocked(requireWorkspaceMembership).mockResolvedValue({
        role: MembershipRole.MEMBER,
      } as never);
      mockFindUnique.mockResolvedValue(baseItem);

      await updateActionItem("ai-1", { status: ActionItemStatus.DONE });

      expect(mockTransaction).toHaveBeenCalled();
    });

    it("DONE 전환: Admin 허용", async () => {
      vi.mocked(requireUser).mockResolvedValue({ id: "user-admin" } as never);
      vi.mocked(requireWorkspaceMembership).mockResolvedValue({
        role: MembershipRole.ADMIN,
      } as never);
      mockFindUnique.mockResolvedValue(baseItem);

      await updateActionItem("ai-1", { status: ActionItemStatus.DONE });

      expect(mockTransaction).toHaveBeenCalled();
    });

    it("DONE 전환: 비담당 Member 거부", async () => {
      vi.mocked(requireUser).mockResolvedValue({ id: "user-other" } as never);
      vi.mocked(requireWorkspaceMembership).mockResolvedValue({
        role: MembershipRole.MEMBER,
      } as never);
      mockFindUnique.mockResolvedValue(baseItem);

      await expect(
        updateActionItem("ai-1", { status: ActionItemStatus.DONE })
      ).rejects.toThrow("담당자 본인 또는 Admin 이상만");
    });

    it("CANCELED 전환: Admin 이상만 허용", async () => {
      vi.mocked(requireUser).mockResolvedValue({ id: "user-member" } as never);
      vi.mocked(requireWorkspaceMembership).mockResolvedValue({
        role: MembershipRole.MEMBER,
      } as never);
      mockFindUnique.mockResolvedValue({
        ...baseItem,
        status: ActionItemStatus.CONFIRMED,
      });

      await expect(
        updateActionItem("ai-1", { status: ActionItemStatus.CANCELED })
      ).rejects.toThrow("Admin 이상만");
    });

    it("OVERDUE 수동 전환 불가", async () => {
      vi.mocked(requireUser).mockResolvedValue({ id: "user-admin" } as never);
      vi.mocked(requireWorkspaceMembership).mockResolvedValue({
        role: MembershipRole.ADMIN,
      } as never);
      mockFindUnique.mockResolvedValue(baseItem);

      await expect(
        updateActionItem("ai-1", { status: ActionItemStatus.OVERDUE })
      ).rejects.toThrow("시스템이 자동 전환");
    });
  });
});
