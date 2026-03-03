import { defineConfig } from "@trigger.dev/sdk/v3";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";

export default defineConfig({
  project: "proj_elwifeioyrdlpixlxyru",
  runtime: "node",
  logLevel: "log",
  maxDuration: 3600, // 60분 (긴 전사 작업 대응)
  dirs: ["src/trigger"],
  build: {
    extensions: [
      prismaExtension({
        schema: "prisma/schema.prisma",
      }),
    ],
  },
});
