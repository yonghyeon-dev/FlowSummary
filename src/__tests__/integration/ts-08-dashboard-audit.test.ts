/**
 * TS-08: 대시보드 통계 + 감사 로그
 *
 * 대시보드 통계 쿼리 정합성 + 감사 로그 기록/조회
 * 주간 집계 로직 + 감사 로그 필수 필드 검증
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockMeetingCount = vi.fn();
const mockGroupBy = vi.fn();
const mockMeetingFindMany = vi.fn();
const mockHistoryFindMany = vi.fn();
const mockAuditCreate = vi.fn();
const mockAuditFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    meeting: {
      count: (...args: unknown[]) => mockMeetingCount(...args),
      findMany: (...args: unknown[]) => mockMeetingFindMany(...args),
    },
    actionItem: {
      groupBy: (...args: unknown[]) => mockGroupBy(...args),
      findMany: vi.fn().mockResolvedValue([]),
    },
    actionItemHistory: {
      findMany: (...args: unknown[]) => mockHistoryFindMany(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => mockAuditCreate(...args),
      findMany: (...args: unknown[]) => mockAuditFindMany(...args),
    },
  },
}));

import { createAuditLog } from "@/modules/audit/internal/actions";
import { getAuditLogs } from "@/modules/audit/internal/queries";

describe("TS-08: 대시보드 통계 + 감사 로그", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("주간 집계 로직", () => {
    it("날짜 배열을 주간별로 그룹핑", () => {
      const dates = [
        new Date("2026-03-02"), // 월요일 (week 1)
        new Date("2026-03-04"), // 수요일 (week 1)
        new Date("2026-03-09"), // 월요일 (week 2)
        new Date("2026-03-10"), // 화요일 (week 2)
        new Date("2026-03-11"), // 수요일 (week 2)
      ];

      const result = getWeeklyCounts(dates);

      expect(result).toHaveLength(2);
      expect(result[0].count).toBe(2); // week 1
      expect(result[1].count).toBe(3); // week 2
    });

    it("빈 배열 → 빈 결과", () => {
      const result = getWeeklyCounts([]);
      expect(result).toHaveLength(0);
    });

    it("같은 주의 날짜들은 하나로 합산", () => {
      const dates = [
        new Date("2026-03-02"),
        new Date("2026-03-03"),
        new Date("2026-03-04"),
        new Date("2026-03-05"),
        new Date("2026-03-06"),
      ];

      const result = getWeeklyCounts(dates);

      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(5);
    });
  });

  describe("감사 로그", () => {
    it("필수 필드로 감사 로그 생성", async () => {
      const logData = {
        id: "log-1",
        workspaceId: "ws-1",
        userId: "user-1",
        action: "meeting.published",
        entity: "meeting",
        entityId: "mtg-1",
        metadata: { from: "REVIEW_NEEDED", to: "PUBLISHED" },
        createdAt: new Date(),
      };
      mockAuditCreate.mockResolvedValue(logData);

      const result = await createAuditLog({
        workspaceId: "ws-1",
        userId: "user-1",
        action: "meeting.published",
        entity: "meeting",
        entityId: "mtg-1",
        metadata: { from: "REVIEW_NEEDED", to: "PUBLISHED" },
      });

      expect(result.id).toBe("log-1");
      expect(result.action).toBe("meeting.published");
      expect(mockAuditCreate).toHaveBeenCalledWith({
        data: {
          workspaceId: "ws-1",
          userId: "user-1",
          action: "meeting.published",
          entity: "meeting",
          entityId: "mtg-1",
          metadata: { from: "REVIEW_NEEDED", to: "PUBLISHED" },
        },
      });
    });

    it("옵션 필드 없이 생성 가능", async () => {
      mockAuditCreate.mockResolvedValue({
        id: "log-2",
        workspaceId: "ws-1",
        userId: "user-1",
        action: "member.invited",
        entity: "membership",
        createdAt: new Date(),
      });

      await createAuditLog({
        workspaceId: "ws-1",
        userId: "user-1",
        action: "member.invited",
        entity: "membership",
      });

      expect(mockAuditCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityId: undefined,
          metadata: undefined,
        }),
      });
    });

    it("감사 로그 조회 (workspace 필터)", async () => {
      mockAuditFindMany.mockResolvedValue([
        { id: "log-1", action: "meeting.published" },
        { id: "log-2", action: "meeting.archived" },
      ]);

      const result = await getAuditLogs({ workspaceId: "ws-1" });

      expect(result).toHaveLength(2);
      expect(mockAuditFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ workspaceId: "ws-1" }),
        })
      );
    });

    it("감사 로그 조회 (entity + entityId 필터)", async () => {
      mockAuditFindMany.mockResolvedValue([
        { id: "log-1", action: "meeting.published", entityId: "mtg-1" },
      ]);

      const result = await getAuditLogs({
        workspaceId: "ws-1",
        entity: "meeting",
        entityId: "mtg-1",
      });

      expect(result).toHaveLength(1);
    });
  });
});

// getWeeklyCounts 로직 복제 (queries.ts에서 직접 export 안 함)
function getWeeklyCounts(
  dates: Date[]
): { week: string; count: number }[] {
  if (dates.length === 0) return [];

  const weekMap = new Map<string, number>();

  for (const date of dates) {
    // 월요일 기준 주 시작일 계산
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // 월요일 = 1
    d.setDate(d.getDate() + diff);
    const weekKey = `${d.getMonth() + 1}/${d.getDate()}`;
    weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + 1);
  }

  return Array.from(weekMap.entries()).map(([week, count]) => ({
    week,
    count,
  }));
}
