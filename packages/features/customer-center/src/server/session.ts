import { headers } from "next/headers";
import { getCurrentTenantContext } from "@chenrun/auth";
import { CaslAbilityFactory, type AppAbility } from "@chenrun/authorization";
import {
  getTenantDbManager,
  type TenantPrismaClient,
} from "@chenrun/db-tenant";
import { ForbiddenError } from "@casl/ability";
import { customerCatalog } from "../catalog";

export interface TenantCustomerContext {
  readonly organizationId: string;
  readonly userId: string;
  readonly memberId: string;
  readonly role: string;
  readonly client: TenantPrismaClient;
  readonly ability: AppAbility<string, string>;
}

/**
 * 解析并获取当前租户上下文下的 TenantPrismaClient 与 CASL Ability（Fail-Closed）。
 * 业务权限只认 CASL（ADR-007）：成员门禁之外，写操作必须再 `assertCustomerAbility`。
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

  const factory = new CaslAbilityFactory(
    runtime.tenantContextRepository,
    customerCatalog,
  );
  const ability = (await factory.createForTenant(tenantCtx)) as AppAbility<
    string,
    string
  >;

  return {
    organizationId: tenantCtx.organizationId,
    userId: tenantCtx.user.id,
    memberId: tenantCtx.member.id,
    role: tenantCtx.member.role,
    client: tenantPrisma,
    ability,
  };
}

/**
 * 写路径强制 CASL：与页面按钮同一 (action, subject) 判定。
 * 无权限时抛 ForbiddenError，由 defineServerAction 统一包装为失败结果。
 */
export function assertCustomerAbility(
  ability: AppAbility<string, string>,
  action: string,
  subject: string,
): void {
  ForbiddenError.from(ability).throwUnlessCan(action, subject);
}
