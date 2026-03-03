import { describe, it, expect } from "vitest";
import { toUtcFromTimezone } from "../timezone";

describe("toUtcFromTimezone", () => {
  it("should convert KST 09:00 to UTC 00:00", () => {
    // Asia/Seoul = UTC+9
    const baseDate = new Date("2026-03-10T00:00:00Z");
    const result = toUtcFromTimezone(baseDate, 9, "Asia/Seoul");

    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCDate()).toBe(10);
  });

  it("should convert US Eastern 09:00 to UTC 14:00 (EST, UTC-5)", () => {
    // 2026-01-15 is EST (UTC-5)
    const baseDate = new Date("2026-01-15T00:00:00Z");
    const result = toUtcFromTimezone(baseDate, 9, "America/New_York");

    expect(result.getUTCHours()).toBe(14);
    expect(result.getUTCDate()).toBe(15);
  });

  it("should handle UTC timezone directly", () => {
    const baseDate = new Date("2026-03-10T00:00:00Z");
    const result = toUtcFromTimezone(baseDate, 9, "UTC");

    expect(result.getUTCHours()).toBe(9);
    expect(result.getUTCDate()).toBe(10);
  });

  it("should handle JST (UTC+9) same as KST", () => {
    const baseDate = new Date("2026-03-10T00:00:00Z");
    const result = toUtcFromTimezone(baseDate, 9, "Asia/Tokyo");

    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCDate()).toBe(10);
  });
});
