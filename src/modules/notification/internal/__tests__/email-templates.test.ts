import { describe, it, expect } from "vitest";
import {
  assignmentEmailHtml,
  reminderEmailHtml,
  weeklySummaryEmailHtml,
} from "../email-templates";

describe("Email Templates", () => {
  describe("assignmentEmailHtml", () => {
    it("필수 필드가 HTML에 포함되어야 한다", () => {
      const html = assignmentEmailHtml({
        userName: "홍길동",
        meetingTitle: "주간 회의",
        actionItemTitle: "보고서 작성",
        dueDate: "2026-03-10",
        meetingUrl: "https://example.com/meetings/1",
      });
      expect(html).toContain("홍길동");
      expect(html).toContain("주간 회의");
      expect(html).toContain("보고서 작성");
      expect(html).toContain("2026-03-10");
      expect(html).toContain("https://example.com/meetings/1");
    });

    it("마감일이 null이면 마감일 표시 안 함", () => {
      const html = assignmentEmailHtml({
        userName: "홍길동",
        meetingTitle: "주간 회의",
        actionItemTitle: "보고서 작성",
        dueDate: null,
        meetingUrl: "https://example.com/meetings/1",
      });
      expect(html).not.toContain("마감일:");
    });

    it("UTF-8 meta 태그 포함", () => {
      const html = assignmentEmailHtml({
        userName: "테스트",
        meetingTitle: "테스트",
        actionItemTitle: "테스트",
        dueDate: null,
        meetingUrl: "https://example.com",
      });
      expect(html).toContain('charset="UTF-8"');
    });
  });

  describe("reminderEmailHtml", () => {
    it("리마인드 모드: '리마인드' 배지 표시", () => {
      const html = reminderEmailHtml({
        userName: "홍길동",
        actionItemTitle: "보고서 작성",
        dueDate: "2026-03-10",
        meetingTitle: "주간 회의",
        meetingUrl: "https://example.com/meetings/1",
        isOverdue: false,
      });
      expect(html).toContain("리마인드");
      expect(html).toContain("마감일이 다가오고 있습니다");
    });

    it("지연 모드: '지연' 배지 표시", () => {
      const html = reminderEmailHtml({
        userName: "홍길동",
        actionItemTitle: "보고서 작성",
        dueDate: "2026-03-01",
        meetingTitle: "주간 회의",
        meetingUrl: "https://example.com/meetings/1",
        isOverdue: true,
      });
      expect(html).toContain("지연");
      expect(html).toContain("마감일이 지난 할 일이 있습니다");
    });
  });

  describe("weeklySummaryEmailHtml", () => {
    it("통계와 아이템 목록이 포함되어야 한다", () => {
      const html = weeklySummaryEmailHtml({
        userName: "관리자",
        workspaceName: "개발팀",
        overdueCount: 3,
        inProgressCount: 5,
        items: [
          { title: "API 개발", assignee: "홍길동", dueDate: "2026-03-05" },
          { title: "UI 수정", assignee: "김철수", dueDate: null },
        ],
        dashboardUrl: "https://example.com/dashboard",
      });
      expect(html).toContain("관리자");
      expect(html).toContain("개발팀");
      expect(html).toContain("3");
      expect(html).toContain("5");
      expect(html).toContain("API 개발");
      expect(html).toContain("홍길동");
    });

    it("아이템이 없으면 빈 메시지 표시", () => {
      const html = weeklySummaryEmailHtml({
        userName: "관리자",
        workspaceName: "개발팀",
        overdueCount: 0,
        inProgressCount: 0,
        items: [],
        dashboardUrl: "https://example.com/dashboard",
      });
      expect(html).toContain("미완료 작업이 없습니다");
    });
  });
});
