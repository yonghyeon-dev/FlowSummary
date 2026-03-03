import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

interface GetAuditLogsParams {
  workspaceId: string;
  entity?: string;
  entityId?: string;
  limit?: number;
  cursor?: string;
}

export async function getAuditLogs(params: GetAuditLogsParams) {
  const limit = Math.min(params.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

  return prisma.auditLog.findMany({
    where: {
      workspaceId: params.workspaceId,
      ...(params.entity && { entity: params.entity }),
      ...(params.entityId && { entityId: params.entityId }),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(params.cursor && {
      skip: 1,
      cursor: { id: params.cursor },
    }),
  });
}
