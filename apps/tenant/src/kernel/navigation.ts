import { headers } from "next/headers";
import { getCurrentTenantContext, getServerAuthRuntime } from "@base/auth";
import {
  CaslAbilityFactory,
  filterNavSections,
  pruneDynamicMenuTree,
  buildMenuTree,
  type FeatureNavSection,
  type TenantMenuNode,
} from "@base/authorization";
import { getTenantDbManager } from "@base/db-tenant";
import { tenantAdminManifest } from "@platform/tenant-admin/manifest";
import {
  globalTenantCatalog,
  globalTenantPageCatalog,
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
 * 遵循严格的职责分离原则：
 * 1. 系统基座菜单 (工作台 + 企业系统管理)：属于不可被用户随意修改的系统内置能力，永远根据用户的 CASL 权限判定展示或隐藏；
 * 2. 业务自定义菜单：从租户独立物理库精准读取；若未检测到自定义菜单，则业务动态菜单区直接为空，绝不静默回退降级！
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

    // 1. 系统基座菜单 (工作台与系统管理)：永远存在，按 CASL 权限自动控制显示/隐藏，不属于业务自定义菜单
    const systemBaseSections = filterNavSections(
      tenantAdminManifest.navSections ?? [],
      can,
    );

    // 2. 尝试从当前租户独立物理库查询自定义业务菜单配置
    let customTree: TenantMenuNode[] = [];
    try {
      customTree = await getTenantCustomMenuTree(tenantCtx.organizationId);
    } catch {
      customTree = [];
    }

    // 3. 动态业务菜单安全剪枝（若未配置，自定义菜单为空，绝不展示未配置的业务菜单）
    const dynamicBusinessSections =
      customTree.length > 0
        ? pruneDynamicMenuTree(customTree, globalTenantPageCatalog, can)
        : [];

    // 4. 组装最终侧边栏结构：[前置基座(工作台)] -> [租户自定义业务菜单区] -> [系统管理配置区]
    const baseSection = systemBaseSections.find((s) => s.id === "base");
    const systemSection = systemBaseSections.find((s) => s.id === "system");
    const otherSystemSections = systemBaseSections.filter(
      (s) => s.id !== "base" && s.id !== "system",
    );

    const resultSections: FeatureNavSection[] = [];
    if (baseSection) resultSections.push(baseSection);
    if (dynamicBusinessSections.length > 0) {
      resultSections.push(...dynamicBusinessSections);
    }
    if (otherSystemSections.length > 0) {
      resultSections.push(...otherSystemSections);
    }
    if (systemSection) resultSections.push(systemSection);

    return resultSections;
  } catch {
    return [];
  }
}
