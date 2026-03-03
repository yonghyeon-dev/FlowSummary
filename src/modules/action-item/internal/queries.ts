import { prisma } from "@/lib/prisma";
import { ActionItemStatus } from "@prisma/client";

export async function getActionItemsByMeeting(meetingId: string) {
  return prisma.actionItem.findMany({
    where: { meetingId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getActionItemsByUser(
  userId: string,
  workspaceId: string
) {
  return prisma.actionItem.findMany({
    where: {
      workspaceId,
      assigneeUserId: userId,
      status: {
        notIn: [ActionItemStatus.CANCELED],
      },
    },
    include: {
      meeting: { select: { id: true, title: true, meetingDate: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });
}

export async function getActionItemsByWorkspace(workspaceId: string) {
  return prisma.actionItem.findMany({
    where: {
      workspaceId,
      status: { notIn: [ActionItemStatus.CANCELED] },
    },
    include: {
      meeting: { select: { id: true, title: true, meetingDate: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });
}
