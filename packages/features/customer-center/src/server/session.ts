import { headers } from "next/headers";
import { getCurrentTenantContext } from "@chenrun/auth";
import { getTenantDbManager } from "@chenrun/db-tenant";
import {
  getCustomerPrismaClient,
  type CustomerPrismaClient,
} from "../db/client";

export interface TenantCustomerContext {
  readonly organizationId: string;
  readonly userId: string;
  readonly memberId: string;
  readonly client: CustomerPrismaClient;
}

/**
 * 解析并获取当前租户上下文下的 CustomerPrismaClient
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

  // 获得租户主库以检查员工状态门禁
  const tenantBasePrisma = await manager.getClient(tenantCtx.organizationId);
  const employeeProfile = await tenantBasePrisma.employeeProfile.findUnique({
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

  // 解析当前租户独立数据库连接 URL
  const secretResolver = (manager as any).secretResolver;
  const tenantRecord = await runtime.tenantContextRepository.findTenantDatabase(
    tenantCtx.organizationId,
  );
  if (!tenantRecord) {
    throw new Error(
      `Tenant database not configured for organization ${tenantCtx.organizationId}`,
    );
  }

  const databaseUrl = await secretResolver.resolveDatabaseUrl(
    tenantRecord.secretRef,
  );
  const customerClient = getCustomerPrismaClient(databaseUrl);

  return {
    organizationId: tenantCtx.organizationId,
    userId: tenantCtx.user.id,
    memberId: tenantCtx.member.id,
    client: customerClient,
  };
}
