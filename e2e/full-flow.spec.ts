import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });

let testUserId: string;
let testWorkspaceId: string;
let testMeetingId: string;

test("FlowSummary E2E — 전체 파이프라인", async ({ page }) => {
  test.setTimeout(120_000);

  // ── Setup: 글로벌에서 생성된 유저 조회 + 테스트 데이터 시딩 ──
  const user = await prisma.user.findFirstOrThrow({
    where: { email: "e2e-test@flowsummary.test" },
  });
  testUserId = user.id;

  const workspace = await prisma.workspace.create({
    data: {
      name: "E2E-Test-WS",
      slug: `e2e-test-ws-${Date.now()}`,
      memberships: { create: { userId: testUserId, role: "OWNER" } },
    },
  });
  testWorkspaceId = workspace.id;

  const meeting = await prisma.meeting.create({
    data: {
      workspaceId: testWorkspaceId,
      creatorUserId: testUserId,
      title: "E2E 테스트 회의",
      meetingDate: new Date(),
      isTextPaste: true,
      status: "REVIEW_NEEDED",
      participants: ["홍길동", "김철수"],
      segments: {
        createMany: {
          data: [
            { speakerLabel: "S1", speakerName: "홍길동", text: "이번 분기 매출 목표 달성률이 85%입니다.", startTime: 0, endTime: 5, confidence: 0.95 },
            { speakerLabel: "S2", speakerName: "김철수", text: "마케팅 예산을 10% 추가 배정하면 목표 달성 가능할 것 같습니다.", startTime: 5, endTime: 12, confidence: 0.93 },
            { speakerLabel: "S1", speakerName: "홍길동", text: "좋습니다. 다음 주 월요일까지 마케팅 계획서를 작성해주세요.", startTime: 12, endTime: 18, confidence: 0.91 },
            { speakerLabel: "S2", speakerName: "김철수", text: "네, 월요일까지 준비하겠습니다.", startTime: 18, endTime: 22, confidence: 0.94 },
            { speakerLabel: "S1", speakerName: "홍길동", text: "지난달 이탈 고객 분석도 부탁합니다.", startTime: 22, endTime: 27, confidence: 0.92 },
          ],
        },
      },
    },
  });
  testMeetingId = meeting.id;

  try {
    // ── 1. 비인증 접근 → 로그인 리다이렉트 ──
    console.log("  [1] 비인증 /workspaces → /login 리다이렉트");
    await page.goto("/workspaces");
    await page.waitForURL("**/login**");
    await expect(
      page.getByRole("button", { name: "로그인", exact: true })
    ).toBeVisible();
    console.log("  [1] ✓ PASS");

    // ── 2. 로그인 ──
    console.log("  [2] 로그인");
    await page.fill('input[name="email"]', "e2e-test@flowsummary.test");
    await page.fill('input[name="password"]', "E2eTest!234");
    await page.getByRole("button", { name: "로그인", exact: true }).click();
    await page.waitForURL("**/workspaces**", { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/workspaces");
    console.log("  [2] ✓ PASS");

    // ── 3. 워크스페이스 목록 ──
    console.log("  [3] 워크스페이스 목록에서 E2E-Test-WS 확인");
    await expect(page.locator("text=E2E-Test-WS")).toBeVisible({ timeout: 10000 });
    console.log("  [3] ✓ PASS");

    // ── 4. 대시보드 ──
    console.log("  [4] 대시보드");
    await page.goto(`/workspaces/${testWorkspaceId}/dashboard`);
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/dashboard");
    console.log("  [4] ✓ PASS");

    // ── 5. 회의 목록 ──
    console.log("  [5] 회의 목록");
    await page.goto(`/workspaces/${testWorkspaceId}/meetings`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=E2E 테스트 회의")).toBeVisible({ timeout: 10000 });
    console.log("  [5] ✓ PASS");

    // ── 6. 회의 상세 ──
    console.log("  [6] 회의 상세");
    await page.goto(`/workspaces/${testWorkspaceId}/meetings/${testMeetingId}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText("E2E 테스트 회의", { timeout: 10000 });
    await expect(page.locator("text=이번 분기 매출 목표 달성률")).toBeVisible();
    console.log("  [6] ✓ PASS");

    // ── 7. 설정 ──
    console.log("  [7] 설정 페이지");
    await page.goto(`/workspaces/${testWorkspaceId}/settings`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText("설정");
    await expect(page.getByRole("cell", { name: "Owner" })).toBeVisible();
    console.log("  [7] ✓ PASS");

    // ── 8. 할 일 ──
    console.log("  [8] 할 일 페이지");
    await page.goto(`/workspaces/${testWorkspaceId}/tasks`);
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/tasks");
    console.log("  [8] ✓ PASS");

    // ── 9. DB 검증 ──
    console.log("  [9] DB 무결성 검증");
    const dbMeeting = await prisma.meeting.findUnique({
      where: { id: testMeetingId },
      include: { segments: true },
    });
    expect(dbMeeting).not.toBeNull();
    expect(dbMeeting!.title).toBe("E2E 테스트 회의");
    expect(dbMeeting!.status).toBe("REVIEW_NEEDED");
    expect(dbMeeting!.segments.length).toBe(5);
    console.log(`  [9] ✓ PASS (segs=${dbMeeting!.segments.length})`);
  } finally {
    await prisma.transcriptSegment.deleteMany({ where: { meetingId: testMeetingId } }).catch(() => {});
    await prisma.meeting.delete({ where: { id: testMeetingId } }).catch(() => {});
    await prisma.membership.deleteMany({ where: { workspaceId: testWorkspaceId } }).catch(() => {});
    await prisma.workspace.delete({ where: { id: testWorkspaceId } }).catch(() => {});
    await prisma.$disconnect();
  }
});
