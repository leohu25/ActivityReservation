import type { DataScopeType } from "./data-scope";
import type { PermissionDefinition } from "./catalog";
import { createPermissionCatalog, type PermissionCatalog } from "./catalog";

/**
 * 导航叶子项模型（纯数据，完全兼容 RSC 跨端序列化）
 */
export interface FeatureNavItem {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  /** 图标名称 (例如 'PackageCheck', 'UserCheck', 'LayoutDashboard') */
  readonly icon?: string;
  readonly badge?: string;
  readonly requiredAction?: string;
  readonly requiredSubject?: string;
}

/**
 * 导航折叠分组模型
 */
export interface FeatureNavGroup {
  readonly id: string;
  readonly label: string;
  /** 图标名称 (例如 'Users', 'Settings', 'ShieldCheck') */
  readonly icon?: string;
  readonly items: readonly FeatureNavItem[];
}

/**
 * 顶级导航区块模型 (如 'base', 'customer', 'biz', 'system')
 */
export interface FeatureNavSection {
  readonly id: string;
  readonly title?: string;
  readonly order?: number;
  readonly items: readonly (FeatureNavItem | FeatureNavGroup)[];
}

/**
 * 敏感/可配置字段元数据
 */
export interface FeatureConfigurableField {
  readonly field: string;
  readonly label: string;
  readonly sensitive?: boolean;
}

/**
 * 权限动作配置项模型
 */
export interface FeatureActionConfigItem {
  readonly action: string;
  readonly label: string;
  readonly supportedScopes?: readonly DataScopeType[];
}

/**
 * 页面/实体受控模型（供角色权限管理树渲染）
 */
export interface FeaturePagePermissionDescriptor {
  readonly resource: string;
  readonly subject: string;
  readonly label: string;
  readonly path?: string;
  readonly actions: readonly FeatureActionConfigItem[];
  readonly configurableFields?: readonly FeatureConfigurableField[];
}

/**
 * 业务顶级模块（对应角色权限管理树的主分类）
 */
export interface FeatureModulePermissionDescriptor {
  readonly moduleKey: string;
  readonly label: string;
  readonly iconName: string;
  readonly order?: number;
  readonly pages: readonly FeaturePagePermissionDescriptor[];
}

/**
 * 统一业务切片自描述清单契约 (Tenant Feature Manifest)
 * 每个业务切片包只对自己负责，导出此 Manifest 实现“自包含”
 */
export interface TenantFeatureManifest {
  /** 切片唯一标识 (如 'procurement-center', 'customer-center') */
  readonly id: string;
  /** 切片中文显示名称 (如 '采购中心') */
  readonly name: string;
  /** 排序权重 (数字越小越靠前) */
  readonly order?: number;
  /** 切片贡献的导航区块与菜单项 */
  readonly navSections?: readonly FeatureNavSection[];
  /** 切片贡献的 CASL 权限定义集合 */
  readonly permissions: readonly PermissionDefinition[];
  /** 切片贡献的角色权限树模块定义 */
  readonly permissionModules?: readonly FeatureModulePermissionDescriptor[];
}

/**
 * 从 Feature Manifests 数组中提取并派生全局 CASL PermissionDefinition 数组
 */
export function deriveCatalogDefinitions(
  manifests: readonly TenantFeatureManifest[],
): PermissionDefinition[] {
  const sorted = [...manifests].sort(
    (a, b) => (a.order ?? 100) - (b.order ?? 100),
  );
  const definitions: PermissionDefinition[] = [];
  const seenResources = new Set<string>();

  for (const manifest of sorted) {
    for (const def of manifest.permissions) {
      if (!seenResources.has(def.resource)) {
        seenResources.add(def.resource);
        definitions.push(def);
      }
    }
  }

  return definitions;
}

/**
 * 从 Feature Manifests 数组中派生全局 PermissionCatalog
 */
export function derivePermissionCatalog(
  manifests: readonly TenantFeatureManifest[],
): PermissionCatalog<readonly PermissionDefinition[]> {
  const definitions = deriveCatalogDefinitions(manifests);
  return createPermissionCatalog(definitions);
}

/**
 * 从 Feature Manifests 数组中合并并派生完整的侧边栏导航区块 (NavSections)
 */
export function deriveNavSections(
  manifests: readonly TenantFeatureManifest[],
): FeatureNavSection[] {
  const sortedManifests = [...manifests].sort(
    (a, b) => (a.order ?? 100) - (b.order ?? 100),
  );

  const sectionMap = new Map<
    string,
    {
      title?: string;
      order: number;
      items: (FeatureNavItem | FeatureNavGroup)[];
    }
  >();

  for (const manifest of sortedManifests) {
    if (!manifest.navSections) continue;

    for (const section of manifest.navSections) {
      const existing = sectionMap.get(section.id);
      if (existing) {
        if (!existing.title && section.title) {
          existing.title = section.title;
        }
        existing.items.push(...section.items);
      } else {
        sectionMap.set(section.id, {
          title: section.title,
          order: section.order ?? manifest.order ?? 100,
          items: [...section.items],
        });
      }
    }
  }

  return Array.from(sectionMap.entries())
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([id, data]) => ({
      id,
      title: data.title,
      order: data.order,
      items: data.items,
    }));
}

/**
 * 从 Feature Manifests 数组中派生角色权限管理树 (ModulePermissionDescriptors)
 */
export function derivePermissionTree(
  manifests: readonly TenantFeatureManifest[],
): FeatureModulePermissionDescriptor[] {
  const sortedManifests = [...manifests].sort(
    (a, b) => (a.order ?? 100) - (b.order ?? 100),
  );

  const modules: FeatureModulePermissionDescriptor[] = [];
  for (const manifest of sortedManifests) {
    if (manifest.permissionModules) {
      modules.push(...manifest.permissionModules);
    }
  }

  return modules.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

/**
 * 服务端依据权限判定过滤导航菜单 (Server-side Filter)
 * - 移除无权访问的叶子节点
 * - 折叠分组下所有子项均无权访问时，自动移除该分组
 * - 分区下无任何可访问项时，自动移除该分区
 */
export function filterNavSections(
  sections: readonly FeatureNavSection[],
  can: (action: string, subject: string) => boolean,
): FeatureNavSection[] {
  const filteredSections: FeatureNavSection[] = [];

  for (const section of sections) {
    const filteredItems: (FeatureNavItem | FeatureNavGroup)[] = [];

    for (const item of section.items) {
      if ("items" in item && Array.isArray(item.items)) {
        // 折叠分组：递归过滤子项
        const allowedChildren = item.items.filter((child) => {
          if (!child.requiredAction || !child.requiredSubject) {
            return true;
          }
          return can(child.requiredAction, child.requiredSubject);
        });

        if (allowedChildren.length > 0) {
          filteredItems.push({
            ...item,
            items: allowedChildren,
          });
        }
      } else {
        // 叶子项：判断权限
        const leaf = item as FeatureNavItem;
        if (!leaf.requiredAction || !leaf.requiredSubject) {
          filteredItems.push(leaf);
        } else if (can(leaf.requiredAction, leaf.requiredSubject)) {
          filteredItems.push(leaf);
        }
      }
    }

    if (filteredItems.length > 0) {
      filteredSections.push({
        ...section,
        items: filteredItems,
      });
    }
  }

  return filteredSections;
}
