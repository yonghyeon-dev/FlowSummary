import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

interface CreateAuditLogParams {
  workspaceId: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(params: CreateAuditLogParams) {
  return prisma.auditLog.create({
    data: {
      workspaceId: params.workspaceId,
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
