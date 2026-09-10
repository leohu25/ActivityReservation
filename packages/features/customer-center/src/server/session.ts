import { headers } from "next/headers";
import { getCurrentTenantContext } from "@chenrun/auth";
import {
  getTenantDbManager,
  type TenantPrismaClient,
} from "@chenrun/db-tenant";

export interface TenantCustomerContext {
  readonly organizationId: string;
  readonly userId: string;
  readonly memberId: string;
  readonly client: TenantPrismaClient;
}

/**
 * 解析并获取当前租户上下文下的全量 TenantPrismaClient
 */
export async function getTenantCustomerContext(): Promise<TenantCustomerContext> {
  const reqHeaders = await headers();
  const tenantCtx = await getCurrentTenantContext(reqHeaders);

  const { getServerAuthRuntime, assertTenantAccessGate } = await import(
    "@chenrun/auth"
  );
  const runtime = getServerAuthRuntime();

  const manager = getTenantDbManager({
    repository: runtime.tenantContextRepository,
  });

  // 获得租户统一物理库客户端并检查员工状态门禁
  const tenantPrisma = await manager.getClient(tenantCtx.organizationId);
  const employeeProfile = await tenantPrisma.employeeProfile.findUnique({
    where: { memberId: tenantCtx.member.id },
    select: {
      id: true,
      memberId: true,
      departmentId: true,
      employeeNo: true,
      jobTitle: true,
      status: true,
    },
  });
  assertTenantAccessGate(employeeProfile);

  return {
    organizationId: tenantCtx.organizationId,
    userId: tenantCtx.user.id,
    memberId: tenantCtx.member.id,
    client: tenantPrisma,
  };
}
