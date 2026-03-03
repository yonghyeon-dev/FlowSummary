import { prisma } from "@/lib/prisma";
import { MeetingStatus } from "@prisma/client";

export async function getMeetingsByWorkspace(
  workspaceId: string,
  options?: { includeArchived?: boolean }
) {
  const includeArchived = options?.includeArchived ?? false;

  return prisma.meeting.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      ...(!includeArchived && { status: { not: MeetingStatus.ARCHIVED } }),
    },
    include: {
      creator: { select: { name: true, email: true } },
      _count: { select: { actionItems: true } },
    },
    orderBy: { meetingDate: "desc" },
  });
}

export async function getMeetingDetail(meetingId: string) {
  return prisma.meeting.findFirst({
    where: { id: meetingId, deletedAt: null },
    include: {
      creator: { select: { name: true, email: true } },
      assets: true,
      segments: { orderBy: { startTime: "asc" } },
      summaries: { orderBy: { version: "desc" }, take: 1 },
      actionItems: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}
