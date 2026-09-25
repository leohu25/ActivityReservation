import "server-only";
import { getTenantDbManager } from "@base/db-tenant";
import { getServerAuthRuntime } from "@base/auth";
import type { CreateNewsInput } from "../contract";

export async function listNewsQuery(organizationId: string) {
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(organizationId);

  return prisma.news.findMany({
    where: { isDeleted: false },
    orderBy: [{ isTop: "desc" }, { createdAt: "desc" }],
    include: { venue: { select: { id: true, name: true } } },
  });
}

export async function createNewsService(organizationId: string, input: CreateNewsInput, userId: string) {
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(organizationId);

  return prisma.news.create({
    data: {
      ...input,
      createdById: userId,
    },
  });
}
