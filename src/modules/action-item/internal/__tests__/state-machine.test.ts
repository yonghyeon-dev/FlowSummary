import { describe, it, expect } from "vitest";
import { ActionItemStatus } from "@prisma/client";
import {
  isValidActionTransition,
  VALID_ACTION_TRANSITIONS,
} from "../state-machine";

describe("ActionItem State Machine", () => {
  describe("VALID_ACTION_TRANSITIONS", () => {
    it("모든 상태가 정의되어 있어야 한다", () => {
      const allStatuses = Object.values(ActionItemStatus);
      for (const status of allStatuses) {
        expect(VALID_ACTION_TRANSITIONS[status]).toBeDefined();
      }
    });

    it("DONE에서는 전이 불가", () => {
      expect(VALID_ACTION_TRANSITIONS[ActionItemStatus.DONE]).toEqual([]);
    });

    it("CANCELED에서는 전이 불가", () => {
      expect(VALID_ACTION_TRANSITIONS[ActionItemStatus.CANCELED]).toEqual([]);
    });
  });

  describe("isValidActionTransition", () => {
    // 유효한 전이
    it("EXTRACTED → CONFIRMED 허용", () => {
      expect(
        isValidActionTransition(
          ActionItemStatus.EXTRACTED,
          ActionItemStatus.CONFIRMED
        )
      ).toBe(true);
    });

    it("EXTRACTED → CANCELED 허용", () => {
      expect(
        isValidActionTransition(
          ActionItemStatus.EXTRACTED,
          ActionItemStatus.CANCELED
        )
      ).toBe(true);
    });

    it("CONFIRMED → IN_PROGRESS 허용", () => {
      expect(
        isValidActionTransition(
          ActionItemStatus.CONFIRMED,
          ActionItemStatus.IN_PROGRESS
        )
      ).toBe(true);
    });

    it("CONFIRMED → CANCELED 허용", () => {
      expect(
        isValidActionTransition(
          ActionItemStatus.CONFIRMED,
          ActionItemStatus.CANCELED
        )
      ).toBe(true);
    });

    it("IN_PROGRESS → DONE 허용", () => {
      expect(
        isValidActionTransition(
          ActionItemStatus.IN_PROGRESS,
          ActionItemStatus.DONE
        )
      ).toBe(true);
    });

    it("IN_PROGRESS → OVERDUE 허용", () => {
      expect(
        isValidActionTransition(
          ActionItemStatus.IN_PROGRESS,
          ActionItemStatus.OVERDUE
        )
      ).toBe(true);
    });

    it("OVERDUE → IN_PROGRESS 허용 (재개)", () => {
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

    it("OVERDUE → CANCELED 허용", () => {
      expect(
        isValidActionTransition(
          ActionItemStatus.OVERDUE,
          ActionItemStatus.CANCELED
        )
      ).toBe(true);
    });

    // 유효하지 않은 전이
    it("EXTRACTED → DONE 불허 (건너뛰기 금지)", () => {
      expect(
        isValidActionTransition(
          ActionItemStatus.EXTRACTED,
          ActionItemStatus.DONE
        )
      ).toBe(false);
    });

    it("EXTRACTED → IN_PROGRESS 불허 (건너뛰기 금지)", () => {
      expect(
        isValidActionTransition(
          ActionItemStatus.EXTRACTED,
          ActionItemStatus.IN_PROGRESS
        )
      ).toBe(false);
    });

    it("DONE → EXTRACTED 불허 (역방향 금지)", () => {
      expect(
        isValidActionTransition(
          ActionItemStatus.DONE,
          ActionItemStatus.EXTRACTED
        )
      ).toBe(false);
    });

    it("CANCELED → CONFIRMED 불허", () => {
      expect(
        isValidActionTransition(
          ActionItemStatus.CANCELED,
          ActionItemStatus.CONFIRMED
        )
      ).toBe(false);
    });

    it("CONFIRMED → EXTRACTED 불허 (역방향 금지)", () => {
      expect(
        isValidActionTransition(
          ActionItemStatus.CONFIRMED,
          ActionItemStatus.EXTRACTED
        )
      ).toBe(false);
    });
  });
});
