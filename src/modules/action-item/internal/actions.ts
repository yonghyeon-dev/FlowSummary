"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/modules/auth";
import { requireWorkspaceMembership } from "@/modules/workspace";
import { ActionItemStatus, MembershipRole } from "@prisma/client";
import { isValidActionTransition } from "./state-machine";

export async function updateActionItem(
  actionItemId: string,
  data: {
    status?: ActionItemStatus;
    assigneeUserId?: string | null;
    dueDate?: string | null;
    title?: string;
    description?: string | null;
  }
) {
  const user = await requireUser();

  const item = await prisma.actionItem.findUnique({
    where: { id: actionItemId },
    include: {
      meeting: { select: { workspaceId: true } },
    },
  });

  if (!item) throw new Error("액션아이템을 찾을 수 없습니다");

  const membership = await requireWorkspaceMembership(
    user.id,
    item.meeting.workspaceId
  );

  // 권한 검사: DONE 전환은 담당자 본인 또는 Admin 이상
  if (data.status === ActionItemStatus.DONE) {
    const isAssignee = item.assigneeUserId === user.id;
    const isAdmin =
      membership.role === MembershipRole.ADMIN ||
      membership.role === MembershipRole.OWNER;
    if (!isAssignee && !isAdmin) {
      throw new Error("완료 처리는 담당자 본인 또는 Admin 이상만 가능합니다");
    }
  }

  // 상태 전환 검증
  if (data.status && data.status !== item.status) {
    // CANCELED는 Admin 이상만
    if (data.status === ActionItemStatus.CANCELED) {
      const isAdmin =
        membership.role === MembershipRole.ADMIN ||
        membership.role === MembershipRole.OWNER;
      if (!isAdmin) {
        throw new Error("취소는 Admin 이상만 가능합니다");
      }
    }

    // OVERDUE는 시스템만 (사용자 수동 변경 불가)
    if (data.status === ActionItemStatus.OVERDUE) {
      throw new Error("OVERDUE는 시스템이 자동 전환합니다");
    }

    if (!isValidActionTransition(item.status, data.status)) {
      throw new Error(
        `잘못된 상태 전이: ${item.status} → ${data.status}`
      );
    }
  }

  // 변경 이력 기록
  const histories: {
    actionItemId: string;
    changedBy: string;
    field: string;
    oldValue: string | null;
    newValue: string | null;
  }[] = [];

  if (data.status && data.status !== item.status) {
    histories.push({
      actionItemId,
      changedBy: user.id,
      field: "status",
      oldValue: item.status,
      newValue: data.status,
    });
  }

  if (data.assigneeUserId !== undefined && data.assigneeUserId !== item.assigneeUserId) {
    histories.push({
      actionItemId,
      changedBy: user.id,
      field: "assigneeUserId",
      oldValue: item.assigneeUserId,
      newValue: data.assigneeUserId,
    });
  }

  if (data.dueDate !== undefined) {
    const oldDue = item.dueDate ? item.dueDate.toISOString().split("T")[0] : null;
    const newDue = data.dueDate ?? null;
    if (oldDue !== newDue) {
      histories.push({
        actionItemId,
        changedBy: user.id,
        field: "dueDate",
        oldValue: oldDue,
        newValue: newDue,
      });
    }
  }

  if (data.title && data.title !== item.title) {
    histories.push({
      actionItemId,
      changedBy: user.id,
      field: "title",
      oldValue: item.title,
      newValue: data.title,
    });
  }

  // DB 업데이트
  const updateData: Record<string, unknown> = {};
  if (data.status) updateData.status = data.status;
  if (data.assigneeUserId !== undefined)
    updateData.assigneeUserId = data.assigneeUserId;
  if (data.dueDate !== undefined)
    updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (data.title) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status === ActionItemStatus.DONE)
    updateData.completedAt = new Date();

  await prisma.$transaction([
    prisma.actionItem.update({
      where: { id: actionItemId },
      data: updateData,
    }),
    ...(histories.length > 0
      ? [prisma.actionItemHistory.createMany({ data: histories })]
      : []),
  ]);

  revalidatePath(`/workspaces/${item.meeting.workspaceId}/meetings`);

  return { success: true };
}

export async function confirmActionItem(
  actionItemId: string,
  assigneeUserId: string | null,
  dueDate: string | null
) {
  return updateActionItem(actionItemId, {
    status: ActionItemStatus.CONFIRMED,
    assigneeUserId,
    dueDate,
  });
}
