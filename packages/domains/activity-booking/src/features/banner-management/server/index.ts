import "server-only";
import { getTenantDbManager } from "@base/db-tenant";
import { getServerAuthRuntime } from "@base/auth";

export async function listBannersQuery(organizationId: string) {
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(organizationId);

  return prisma.banner.findMany({
    where: { isDeleted: false },
    orderBy: { sortOrder: "desc" },
  });
}
