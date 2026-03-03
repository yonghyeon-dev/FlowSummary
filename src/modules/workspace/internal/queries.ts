import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getUserWorkspaces(userId: string) {
  return prisma.workspace.findMany({
    where: {
      memberships: {
        some: {
          userId,
          isActive: true,
        },
      },
    },
    include: {
      memberships: {
        where: { isActive: true },
        select: { role: true, userId: true },
      },
      _count: {
        select: { memberships: { where: { isActive: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getWorkspaceWithMembers(workspaceId: string) {
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      memberships: {
        where: { isActive: true },
        include: {
          user: {
            select: { id: true, email: true, name: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function requireWorkspaceMembership(
  userId: string,
  workspaceId: string
) {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId },
    },
  });

  if (!membership || !membership.isActive) {
    redirect("/workspaces");
  }

  return membership;
}
