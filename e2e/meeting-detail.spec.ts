import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });

let testUserId: string;
let testWorkspaceId: string;
const meetingIds: string[] = [];

test.beforeAll(async () => {
  const user = await prisma.user.findFirstOrThrow({
    where: { email: "e2e-test@flowsummary.test" },
  });
  testUserId = user.id;

  const ws = await prisma.workspace.create({
    data: {
      name: "E2E-Detail-WS",
      slug: `e2e-detail-ws-${Date.now()}`,
      memberships: { create: { userId: testUserId, role: "OWNER" } },
    },
  });
  testWorkspaceId = ws.id;
});

test.afterAll(async () => {
  for (const id of meetingIds) {
    await prisma.actionItem.deleteMany({ where: { meetingId: id } }).catch(() => {});
    await prisma.meetingSummary.deleteMany({ where: { meetingId: id } }).catch(() => {});
    await prisma.transcriptSegment.deleteMany({ where: { meetingId: id } }).catch(() => {});
    await prisma.meeting.delete({ where: { id } }).catch(() => {});
  }
  await prisma.membership.deleteMany({ where: { workspaceId: testWorkspaceId } }).catch(() => {});
  await prisma.workspace.delete({ where: { id: testWorkspaceId } }).catch(() => {});
  await prisma.$disconnect();
});

