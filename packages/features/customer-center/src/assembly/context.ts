import { getServerAuthRuntime } from "@chenrun/auth";
import { CaslAbilityFactory, type AppAbility } from "@chenrun/authorization";
import { customerCatalog } from "../catalog";
import {
  getTenantDbContext,
  assertCustomerAbility,
  type TenantDbContext,
} from "../shared/server/tenant-context";

export interface TenantCustomerContext extends TenantDbContext {
  readonly ability: AppAbility<string, string>;
}

/**
 * 业务区域 (Business Area) 装配层：
 * 组合底座租户 DB 上下文与 Customer Center 全域 PermissionCatalog，
 * 编译出具备完整 CASL 权限树的运行时能力实例。
 */
export async function getTenantCustomerContext(): Promise<TenantCustomerContext> {
  const dbCtx = await getTenantDbContext();
  const runtime = getServerAuthRuntime();

  const factory = new CaslAbilityFactory(
    runtime.tenantContextRepository,
    customerCatalog,
  );
  const ability = (await factory.createForTenant(
    dbCtx.tenantCtx,
  )) as AppAbility<string, string>;

  return {
    ...dbCtx,
    ability,
  };
}

export { assertCustomerAbility };
