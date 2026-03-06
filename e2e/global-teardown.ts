import { cleanupTestUser, supabaseAdmin } from "./helpers";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });

export default async function globalTeardown() {
  // E2E 테스트 데이터 전체 정리
  const testUser = await prisma.user.findFirst({
    where: { email: "e2e-test@flowsummary.test" },
  });

  if (testUser) {
    // 워크스페이스 관련 데이터 정리 (cascade로 처리 안 되는 것들)
    const memberships = await prisma.membership.findMany({
      where: { userId: testUser.id },
      select: { workspaceId: true },
    });
    const wsIds = memberships.map((m) => m.workspaceId);

    for (const wsId of wsIds) {
      // 회의 관련 데이터
      const meetings = await prisma.meeting.findMany({
        where: { workspaceId: wsId },
        select: { id: true },
      });
      const mtgIds = meetings.map((m) => m.id);

      await prisma.actionItem.deleteMany({ where: { meetingId: { in: mtgIds } } }).catch(() => {});
      await prisma.meetingSummary.deleteMany({ where: { meetingId: { in: mtgIds } } }).catch(() => {});
      await prisma.transcriptSegment.deleteMany({ where: { meetingId: { in: mtgIds } } }).catch(() => {});
      await prisma.meeting.deleteMany({ where: { workspaceId: wsId } }).catch(() => {});
      await prisma.membership.deleteMany({ where: { workspaceId: wsId } }).catch(() => {});
      await prisma.workspace.delete({ where: { id: wsId } }).catch(() => {});
    }

    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  }

  // Supabase Auth 유저 삭제
  await cleanupTestUser();
  await prisma.$disconnect();
  console.log("[global-teardown] Cleanup complete");
}
