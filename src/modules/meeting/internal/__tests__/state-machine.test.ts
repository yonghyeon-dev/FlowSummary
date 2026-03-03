import { describe, it, expect } from "vitest";
import { MeetingStatus } from "@prisma/client";
import { isValidTransition, VALID_TRANSITIONS } from "../state-machine";

describe("Meeting 상태 전이", () => {
  describe("유효한 전이", () => {
    it("UPLOADED → PROCESSING", () => {
      expect(
        isValidTransition(MeetingStatus.UPLOADED, MeetingStatus.PROCESSING)
      ).toBe(true);
    });

    it("PROCESSING → REVIEW_NEEDED", () => {
      expect(
        isValidTransition(MeetingStatus.PROCESSING, MeetingStatus.REVIEW_NEEDED)
      ).toBe(true);
    });

    it("PROCESSING → FAILED", () => {
      expect(
        isValidTransition(MeetingStatus.PROCESSING, MeetingStatus.FAILED)
      ).toBe(true);
    });

    it("REVIEW_NEEDED → PUBLISHED", () => {
      expect(
        isValidTransition(
          MeetingStatus.REVIEW_NEEDED,
          MeetingStatus.PUBLISHED
        )
      ).toBe(true);
    });

    it("PUBLISHED → ARCHIVED", () => {
      expect(
        isValidTransition(MeetingStatus.PUBLISHED, MeetingStatus.ARCHIVED)
      ).toBe(true);
    });

    it("FAILED → PROCESSING (재시도)", () => {
      expect(
        isValidTransition(MeetingStatus.FAILED, MeetingStatus.PROCESSING)
      ).toBe(true);
    });
  });

  describe("잘못된 전이", () => {
    it("UPLOADED → PUBLISHED (건너뛰기 금지)", () => {
      expect(
        isValidTransition(MeetingStatus.UPLOADED, MeetingStatus.PUBLISHED)
      ).toBe(false);
    });

    it("UPLOADED → REVIEW_NEEDED (건너뛰기 금지)", () => {
      expect(
        isValidTransition(MeetingStatus.UPLOADED, MeetingStatus.REVIEW_NEEDED)
      ).toBe(false);
    });

    it("ARCHIVED → 어떤 상태로든 전이 불가", () => {
      expect(
        isValidTransition(MeetingStatus.ARCHIVED, MeetingStatus.PUBLISHED)
      ).toBe(false);
      expect(
        isValidTransition(MeetingStatus.ARCHIVED, MeetingStatus.UPLOADED)
      ).toBe(false);
    });

    it("REVIEW_NEEDED → PROCESSING (역방향 금지)", () => {
      expect(
        isValidTransition(
          MeetingStatus.REVIEW_NEEDED,
          MeetingStatus.PROCESSING
        )
      ).toBe(false);
    });

    it("FAILED → PUBLISHED (건너뛰기 금지)", () => {
      expect(
        isValidTransition(MeetingStatus.FAILED, MeetingStatus.PUBLISHED)
      ).toBe(false);
    });
  });

  describe("VALID_TRANSITIONS 맵", () => {
    it("모든 MeetingStatus가 키로 존재한다", () => {
      const allStatuses = Object.values(MeetingStatus);
      for (const status of allStatuses) {
        expect(VALID_TRANSITIONS).toHaveProperty(status);
      }
    });

    it("ARCHIVED는 빈 배열이다", () => {
      expect(VALID_TRANSITIONS[MeetingStatus.ARCHIVED]).toEqual([]);
    });
  });
});