async function loginOnce(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', "e2e-test@flowsummary.test");
  await page.fill('input[name="password"]', "E2eTest!234");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.waitForURL("**/workspaces**", { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}

// ── Test 1: 검수 필요 상태 + 요약 + 액션아이템 ──
test("회의 상세 — REVIEW_NEEDED + 요약 + 액션아이템", async ({ page }) => {
  test.setTimeout(60_000);

  const meeting = await prisma.meeting.create({
    data: {
      workspaceId: testWorkspaceId,
      creatorUserId: testUserId,
      title: "Q1 분기 리뷰",
      meetingDate: new Date(),
      isTextPaste: true,
      status: "REVIEW_NEEDED",
      participants: ["홍길동", "김철수"],
      segments: {
        createMany: {
          data: [
            { speakerLabel: "S1", speakerName: "홍길동", text: "이번 분기 실적을 검토하겠습니다.", startTime: 0, endTime: 4, confidence: 0.95 },
            { speakerLabel: "S2", speakerName: "김철수", text: "매출이 전분기 대비 15% 증가했습니다.", startTime: 4, endTime: 9, confidence: 0.93 },
          ],
        },
      },
      summaries: {
        create: {
          summary: "Q1 분기 실적 검토 회의에서 매출 15% 증가를 확인했습니다. 마케팅 예산 추가 배정과 고객 이탈 분석을 진행하기로 했습니다.",
          keyDecisions: [
            { decision: "마케팅 예산 10% 추가 배정", context: "매출 목표 달성을 위해" },
            { decision: "이탈 고객 분석 보고서 작성", context: "다음 주 월요일까지" },
          ],
          modelId: "gemini-2.5-flash",
          promptVersion: "1.0",
          version: 1,
        },
      },
      actionItems: {
        createMany: {
          data: [
            {
              workspaceId: testWorkspaceId,
              title: "마케팅 계획서 작성",
              description: "Q2 마케팅 전략 및 예산 계획서",
              status: "EXTRACTED",
              priority: "HIGH",
              confidence: 0.92,
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              sourceText: "다음 주 월요일까지 마케팅 계획서를 작성해주세요",
              assigneeUserId: testUserId,
            },
            {
              workspaceId: testWorkspaceId,
              title: "이탈 고객 분석 보고서",
              status: "EXTRACTED",
              priority: "MEDIUM",
              confidence: 0.65, // 낮은 confidence → "확인 필요"
              sourceText: "지난달 이탈 고객 분석도 부탁합니다",
            },
          ],
        },
      },
    },
  });
  meetingIds.push(meeting.id);

  await loginOnce(page);
  await page.goto(`/workspaces/${testWorkspaceId}/meetings/${meeting.id}`);
  await page.waitForLoadState("networkidle");

  // 제목
  await expect(page.locator("h1")).toContainText("Q1 분기 리뷰");

  // 상태 배지 — "검수 필요"
  await expect(
    page.locator('[data-slot="badge"]').filter({ hasText: "검수 필요" })
  ).toBeVisible();

  // 요약 카드
  await expect(
    page.locator('[data-slot="card"]').filter({ hasText: "요약" })
  ).toBeVisible();
  await expect(page.locator("text=매출 15% 증가를 확인")).toBeVisible();

  // 핵심 결정사항
  await expect(page.locator("text=마케팅 예산 10% 추가 배정")).toBeVisible();

  // 액션 아이템 카드
  await expect(
    page.locator('[data-slot="card"]').filter({ hasText: "액션 아이템" })
  ).toBeVisible();
  await expect(page.locator("text=마케팅 계획서 작성")).toBeVisible();
  await expect(
    page.getByText("이탈 고객 분석 보고서", { exact: true })
  ).toBeVisible();

  // 높음 우선순위
  await expect(page.locator(".text-red-600").filter({ hasText: "높음" })).toBeVisible();

  // 낮은 confidence → "확인 필요" 배지
  await expect(
    page.locator('[data-slot="badge"]').filter({ hasText: "확인 필요" })
  ).toBeVisible();

  // 전사 내용
  await expect(page.locator("text=이번 분기 실적을 검토")).toBeVisible();

  console.log("  ✓ REVIEW_NEEDED + 요약 + 액션아이템 검증 완료");
});

// ── Test 2: 게시됨 상태 ──
test("회의 상세 — PUBLISHED 상태", async ({ page }) => {
  test.setTimeout(60_000);

  const meeting = await prisma.meeting.create({
    data: {
      workspaceId: testWorkspaceId,
      creatorUserId: testUserId,
      title: "게시된 회의",
      meetingDate: new Date(),
      isTextPaste: true,
      status: "PUBLISHED",
      participants: ["홍길동"],
      segments: {
        create: {
          speakerLabel: "S1",
          speakerName: "홍길동",
          text: "게시 테스트용 회의입니다.",
          startTime: 0,
          endTime: 3,
          confidence: 0.95,
        },
      },
      summaries: {
        create: {
          summary: "게시된 회의 요약입니다.",
          modelId: "gemini-2.5-flash",
          version: 1,
        },
      },
    },
  });
  meetingIds.push(meeting.id);

  await loginOnce(page);
  await page.goto(`/workspaces/${testWorkspaceId}/meetings/${meeting.id}`);
  await page.waitForLoadState("networkidle");

  await expect(page.locator("h1")).toContainText("게시된 회의");
  await expect(
    page.locator('[data-slot="badge"]').filter({ hasText: "게시됨" })
  ).toBeVisible();
  await expect(page.locator("text=게시된 회의 요약입니다")).toBeVisible();

  console.log("  ✓ PUBLISHED 상태 검증 완료");
});

// ── Test 3: 실패 상태 + 에러 메시지 ──
test("회의 상세 — FAILED 상태 + 에러 메시지", async ({ page }) => {
  test.setTimeout(60_000);

  const meeting = await prisma.meeting.create({
    data: {
      workspaceId: testWorkspaceId,
      creatorUserId: testUserId,
      title: "실패한 회의",
      meetingDate: new Date(),
      isTextPaste: false,
      status: "FAILED",
      participants: ["홍길동"],
      errorMessage: "VITO API 전사 처리 실패: 오디오 형식을 인식할 수 없습니다",
    },
  });
  meetingIds.push(meeting.id);

  await loginOnce(page);
  await page.goto(`/workspaces/${testWorkspaceId}/meetings/${meeting.id}`);
  await page.waitForLoadState("networkidle");

  await expect(page.locator("h1")).toContainText("실패한 회의");

  // 실패 배지
  await expect(
    page.locator('[data-slot="badge"]').filter({ hasText: "실패" })
  ).toBeVisible();

  // 에러 메시지
  await expect(
    page.locator('[data-slot="card-title"]').filter({ hasText: "처리 실패" })
  ).toBeVisible();
  await expect(page.locator("text=오디오 형식을 인식할 수 없습니다")).toBeVisible();

  console.log("  ✓ FAILED 상태 + 에러 메시지 검증 완료");
});

// ── Test 4: 처리 중 상태 ──
test("회의 상세 — PROCESSING 상태", async ({ page }) => {
  test.setTimeout(60_000);

  const meeting = await prisma.meeting.create({
    data: {
      workspaceId: testWorkspaceId,
      creatorUserId: testUserId,
      title: "처리 중인 회의",
      meetingDate: new Date(),
      isTextPaste: false,
      status: "PROCESSING",
      participants: ["홍길동"],
    },
  });
  meetingIds.push(meeting.id);

  await loginOnce(page);
  await page.goto(`/workspaces/${testWorkspaceId}/meetings/${meeting.id}`);
  await page.waitForLoadState("networkidle");

  await expect(page.locator("h1")).toContainText("처리 중인 회의");
  await expect(
    page.locator('[data-slot="badge"]').filter({ hasText: "처리 중" })
  ).toBeVisible();

  console.log("  ✓ PROCESSING 상태 검증 완료");
});

// ── Test 5: 회의 목록 — 테이블 헤더 + 회의 존재 확인 ──
test("회의 목록 — 테이블 렌더링", async ({ page }) => {
  test.setTimeout(60_000);

  await loginOnce(page);
  await page.goto(`/workspaces/${testWorkspaceId}/meetings`);
  await page.waitForLoadState("networkidle");

  // 페이지 제목
  await expect(page.locator("h1")).toContainText("회의");

  // 테이블 헤더
  await expect(page.locator('[data-slot="table-head"]').filter({ hasText: "제목" })).toBeVisible();
  await expect(page.locator('[data-slot="table-head"]').filter({ hasText: "상태" })).toBeVisible();

  // 최소 1개 이상의 회의가 테이블에 존재
  const rows = page.locator('[data-slot="table-body"] [data-slot="table-row"]');
  await expect(rows.first()).toBeVisible();
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);

  // 상태 배지가 하나 이상 존재
  await expect(
    page.locator('[data-slot="table-body"] [data-slot="badge"]').first()
  ).toBeVisible();

  console.log(`  ✓ 회의 목록 테이블 렌더링 검증 완료 (${count}건)`);
});
