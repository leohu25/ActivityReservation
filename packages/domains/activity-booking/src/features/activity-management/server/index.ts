import "server-only";
import { getTenantDbManager } from "@base/db-tenant";
import { getServerAuthRuntime } from "@base/auth";
import type { CreateActivityInput, CreateSessionInput } from "../contract";

export async function listActivitiesQuery(organizationId: string) {
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(organizationId);

  return prisma.activity.findMany({
    where: { isDeleted: false },
    orderBy: { sortOrder: "desc" },
    include: {
      venue: { select: { id: true, name: true } },
      sessions: {
        where: { isDeleted: false },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      },
    },
  });
}

export async function getActivityDetailQuery(organizationId: string, activityId: string) {
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(organizationId);

  return prisma.activity.findUnique({
    where: { id: activityId, isDeleted: false },
    include: {
      venue: true,
      sessions: { where: { isDeleted: false } },
    },
  });
}

export async function createActivityService(organizationId: string, input: CreateActivityInput, userId: string) {
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(organizationId);

  return prisma.activity.create({
    data: {
      ...input,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      createdById: userId,
    },
  });
}

export async function createSessionService(organizationId: string, input: CreateSessionInput, userId: string) {
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(organizationId);

  return prisma.activitySession.create({
    data: {
      ...input,
      createdById: userId,
    },
  });
}
