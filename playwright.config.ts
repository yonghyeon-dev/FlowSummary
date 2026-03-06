import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: "https://flowsummary.vercel.app",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    browserName: "chromium",
  },
  testMatch: /\.spec\.ts$/,
  testIgnore: /auth\.setup\.ts/,
});
