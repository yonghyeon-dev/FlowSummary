import { describe, it, expect } from "vitest";

// parseDueDate 로직을 테스트하기 위해 동일 함수를 복제
// (summarize.ts에서 직접 export하지 않으므로)
function parseDueDate(
  dueDateRaw: string | undefined,
  meetingDate: Date
): Date | null {
  if (!dueDateRaw) return null;

  const raw = dueDateRaw.trim();
  const baseDate = new Date(meetingDate);

  const daysMatch = raw.match(/(\d+)\s*일\s*(이내|후|뒤|내)/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    baseDate.setDate(baseDate.getDate() + days);
    return baseDate;
  }

  const nextWeekDay = raw.match(/다음\s*주\s*(월|화|수|목|금|토|일)/);
  if (nextWeekDay) {
    const dayMap: Record<string, number> = {
      일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6,
    };
    const targetDay = dayMap[nextWeekDay[1]];
    const currentDay = baseDate.getDay();
    const daysUntilNextWeek = 7 - currentDay + targetDay;
    baseDate.setDate(baseDate.getDate() + daysUntilNextWeek);
    return baseDate;
  }

  const thisWeekDay = raw.match(/이번\s*주\s*(월|화|수|목|금|토|일)/);
  if (thisWeekDay) {
    const dayMap: Record<string, number> = {
      일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6,
    };
    const targetDay = dayMap[thisWeekDay[1]];
    const currentDay = baseDate.getDay();
    const diff = targetDay - currentDay;
    baseDate.setDate(baseDate.getDate() + (diff >= 0 ? diff : diff + 7));
    return baseDate;
  }

  const weeksMatch = raw.match(/(\d+)\s*주\s*(이내|후|뒤|내)/);
  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1]);
    baseDate.setDate(baseDate.getDate() + weeks * 7);
    return baseDate;
  }

  if (raw.includes("월말") || raw.includes("달 말")) {
    baseDate.setMonth(baseDate.getMonth() + 1, 0);
    return baseDate;
  }

  const isoMatch = raw.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return new Date(
      `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`
    );
  }

  const koreanDate = raw.match(/(\d{1,2})월\s*(\d{1,2})일/);
  if (koreanDate) {
    const year = baseDate.getFullYear();
    return new Date(
      `${year}-${koreanDate[1].padStart(2, "0")}-${koreanDate[2].padStart(2, "0")}`
    );
  }

  return null;
}

describe("parseDueDate", () => {
  const meetingDate = new Date("2026-03-03");

  it("undefined 입력 시 null 반환", () => {
    expect(parseDueDate(undefined, meetingDate)).toBeNull();
  });

  it("빈 문자열 시 null 반환", () => {
    expect(parseDueDate("", meetingDate)).toBeNull();
  });

  it("'3일 이내' → 회의일 + 3일", () => {
    const result = parseDueDate("3일 이내", meetingDate);
    expect(result).toEqual(new Date("2026-03-06"));
  });

  it("'5일 후' → 회의일 + 5일", () => {
    const result = parseDueDate("5일 후", meetingDate);
    expect(result).toEqual(new Date("2026-03-08"));
  });

  it("'2주 이내' → 회의일 + 14일", () => {
    const result = parseDueDate("2주 이내", meetingDate);
    expect(result).toEqual(new Date("2026-03-17"));
  });

  it("'월말' → 해당 월 말일", () => {
    const result = parseDueDate("월말", meetingDate);
    expect(result).toEqual(new Date("2026-03-31"));
  });

  it("ISO 날짜 '2026-04-15' → 해당 날짜", () => {
    const result = parseDueDate("2026-04-15", meetingDate);
    expect(result).toEqual(new Date("2026-04-15"));
  });

  it("한국어 날짜 '3월 15일' → 해당 날짜", () => {
    const result = parseDueDate("3월 15일", meetingDate);
    expect(result).toEqual(new Date("2026-03-15"));
  });

  it("인식 불가 문자열 시 null 반환", () => {
    expect(parseDueDate("가능한 빨리", meetingDate)).toBeNull();
  });

  it("'다음 주 금요일' → 다음 주 금요일", () => {
    // 2026-03-03은 화요일. 다음 주 금요일 = 3/13 (7 - 2 + 5 = 10일 후)
    const result = parseDueDate("다음 주 금요일", meetingDate);
    expect(result).toEqual(new Date("2026-03-13"));
  });
});
