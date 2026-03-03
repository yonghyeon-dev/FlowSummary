import { schedules } from "@trigger.dev/sdk/v3";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const RETENTION_DAYS = 30;

export const cleanupDeleted = schedules.task({
  id: "cleanup-deleted",
  // 매일 02:00 UTC 실행
  cron: "0 2 * * *",
  maxDuration: 300,
  run: async () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    // 1. 30일 이상 지난 soft-deleted 회의 조회
    const deletedMeetings = await prisma.meeting.findMany({
      where: {
        deletedAt: { not: null, lt: cutoffDate },
      },
      select: {
        id: true,
        assets: { select: { storagePath: true } },
      },
    });

    if (deletedMeetings.length === 0) {
      return { deleted: 0, storageCleanup: 0 };
    }

    // 2. Supabase Storage에서 파일 삭제
    let storageCleanup = 0;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      const allPaths = deletedMeetings.flatMap((m) =>
        m.assets.map((a) => a.storagePath)
      );

      if (allPaths.length > 0) {
        const { error } = await supabase.storage
          .from("meeting-files")
          .remove(allPaths);

        if (!error) {
          storageCleanup = allPaths.length;
        }
      }
    }

    // 3. DB hard-delete (cascade로 관련 레코드 모두 삭제)
    const meetingIds = deletedMeetings.map((m) => m.id);
    await prisma.meeting.deleteMany({
      where: { id: { in: meetingIds } },
    });

    return { deleted: meetingIds.length, storageCleanup };
  },
});
