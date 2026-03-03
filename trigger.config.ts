import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "flow-summary",
  runtime: "node",
  logLevel: "log",
  maxDuration: 3600, // 60분 (긴 전사 작업 대응)
  dirs: ["src/trigger"],
});
