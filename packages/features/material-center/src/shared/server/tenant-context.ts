import { headers } from "next/headers";
import { getCurrentTenantContext, type TenantContext } from "@base/auth";
import { getTenantDbManager, type TenantPrismaClient } from "@base/db-tenant";
import { ForbiddenError } from "@casl/ability";
import type { AppAbility } from "@base/authorization";

export interface TenantDbContext {
  readonly organizationId: string;
  readonly userId: string;
  readonly memberId: string;
  readonly role: string;
  readonly client: TenantPrismaClient;
  readonly tenantCtx: TenantContext;
  readonly employeeProfile: {
    id: string;
    memberId: string | null;
    departmentId: string | null;
    employeeNo: string | null;
    jobTitle: string | null;
    status: string;
  } | null;
}

/**
 * 纯技术底层：解析并获取当前租户物理数据库客户端与员工门禁校验。
 */
export async function getTenantDbContext(): Promise<TenantDbContext> {
  const reqHeaders = await headers();
  const tenantCtx = await getCurrentTenantContext(reqHeaders);

  const { getServerAuthRuntime, assertTenantAccessGate } = await import(
    "@base/auth"
  );
  const runtime = getServerAuthRuntime();

  const manager = getTenantDbManager({
    repository: runtime.tenantContextRepository,
  });

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
    role: tenantCtx.member.role,
    client: tenantPrisma,
    tenantCtx,
    employeeProfile,
  };
}

/**
 * 写路径强制 CASL 守卫：与页面按钮同一 (action, subject) 判定。
 */
export function assertMaterialAbility(
  ability: AppAbility<string, string>,
  action: string,
  subject: string,
): void {
  ForbiddenError.from(ability).throwUnlessCan(action, subject);
}
