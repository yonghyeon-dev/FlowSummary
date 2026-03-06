import { ensureTestUser } from "./helpers";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });

export default async function globalSetup() {
  // Supabase Auth 유저 생성 (이미 있으면 재사용)
  const user = await ensureTestUser();

  // Prisma User upsert
  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: "e2e-test@flowsummary.test",
      name: "E2E 테스트",
      timezone: "Asia/Seoul",
      notificationEnabled: true,
    },
  });

  await prisma.$disconnect();
  console.log(`[global-setup] Test user ready: ${user.id}`);
}
