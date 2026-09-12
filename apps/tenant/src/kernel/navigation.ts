import { headers } from "next/headers";
import { getCurrentTenantContext, getServerAuthRuntime } from "@base/auth";
import {
  CaslAbilityFactory,
  filterNavSections,
  type FeatureNavSection,
} from "@base/authorization";
import {
  globalTenantCatalog,
  globalTenantNavSections,
} from "./registry.generated";

/**
 * 服务端获取当前登录租户成员已授权的导航菜单区块 (Server-Side Navigation Engine)
 * 使用 CASL Ability 过滤无权访问的项目与空分组，直接返回已裁切完毕的纯数据菜单
 */
export async function getAuthorizedTenantNavSections(): Promise<
  FeatureNavSection[]
> {
  try {
    const reqHeaders = await headers();
    const runtime = getServerAuthRuntime();
    const tenantCtx = await getCurrentTenantContext(reqHeaders);
    const factory = new CaslAbilityFactory(
      runtime.tenantContextRepository,
      globalTenantCatalog,
    );
    const ability = await factory.createForTenant(tenantCtx);

    return filterNavSections(globalTenantNavSections, (action, subject) =>
      ability.can(action as never, subject as never),
    );
  } catch {
    return [];
  }
}
