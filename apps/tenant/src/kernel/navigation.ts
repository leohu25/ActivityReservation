import { headers } from "next/headers";
import { getCurrentTenantContext, getServerAuthRuntime } from "@base/auth";
import {
  CaslAbilityFactory,
  filterNavSections,
  pruneDynamicMenuTree,
  buildMenuTree,
  deriveNavSections,
  type FeatureNavSection,
  type TenantMenuNode,
} from "@base/authorization";
import { getTenantDbManager } from "@base/db-tenant";
import {
  globalTenantCatalog,
  globalTenantPageCatalog,
  ALL_TENANT_MANIFESTS,
} from "./registry.generated";

/**
 * 获取租户物理库中配置的动态菜单树 (递归组装，支持任意层级)
 */
export async function getTenantCustomMenuTree(
  organizationId: string,
): Promise<TenantMenuNode[]> {
  try {
    const runtime = getServerAuthRuntime();
    const manager = getTenantDbManager({
      repository: runtime.tenantContextRepository,
    });
    const tenantPrisma = await manager.getClient(organizationId);

    const items = await tenantPrisma.tenantMenuItem.findMany({
      where: {
        isDeleted: false,
        isVisible: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    if (items.length === 0) return [];

    return buildMenuTree(items);
  } catch {
    return [];
  }
}

/**
 * 服务端获取当前登录租户成员已授权的导航菜单区块 (Server-Side Navigation Engine)
 * 遵循统一大一统模型与四重防锁死容灾原则：
 * 1. 统一动态树：从租户独立物理库读取自定义菜单树（自由编排业务菜单与系统管理菜单）；
 * 2. 纯数据安全剪枝：调用 pruneDynamicMenuTree 结合用户 CASL 权限进行 Fail-Closed 裁切，无权项与空目录自动剔除；
 * 3. 初始/清空平滑回退：若租户未配置自定义树（isDefault），安全回退到全量切片出厂推荐预设树；
 * 4. 防锁死容灾注入 (Emergency Fallback Injection)：管理员登录时，若已渲染菜单中意外缺失菜单导航设置入口，自动兜底注入系统管理区。
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

    const can = (action: string, subject: string) =>
      ability.can(action as never, subject as never);

    // 1. 尝试从当前租户独立物理库查询自定义菜单配置
    let customTree: TenantMenuNode[] = [];
    try {
      customTree = await getTenantCustomMenuTree(tenantCtx.organizationId);
    } catch {
      customTree = [];
    }

    // 2. 若租户未配置任何自定义菜单（或初次使用），安全回退到系统全量出厂预设菜单
    if (customTree.length === 0) {
      const allDefaultSections = deriveNavSections(ALL_TENANT_MANIFESTS);
      return filterNavSections(allDefaultSections, can);
    }

    // 3. 动态菜单递归安全剪枝 (当前用户无权的叶子项或空目录自动剔除)
    const resultSections = pruneDynamicMenuTree(
      customTree,
      globalTenantPageCatalog,
      can,
    );

    const defaultSections = deriveNavSections(ALL_TENANT_MANIFESTS);

    // 4. 工作台保底（若自定义树中未挂载工作台，自动在最顶端补充系统基座工作台）
    const hasWorkbench = resultSections.some((sec) =>
      sec.items.some((item) => {
        if ("href" in item && item.href === "/workbench") return true;
        if ("items" in item && Array.isArray(item.items)) {
          return item.items.some((sub) => sub.href === "/workbench");
        }
        return false;
      }),
    );
    if (!hasWorkbench) {
      const baseSections = filterNavSections(
        defaultSections.filter((s) => s.id === "base"),
        can,
      );
      resultSections.unshift(...baseSections);
    }

    // 5. 防锁死容灾自动注入 (Anti-Lockout Fallback Injection)
    // 检查已授权菜单中是否包含管理入口（例如 /settings/navigation）
    const hasNavManagement = resultSections.some((sec) =>
      sec.items.some((item) => {
        if ("href" in item && item.href === "/settings/navigation") return true;
        if ("items" in item && Array.isArray(item.items)) {
          return item.items.some((sub) => sub.href === "/settings/navigation");
        }
        return false;
      }),
    );

    // 若当前用户拥有菜单管理权限，但菜单树中由于意外/历史遗留数据未包含管理入口，自动在底部注入系统管理区
    if (!hasNavManagement && can("read", "TenantMenuItem")) {
      const fallbackSystemSections = filterNavSections(
        defaultSections.filter((s) => s.id === "system"),
        can,
      );
      resultSections.push(...fallbackSystemSections);
    }

    return resultSections;
  } catch {
    return [];
  }
}
