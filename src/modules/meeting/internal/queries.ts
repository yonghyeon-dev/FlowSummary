import { prisma } from "@/lib/prisma";

export async function getMeetingsByWorkspace(workspaceId: string) {
  return prisma.meeting.findMany({
    where: { workspaceId },
    include: {
      creator: { select: { name: true, email: true } },
      _count: { select: { actionItems: true } },
    },
    orderBy: { meetingDate: "desc" },
  });
}

export async function getMeetingDetail(meetingId: string) {
  return prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      creator: { select: { name: true, email: true } },
      assets: true,
      segments: { orderBy: { startTime: "asc" } },
      summaries: { orderBy: { version: "desc" }, take: 1 },
      actionItems: {
        include: {
          assignee: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}
