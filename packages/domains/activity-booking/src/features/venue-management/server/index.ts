import "server-only";
import { getTenantDbManager } from "@base/db-tenant";
import { getServerAuthRuntime } from "@base/auth";
import type { CreateVenueInput } from "../contract";

export async function listVenuesQuery(organizationId: string) {
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(organizationId);

  return prisma.venue.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
    include: { spaces: { where: { isDeleted: false } } },
  });
}

export async function createVenueService(organizationId: string, input: CreateVenueInput, userId: string) {
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(organizationId);

  return prisma.venue.create({
    data: {
      ...input,
      createdById: userId,
    },
  });
}
