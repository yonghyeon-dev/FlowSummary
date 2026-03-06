import { test as setup, expect } from "@playwright/test";
import { ensureTestUser } from "./helpers";

const TEST_EMAIL = "e2e-test@flowsummary.test";
const TEST_PASSWORD = "E2eTest!234";
const AUTH_FILE = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // 테스트 유저 생성 (Supabase Auth)
  await ensureTestUser();

  // 로그인 폼으로 인증
  await page.goto("/login");
  await page.fill('input[name="email"]', TEST_EMAIL);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  await page.getByRole("button", { name: "로그인", exact: true }).click();

  // 로그인 성공 대기 (/workspaces로 리다이렉트)
  await page.waitForURL("**/workspaces**", { timeout: 15000 });

  // 인증 상태 저장
  await page.context().storageState({ path: AUTH_FILE });
});
