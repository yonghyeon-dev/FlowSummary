import { prisma } from "@/lib/prisma";

export async function getPendingNotifications(limit = 50) {
  return prisma.notificationLog.findMany({
    where: {
      sent: false,
      scheduledAt: { lte: new Date() },
    },
    include: {
      user: { select: { email: true, name: true, timezone: true } },
      actionItem: {
        select: {
          id: true,
          title: true,
          dueDate: true,
          meeting: { select: { id: true, title: true, workspaceId: true } },
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
    take: limit,
  });
}

export async function getNotificationsByUser(
  userId: string,
  limit = 20
) {
  return prisma.notificationLog.findMany({
    where: { userId },
    include: {
      actionItem: {
        select: { id: true, title: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
