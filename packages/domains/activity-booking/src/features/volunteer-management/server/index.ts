import "server-only";
import { getTenantDbManager } from "@base/db-tenant";
import { getServerAuthRuntime } from "@base/auth";
import type { AuditVolunteerInput } from "../contract";

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

export async function auditVolunteerService(organizationId: string, input: AuditVolunteerInput, userId: string) {
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(organizationId);

  return prisma.volunteerApplication.update({
    where: { id: input.applicationId },
    data: {
      status: input.action === "APPROVE" ? "APPROVED" : "REJECTED",
      auditRemark: input.remark,
      updatedById: userId,
    },
  });
}
