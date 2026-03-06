import { createClient } from "@supabase/supabase-js";
import { BrowserContext } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const TEST_EMAIL = "e2e-test@flowsummary.test";
const TEST_PASSWORD = "E2eTest!234";
const TEST_NAME = "E2E 테스트";

export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * 테스트 유저 생성 (이미 있으면 기존 유저 사용)
 */
export async function ensureTestUser() {
  // 기존 유저 확인
  const { data: list } = await supabaseAdmin.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === TEST_EMAIL);

  if (existing) return existing;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { name: TEST_NAME },
  });

  if (error) throw new Error(`테스트 유저 생성 실패: ${error.message}`);
  return data.user;
}

/**
 * 이메일/비밀번호로 로그인하고 세션 토큰 반환
 */
export async function getTestSession() {
  const client = createClient(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await client.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (error) throw new Error(`테스트 로그인 실패: ${error.message}`);
  return data.session!;
}

/**
 * Playwright 컨텍스트에 인증 쿠키 주입
 */
export async function injectAuthCookies(
  context: BrowserContext,
  baseURL: string
) {
  const session = await getTestSession();
  const url = new URL(baseURL);

  // Supabase SSR은 청크 쿠키를 사용
  // sb-{ref}-auth-token 형태
  const ref = SUPABASE_URL.match(/\/\/([^.]+)/)?.[1] ?? "";
  const cookieName = `sb-${ref}-auth-token`;

  const cookieValue = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type,
  });

  // Supabase SSR은 큰 쿠키를 청크로 분할 (4096 바이트씩)
  const chunks = chunkString(cookieValue, 3500);

  const cookies = chunks.map((chunk, i) => ({
    name: i === 0 ? cookieName : `${cookieName}.${i}`,
    value: chunk,
    domain: url.hostname,
    path: "/",
    httpOnly: false,
    secure: url.protocol === "https:",
    sameSite: "Lax" as const,
  }));

  await context.addCookies(cookies);
  return session;
}

function chunkString(str: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.substring(i, i + size));
  }
  return chunks;
}

/**
 * 테스트 후 생성된 데이터 정리
 */
export async function cleanupTestUser() {
  const { data: list } = await supabaseAdmin.auth.admin.listUsers();
  const user = list?.users?.find((u) => u.email === TEST_EMAIL);
  if (user) {
    await supabaseAdmin.auth.admin.deleteUser(user.id);
  }
}
