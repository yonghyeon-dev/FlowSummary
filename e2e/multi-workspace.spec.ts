import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });

let testUserId: string;
const workspaceIds: string[] = [];

test.beforeAll(async () => {
  const user = await prisma.user.findFirstOrThrow({
    where: { email: "e2e-test@flowsummary.test" },
  });
  testUserId = user.id;

  // 워크스페이스 3개 생성
  for (const name of ["팀 알파", "팀 베타", "팀 감마"]) {
    const ws = await prisma.workspace.create({
      data: {
        name,
        slug: `e2e-${name}-${Date.now()}`,
        memberships: { create: { userId: testUserId, role: "OWNER" } },
      },
    });
    workspaceIds.push(ws.id);
  }
});

test.afterAll(async () => {
  for (const id of workspaceIds) {
    await prisma.membership.deleteMany({ where: { workspaceId: id } }).catch(() => {});
    await prisma.workspace.delete({ where: { id } }).catch(() => {});
  }
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

// ── Test 1: 다중 워크스페이스 목록 표시 ──
test("워크스페이스 목록 — 다중 워크스페이스 표시", async ({ page }) => {
  test.setTimeout(60_000);
  await loginOnce(page);

  // 워크스페이스 목록에서 3개 모두 보이는지 확인
  await expect(page.locator("text=팀 알파")).toBeVisible();
  await expect(page.locator("text=팀 베타")).toBeVisible();
  await expect(page.locator("text=팀 감마")).toBeVisible();

  console.log("  ✓ 다중 워크스페이스 목록 표시 검증 완료");
});

// ── Test 2: 워크스페이스 간 네비게이션 ──
test("워크스페이스 간 네비게이션", async ({ page }) => {
  test.setTimeout(60_000);
  await loginOnce(page);

  // 첫 번째 워크스페이스 대시보드
  await page.goto(`/workspaces/${workspaceIds[0]}/dashboard`);
  await page.waitForLoadState("networkidle");
  expect(page.url()).toContain(workspaceIds[0]);

  // 두 번째 워크스페이스 대시보드
  await page.goto(`/workspaces/${workspaceIds[1]}/dashboard`);
  await page.waitForLoadState("networkidle");
  expect(page.url()).toContain(workspaceIds[1]);

  // 워크스페이스 목록으로 돌아가기
  await page.goto("/workspaces");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("text=팀 알파")).toBeVisible();
  await expect(page.locator("text=팀 베타")).toBeVisible();

  console.log("  ✓ 워크스페이스 간 네비게이션 검증 완료");
});

// ── Test 3: 빈 워크스페이스 — 회의 없음 상태 ──
test("빈 워크스페이스 — 회의 없음 표시", async ({ page }) => {
  test.setTimeout(60_000);
  await loginOnce(page);

  await page.goto(`/workspaces/${workspaceIds[2]}/meetings`);
  await page.waitForLoadState("networkidle");

  // 빈 상태 메시지
  await expect(
    page.locator("text=아직 회의가 없습니다").or(page.locator("text=회의가 없습니다"))
  ).toBeVisible({ timeout: 10000 });

  console.log("  ✓ 빈 워크스페이스 회의 없음 표시 검증 완료");
});

// ── Test 4: 로그아웃 ──
test("로그아웃 → 로그인 페이지 리다이렉트", async ({ page }) => {
  test.setTimeout(60_000);
  await loginOnce(page);

  // 로그아웃 버튼 클릭
  const logoutBtn = page.getByRole("button", { name: "로그아웃" });
  await expect(logoutBtn).toBeVisible();
  await logoutBtn.click();

  // 로그인 페이지로 리다이렉트
  await page.waitForURL("**/login**", { timeout: 10000 });
  await expect(
    page.getByRole("button", { name: "로그인", exact: true })
  ).toBeVisible();

  // 보호된 페이지 접근 시 리다이렉트
  await page.goto("/workspaces");
  await page.waitForURL("**/login**", { timeout: 10000 });

  console.log("  ✓ 로그아웃 + 리다이렉트 검증 완료");
});

// ── Test 5: 사이드바 네비게이션 ──
test("사이드바 네비게이션 — 대시보드/회의/할일/설정", async ({ page }) => {
  test.setTimeout(60_000);
  await loginOnce(page);

  await page.goto(`/workspaces/${workspaceIds[0]}/dashboard`);
  await page.waitForLoadState("networkidle");

  // 사이드바에서 회의 클릭
  await page.getByRole("link", { name: "회의" }).click();
  await page.waitForURL("**/meetings**", { timeout: 10000 });
  expect(page.url()).toContain("/meetings");

  // 사이드바에서 내 할 일 클릭
  await page.getByRole("link", { name: "내 할 일" }).click();
  await page.waitForURL("**/tasks**", { timeout: 10000 });
  expect(page.url()).toContain("/tasks");

  // 사이드바에서 설정 클릭
  await page.getByRole("link", { name: "설정" }).click();
  await page.waitForURL("**/settings**", { timeout: 10000 });
  expect(page.url()).toContain("/settings");

  // 사이드바에서 대시보드 클릭
  await page.getByRole("link", { name: "대시보드" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 10000 });
  expect(page.url()).toContain("/dashboard");

  console.log("  ✓ 사이드바 네비게이션 검증 완료");
});
