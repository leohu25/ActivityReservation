import "server-only";
import { getTenantDbManager } from "@base/db-tenant";
import { getServerAuthRuntime } from "@base/auth";

export async function listVolunteersQuery(organizationId: string) {
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(organizationId);

  return prisma.volunteerApplication.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
    include: { activity: { select: { id: true, title: true } } },
  });
}
