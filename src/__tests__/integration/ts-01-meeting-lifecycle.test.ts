/**
 * TS-01: Meeting 상태 전이 전체 사이클
 *
 * uploaded → processing → review_needed → published → archived
 * 전이 규칙 위반 시 에러, 각 단계 정상 전환 검증
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MeetingStatus } from "@prisma/client";

const mockUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    meeting: {
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

import {
  isValidTransition,
  transitionMeetingStatus,
  VALID_TRANSITIONS,
} from "@/modules/meeting/internal/state-machine";

describe("TS-01: Meeting 상태 전이 전체 사이클", () => {
  const mockPrisma = {
    meeting: { update: mockUpdate },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({ id: "mtg-1", status: "PUBLISHED" });
  });

  it("정상 사이클: uploaded → processing → review_needed → published → archived", () => {
    const cycle: MeetingStatus[] = [
      MeetingStatus.UPLOADED,
      MeetingStatus.PROCESSING,
      MeetingStatus.REVIEW_NEEDED,
      MeetingStatus.PUBLISHED,
      MeetingStatus.ARCHIVED,
    ];

    for (let i = 0; i < cycle.length - 1; i++) {
      expect(isValidTransition(cycle[i], cycle[i + 1])).toBe(true);
    }
  });

  it("실패 & 재시도 사이클: processing → failed → processing → review_needed", () => {
    expect(
      isValidTransition(MeetingStatus.PROCESSING, MeetingStatus.FAILED)
    ).toBe(true);
    expect(
      isValidTransition(MeetingStatus.FAILED, MeetingStatus.PROCESSING)
    ).toBe(true);
    expect(
      isValidTransition(MeetingStatus.PROCESSING, MeetingStatus.REVIEW_NEEDED)
    ).toBe(true);
  });

  it("건너뛰기 금지: uploaded → published 불허", () => {
    expect(
      isValidTransition(MeetingStatus.UPLOADED, MeetingStatus.PUBLISHED)
    ).toBe(false);
  });

  it("역방향 금지: published → review_needed 불허", () => {
    expect(
      isValidTransition(MeetingStatus.PUBLISHED, MeetingStatus.REVIEW_NEEDED)
    ).toBe(false);
  });

  it("ARCHIVED는 종단 상태 (전이 불가)", () => {
    expect(VALID_TRANSITIONS[MeetingStatus.ARCHIVED]).toEqual([]);
  });

  it("transitionMeetingStatus: 유효한 전이 시 DB 업데이트", async () => {
    await transitionMeetingStatus(
      mockPrisma,
      "mtg-1",
      MeetingStatus.REVIEW_NEEDED,
      MeetingStatus.PUBLISHED
    );

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "mtg-1" },
      data: { status: MeetingStatus.PUBLISHED },
    });
  });

  it("transitionMeetingStatus: 잘못된 전이 시 에러", async () => {
    await expect(
      transitionMeetingStatus(
        mockPrisma,
        "mtg-1",
        MeetingStatus.UPLOADED,
        MeetingStatus.PUBLISHED
      )
    ).rejects.toThrow("잘못된 상태 전이");
  });

  it("transitionMeetingStatus: FAILED 전이 시 errorMessage 저장", async () => {
    await transitionMeetingStatus(
      mockPrisma,
      "mtg-1",
      MeetingStatus.PROCESSING,
      MeetingStatus.FAILED,
      "VITO API timeout"
    );

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "mtg-1" },
      data: { status: MeetingStatus.FAILED, errorMessage: "VITO API timeout" },
    });
  });
});
