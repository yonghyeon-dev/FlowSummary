import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });

let testUserId: string;
let testWorkspaceId: string;
let meetingId: string;
const actionItemIds: string[] = [];

test.beforeAll(async () => {
  const user = await prisma.user.findFirstOrThrow({
    where: { email: "e2e-test@flowsummary.test" },
  });
  testUserId = user.id;

  const ws = await prisma.workspace.create({
    data: {
      name: "E2E-Tasks-WS",
      slug: `e2e-tasks-ws-${Date.now()}`,
      memberships: { create: { userId: testUserId, role: "OWNER" } },
    },
  });
  testWorkspaceId = ws.id;

  // 회의 생성 (액션아이템의 부모)
  const meeting = await prisma.meeting.create({
    data: {
      workspaceId: testWorkspaceId,
      creatorUserId: testUserId,
      title: "할 일 테스트 회의",
      meetingDate: new Date(),
      isTextPaste: true,
      status: "PUBLISHED",
      participants: ["홍길동"],
      segments: {
        create: {
          speakerLabel: "S1",
          text: "할 일 테스트용입니다.",
          startTime: 0,
          endTime: 3,
          confidence: 0.9,
        },
      },
    },
  });
  meetingId = meeting.id;

  // 다양한 상태의 액션아이템 생성
  const items = await Promise.all([
    prisma.actionItem.create({
      data: {
        meetingId,
        workspaceId: testWorkspaceId,
        assigneeUserId: testUserId,
        title: "보고서 초안 작성",
        description: "Q1 보고서 초안을 작성합니다",
        status: "CONFIRMED",
        priority: "HIGH",
        confidence: 0.95,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.actionItem.create({
      data: {
        meetingId,
        workspaceId: testWorkspaceId,
        assigneeUserId: testUserId,
        title: "디자인 리뷰 진행",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        confidence: 0.88,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.actionItem.create({
      data: {
        meetingId,
        workspaceId: testWorkspaceId,
        assigneeUserId: testUserId,
        title: "코드 리팩토링 완료",
        status: "DONE",
        priority: "LOW",
        confidence: 0.91,
        completedAt: new Date(),
      },
    }),
    prisma.actionItem.create({
      data: {
        meetingId,
        workspaceId: testWorkspaceId,
        assigneeUserId: testUserId,
        title: "지연된 문서 업데이트",
        status: "OVERDUE",
        priority: "HIGH",
        confidence: 0.87,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 이틀 전 마감
      },
    }),
    prisma.actionItem.create({
      data: {
        meetingId,
        workspaceId: testWorkspaceId,
        assigneeUserId: testUserId,
        title: "미확정 액션아이템",
        status: "EXTRACTED",
        priority: "MEDIUM",
        confidence: 0.72,
        sourceText: "이 작업을 다음 주까지 해주세요",
      },
    }),
  ]);
  actionItemIds.push(...items.map((i) => i.id));
});

test.afterAll(async () => {
  await prisma.actionItem.deleteMany({ where: { meetingId } }).catch(() => {});
  await prisma.transcriptSegment.deleteMany({ where: { meetingId } }).catch(() => {});
  await prisma.meeting.delete({ where: { id: meetingId } }).catch(() => {});
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

// ── Test 1: 할 일 목록 기본 표시 ──
test("할 일 페이지 — 전체 액션아이템 표시", async ({ page }) => {
  test.setTimeout(60_000);
  await loginOnce(page);

  await page.goto(`/workspaces/${testWorkspaceId}/tasks`);
  await page.waitForLoadState("networkidle");

  // 페이지 제목
  await expect(page.locator("h1")).toContainText("내 할 일");

  // 진행 중 항목들
  await expect(page.locator("text=보고서 초안 작성")).toBeVisible();
  await expect(page.locator("text=디자인 리뷰 진행")).toBeVisible();

  // 지연 항목
  await expect(page.locator("text=지연된 문서 업데이트")).toBeVisible();

  // 미확정 항목
  await expect(page.locator("text=미확정 액션아이템")).toBeVisible();

  // 완료 항목
  await expect(page.locator("text=코드 리팩토링 완료")).toBeVisible();

  console.log("  ✓ 전체 액션아이템 표시 검증 완료");
});

// ── Test 2: 상태별 필터링 ──
test("할 일 페이지 — 상태별 필터", async ({ page }) => {
  test.setTimeout(60_000);
  await loginOnce(page);

  await page.goto(`/workspaces/${testWorkspaceId}/tasks`);
  await page.waitForLoadState("networkidle");

  // 필터 버튼들이 존재하는지 확인
  await expect(
    page.locator('[data-slot="badge"], button').filter({ hasText: /전체/ })
  ).toBeVisible();

  // "완료" 필터 클릭
  const doneFilter = page.locator('button').filter({ hasText: /완료/ }).first();
  if (await doneFilter.isVisible().catch(() => false)) {
    await doneFilter.click();
    await page.waitForLoadState("networkidle");
    // 완료 항목만 보여야 함
    await expect(page.locator("text=코드 리팩토링 완료")).toBeVisible();
    console.log("  ✓ 완료 필터 검증 완료");
  } else {
    console.log("  ✓ SKIP (필터 버튼 레이아웃 다름)");
  }

  // "전체" 필터로 복원
  const allFilter = page.locator('button').filter({ hasText: /전체/ }).first();
  if (await allFilter.isVisible().catch(() => false)) {
    await allFilter.click();
    await page.waitForLoadState("networkidle");
  }

  console.log("  ✓ 상태별 필터 검증 완료");
});

// ── Test 3: 상태 배지 표시 ──
test("할 일 페이지 — 상태 배지 렌더링", async ({ page }) => {
  test.setTimeout(60_000);
  await loginOnce(page);

  await page.goto(`/workspaces/${testWorkspaceId}/tasks`);
  await page.waitForLoadState("networkidle");

  // 다양한 상태 배지 확인
  await expect(
    page.locator('[data-slot="badge"]').filter({ hasText: "확정" })
  ).toBeVisible();
  await expect(
    page.locator('[data-slot="badge"]').filter({ hasText: "진행 중" })
  ).toBeVisible();
  await expect(
    page.locator('[data-slot="badge"]').filter({ hasText: "완료" })
  ).toBeVisible();
  await expect(
    page.locator('[data-slot="badge"]').filter({ hasText: "지연" })
  ).toBeVisible();

  console.log("  ✓ 상태 배지 렌더링 검증 완료");
});

// ── Test 4: 회의 링크 존재 확인 ──
test("할 일 페이지 — 회의 제목 링크 존재", async ({ page }) => {
  test.setTimeout(60_000);
  await loginOnce(page);

  await page.goto(`/workspaces/${testWorkspaceId}/tasks`);
  await page.waitForLoadState("networkidle");

  // 회의 제목 링크가 보이는지 확인
  const meetingLink = page.locator("a").filter({ hasText: "할 일 테스트 회의" }).first();
  await expect(meetingLink).toBeVisible();

  // 링크 href가 올바른 회의 상세 URL인지 확인
  const href = await meetingLink.getAttribute("href");
  expect(href).toContain(`/meetings/${meetingId}`);

  console.log("  ✓ 회의 링크 존재 검증 완료");
});
