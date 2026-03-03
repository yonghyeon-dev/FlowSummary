import { describe, it, expect } from "vitest";
import { slugify } from "../slugify";

describe("slugify", () => {
  it("영문을 소문자로 변환한다", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("한글을 유지한다", () => {
    expect(slugify("우리 팀")).toBe("우리-팀");
  });

  it("특수문자를 제거한다", () => {
    expect(slugify("Team@#$%!")).toBe("team");
  });

  it("연속 공백/대시를 하나의 대시로 변환한다", () => {
    expect(slugify("a   b---c")).toBe("a-b-c");
  });

  it("앞뒤 대시를 제거한다", () => {
    expect(slugify("-hello-")).toBe("hello");
  });

  it("50자로 자른다", () => {
    const long = "a".repeat(100);
    expect(slugify(long).length).toBe(50);
  });

  it("빈 문자열이면 빈 문자열을 반환한다", () => {
    expect(slugify("")).toBe("");
  });

  it("특수문자만 있으면 빈 문자열을 반환한다", () => {
    expect(slugify("!@#$%")).toBe("");
  });

  it("영문+한글 혼합을 처리한다", () => {
    expect(slugify("FlowSummary 팀")).toBe("flowsummary-팀");
  });
});
