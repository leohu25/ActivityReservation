import type { DataScopeType } from "../scopes/data-scope";
import type { StandardAction } from "./actions";
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
  /** 链接打开方式，如 '_blank' 在新标签页打开 */
  readonly target?: string;
  /** 是否为外部链接 */
  readonly isExternal?: boolean;
  readonly requiredAction?: string;
  readonly requiredSubject?: string;
  readonly subjects?: readonly string[];
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
 * 切片自声明页面输入项（切片只需声明页面本身属性，featureId 和 featureName 由 Manifest 容器层自动注入）
 */
export interface FeaturePageInput {
  /** 全局唯一功能键，例如 'material-categories', 'customer-stores' */
  readonly pageKey: string;
  /** 默认显示中文名称（例如 '分类与品种'） */
  readonly defaultLabel: string;
  /** 所属推荐目录分组名称（例如 '组织架构'、'企业设置'；若不提供则业务切片默认归入所属 featureName，顶级独立页如工作台可不填） */
  readonly group?: string;
  /** 物理路由地址（例如 '/materials/categories'） */
  readonly href: string;
  /** 默认推荐图标名称（例如 'Layers', 'Store'） */
  readonly defaultIcon?: string;
  /** 关联的 CASL 权限主体 (SSoT) */
  readonly requiredSubject?: string;
  /** 关联的 CASL 权限动作 (默认为 read) */
  readonly requiredAction?: string;
  /**
   * 复合页面挂载的数据模型实体列表（支持 1 页面对 N 实体）
   * 若提供此项，页面准入权限遵循 OR 逻辑：用户拥有其中任意一实体的 READ 权限即可访问页面
   */
  readonly subjects?: readonly string[];
  /** 徽标或额外提示（可选） */
  readonly badge?: string;
  /** 是否属于系统内置功能（例如工作台、组织架构、系统设置等） */
  readonly isSystem?: boolean;
  /** 是否属于核心受保护功能（禁止删除、禁止取消可见，防止自锁死） */
  readonly isProtected?: boolean;
}

/**
 * 标准功能页面元数据契约（供功能池与动态菜单引用，纯数据兼容 RSC 跨端序列化）
 */
export interface StandardPageDescriptor extends FeaturePageInput {
  /** 所属推荐目录分组名称（例如 '组织架构'、'企业设置'） */
  readonly group?: string;
  /** 所属业务切片标识（自动继承 Manifest.id） */
  readonly featureId: string;
  /** 所属业务切片中文名（自动继承 Manifest.name） */
  readonly featureName: string;
}

/**
 * 租户自定义菜单树节点模型（纯数据结构，持久化于租户独立数据库）
 */
export interface TenantMenuNode {
  readonly id: string;
  readonly parentId?: string | null;
  /** 节点类型: "GROUP"（目录大菜单）| "PAGE"（具体功能页面）| "LINK"（外部链接）| "SECTION"（分区标头） */
  readonly itemType: "GROUP" | "PAGE" | "LINK" | "SECTION";
  /** 若为 PAGE，则关联 StandardPageDescriptor.pageKey */
  readonly pageKey?: string | null;
  /** 若为 LINK，则为外部跳转完整 URL (如 "https://bi.company.com") */
  readonly externalUrl?: string | null;
  /** 是否在新标签页打开 */
  readonly openInNewTab?: boolean;
  /** 租户自定义覆盖名称（为空则使用对应页面的 defaultLabel） */
  readonly customLabel?: string | null;
  /** 租户自定义图标（为空则使用对应页面的 defaultIcon） */
  readonly customIcon?: string | null;
  /** 排序权重 (升序) */
  readonly sortOrder: number;
  /** 是否可见 */
  readonly isVisible?: boolean;
  /** 是否属于系统内置功能 */
  readonly isSystem?: boolean;
  /** 是否属于核心受保护功能（前端禁用删除/隐藏，防止自锁死） */
  readonly isProtected?: boolean;
  /** 子节点列表 */
  readonly children?: readonly TenantMenuNode[];
}

/**
 * 权限动作配置项模型：
 * 架构规范铁律：
 * - 严禁魔法值：动作一律消费 StandardAction 枚举或特定领域的 Action 枚举常量；
 * - 读写同源·作用域级联继承：只有 action === StandardAction.READ 允许声明 supportedScopes，其余写动作自动继承读的数据范围；
 * - 类型系统拦截：如果给非读操作声明了 supportedScopes，LSP 和 TypeScript 编译器会直接报错拦截！
 */
export type FeatureActionConfigItem =
  | {
      readonly action: typeof StandardAction.READ;
      readonly label: string;
      readonly supportedScopes?: readonly DataScopeType[];
    }
  | {
      readonly action: string;
      readonly label: string;
      readonly supportedScopes?: never; // 静态拦截：非读动作在类型系统上彻底禁止声明 supportedScopes！
    };

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
  /**
   * 复合页面包含的子数据实体受控契约列表（若存在且长度 > 1，则表示当前节点为多实体容器节点）
   */
  readonly entities?: readonly FeaturePagePermissionDescriptor[];
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
  /** 切片唯一标识 (如 'customer-center', 'customer-center') */
  readonly id: string;
  /** 切片中文显示名称 (如 '采购中心') */
  readonly name: string;
  /** 排序权重 (可选，仅用于全局注册排序) */
  readonly order?: number;
  /** 切片贡献的标准页面功能池清单（解耦粒度，供动态菜单选用；切片内无需重复写 featureId 与 featureName） */
  readonly pages?: readonly (FeaturePageInput | StandardPageDescriptor)[];
  /** 切片贡献的导航区块与菜单项（出厂默认预设推荐树，系统基座专用） */
  readonly navSections?: readonly FeatureNavSection[];
  /** 切片贡献的角色权限树与受控资源定义（全局唯一权限事实源） */
  readonly permissionModules?: readonly FeatureModulePermissionDescriptor[];
}

/**
 * 从 Feature Manifests 数组中提取并派生全局 CASL PermissionDefinition 数组
 * 纯函数：从各切片的 permissionModules 中无损提取受控资源、动作及字段配置，消除双重声明
 */
/**
 * 根据租户动态菜单树生成与菜单心智对齐的角色权限树 (Menu-Aligned Permission Tree)
 * 遵循主流企业级 ERP 规范：
 * 1. 优先按照租户当前实际保存的菜单目录结构（Group -> Page）组织权限项；
 * 2. 如果页面挂载了对应的 CASL FeaturePagePermissionDescriptor，则挂载其 Actions、Scopes 与 Fields；
 * 3. 自动将未出现在菜单中的系统基座（工作台、组织与员工、角色权限、系统设置等）统一聚合为底部的【系统底座与管理】分区；
 * 4. 若租户未配置任何自定义菜单（tree 为空），则安全平滑回退为底座默认派生的切片权限树。
 */
export function deriveMenuAlignedPermissionTree(
  manifests: readonly TenantFeatureManifest[],
  menuTree: readonly TenantMenuNode[],
): FeatureModulePermissionDescriptor[] {
  const basePermissionTree = derivePermissionTree(manifests);
  if (!menuTree || menuTree.length === 0) {
    return basePermissionTree;
  }

  // 1. 构建全局全量受控页面索引：resource -> descriptor, subject -> descriptor, path -> descriptors[]
  const resourceMap = new Map<string, FeaturePagePermissionDescriptor>();
  const subjectMap = new Map<string, FeaturePagePermissionDescriptor>();
  const pathToDescriptors = new Map<
    string,
    FeaturePagePermissionDescriptor[]
  >();

  for (const mod of basePermissionTree) {
    for (const page of mod.pages) {
      resourceMap.set(page.resource, page);
      if (page.subject) subjectMap.set(page.subject, page);
      if (page.path) {
        const list = pathToDescriptors.get(page.path) ?? [];
        list.push(page);
        pathToDescriptors.set(page.path, list);
      }
    }
  }

  const pageCatalog = derivePageCatalog(manifests);
  const matchedResources = new Set<string>();

  function resolveMatchingContracts(
    meta: StandardPageDescriptor,
  ): FeaturePagePermissionDescriptor[] {
    const result: FeaturePagePermissionDescriptor[] = [];
    const seen = new Set<string>();

    // 1. 优先按 meta.subjects 声明提取全量实体契约
    if (meta.subjects && meta.subjects.length > 0) {
      for (const subj of meta.subjects) {
        const desc = subjectMap.get(subj);
        if (desc && !seen.has(desc.resource)) {
          seen.add(desc.resource);
          result.push(desc);
        }
      }
    }

    // 2. 次优按路由 href 提取共享同一物理页面的所有实体契约
    if (meta.href && pathToDescriptors.has(meta.href)) {
      const list = pathToDescriptors.get(meta.href)!;
      for (const desc of list) {
        if (!seen.has(desc.resource)) {
          seen.add(desc.resource);
          result.push(desc);
        }
      }
    }

    // 3. 兜底按 requiredSubject 提取
    if (result.length === 0 && meta.requiredSubject) {
      const desc = subjectMap.get(meta.requiredSubject);
      if (desc && !seen.has(desc.resource)) {
        seen.add(desc.resource);
        result.push(desc);
      }
    }

    return result;
  }

  function createPermissionNode(
    subNode: TenantMenuNode,
    meta: StandardPageDescriptor,
  ): FeaturePagePermissionDescriptor | null {
    const matched = resolveMatchingContracts(meta);
    if (matched.length === 0) return null;

    const primary =
      (meta.requiredSubject
        ? matched.find((c) => c.subject === meta.requiredSubject)
        : undefined) || matched[0]!;

    // 仅当实体属于当前页面的主实体，或其实际原生路由与当前页面一致时，才视为主导认领；
    // 跨路由辅助引用的实体（如工作台挂载客户标签/部门）仅作视图投射，绝不从原生模块中排他吞噬！
    matchedResources.add(primary.resource);
    for (const c of matched) {
      if (c.path && meta.href && c.path === meta.href) {
        matchedResources.add(c.resource);
      }
    }

    return {
      ...primary,
      label: subNode.customLabel || meta.defaultLabel || primary.label,
      path: meta.href || primary.path,
      entities: matched,
    };
  }

  // 2. 递归遍历菜单树，将菜单目录转化为权限模块
  const modules: FeatureModulePermissionDescriptor[] = [];
  let moduleOrder = 10;

  function processMenuNodes(
    nodes: readonly TenantMenuNode[],
    parentLabelPrefix = "",
  ) {
    for (const node of nodes) {
      if (node.isVisible === false) continue;

      if (node.itemType === "GROUP") {
        const groupLabel = node.customLabel || "未命名分组";
        const fullLabel = parentLabelPrefix
          ? `${parentLabelPrefix} / ${groupLabel}`
          : groupLabel;

        // 收集该目录下所有叶子页面节点
        const groupPages: FeaturePagePermissionDescriptor[] = [];

        function collectLeaves(subNodes: readonly TenantMenuNode[]) {
          for (const sub of subNodes) {
            if (sub.isVisible === false) continue;
            if (sub.itemType === "PAGE" && sub.pageKey) {
              const meta = pageCatalog.get(sub.pageKey);
              if (!meta) continue;

              const permNode = createPermissionNode(sub, meta);
              if (permNode) {
                groupPages.push(permNode);
              }
            } else if (sub.itemType === "GROUP" && sub.children) {
              collectLeaves(sub.children);
            }
          }
        }

        if (node.children) {
          collectLeaves(node.children);
        }

        if (groupPages.length > 0) {
          modules.push({
            moduleKey: `menu-${node.id}`,
            label: fullLabel,
            iconName: node.customIcon || "Folder",
            order: moduleOrder++,
            pages: groupPages,
          });
        }
      } else if (
        node.itemType === "PAGE" &&
        node.pageKey &&
        !parentLabelPrefix
      ) {
        // 顶级单页
        const meta = pageCatalog.get(node.pageKey);
        if (meta) {
          const permNode = createPermissionNode(node, meta);
          if (permNode) {
            modules.push({
              moduleKey: `menu-${node.id}`,
              label: node.customLabel || meta.defaultLabel,
              iconName: node.customIcon || meta.defaultIcon || "FileText",
              order: moduleOrder++,
              pages: [permNode],
            });
          }
        }
      }
    }
  }

  processMenuNodes(menuTree);

  // 3. 将未挂载在自定义业务菜单中的受控模块页面追加在末尾
  for (const mod of basePermissionTree) {
    const unallocatedPages = mod.pages.filter(
      (p) => !matchedResources.has(p.resource),
    );
    if (unallocatedPages.length > 0) {
      modules.push({
        ...mod,
        moduleKey: `base-${mod.moduleKey}`,
        label: mod.label,
        order: 1000 + (mod.order ?? 0),
        pages: unallocatedPages.map((p) => ({
          ...p,
          entities: p.entities || [p],
        })),
      });
    }
  }

  return modules;
}

export function deriveCatalogDefinitions(
  manifests: readonly TenantFeatureManifest[],
): PermissionDefinition[] {
  const sorted = [...manifests].sort(
    (a, b) => (a.order ?? 100) - (b.order ?? 100),
  );
  const definitions: PermissionDefinition[] = [];
  const seenResources = new Set<string>();

  for (const manifest of sorted) {
    if (!manifest.permissionModules) continue;

    for (const mod of manifest.permissionModules) {
      for (const page of mod.pages) {
        if (seenResources.has(page.resource)) {
          continue;
        }
        seenResources.add(page.resource);

        const [firstAction, ...restActions] = page.actions.map((a) => a.action);
        if (!firstAction) {
          continue;
        }
        const actions: readonly [string, ...string[]] = [
          firstAction,
          ...restActions,
        ];

        const fields = page.configurableFields?.map((f) => f.field);

        const actionMetadata = Object.fromEntries(
          page.actions.map((act) => [
            act.action,
            {
              label: act.label,
              scopes: act.supportedScopes,
              fields,
            },
          ]),
        );

        definitions.push({
          resource: page.resource,
          subject: page.subject,
          label: page.label,
          actions,
          actionMetadata,
          fields,
        });
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
    if (manifest.navSections && manifest.navSections.length > 0) {
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
      continue;
    }

    // 若切片未显式提供 navSections，以 pages 声明为单一事实源自动派生出厂导航拓扑 (SSoT)
    if (manifest.pages && manifest.pages.length > 0) {
      // 1. 无 group 的顶级独立项（如 workbench）归入 base 分区
      const standalonePages = manifest.pages.filter(
        (p) => !p.group && p.pageKey === "workbench",
      );
      if (standalonePages.length > 0) {
        const baseSection = sectionMap.get("base") || {
          order: 0,
          items: [],
        };
        for (const p of standalonePages) {
          baseSection.items.push({
            id: p.pageKey,
            label: p.defaultLabel,
            icon: p.defaultIcon,
            href: p.href,
            requiredAction: p.requiredAction || "read",
            requiredSubject: p.requiredSubject,
            subjects: p.subjects,
            badge: p.badge,
          });
        }
        sectionMap.set("base", baseSection);
      }

      // 2. 按 group（若未声明则用 manifest.name）自动聚拢为目录
      const pagesToGroup = manifest.pages.filter(
        (p) => p.pageKey !== "workbench",
      );
      const groupMap = new Map<
        string,
        (FeaturePageInput | StandardPageDescriptor)[]
      >();
      for (const p of pagesToGroup) {
        const groupName = p.group || manifest.name;
        const list = groupMap.get(groupName) || [];
        list.push(p);
        groupMap.set(groupName, list);
      }

      const isSystem = manifest.id === "tenant-admin";
      const sectionId = isSystem ? "system" : manifest.id;
      const sectionTitle = isSystem ? "系统管理" : manifest.name;
      const sectionOrder = manifest.order ?? (isSystem ? 30 : 10);

      const currentSection = sectionMap.get(sectionId) || {
        title: sectionTitle,
        order: sectionOrder,
        items: [],
      };

      for (const [groupName, groupItems] of groupMap.entries()) {
        const firstIcon =
          groupItems[0]?.defaultIcon || (isSystem ? "Settings" : "Folder");
        const groupId = `group-${groupName}`;
        currentSection.items.push({
          id: groupId,
          label: groupName,
          icon: firstIcon,
          items: groupItems.map((p) => ({
            id: p.pageKey,
            label: p.defaultLabel,
            icon: p.defaultIcon,
            href: p.href,
            requiredAction: p.requiredAction || "read",
            requiredSubject: p.requiredSubject,
            subjects: p.subjects,
            badge: p.badge,
          })),
        });
      }

      sectionMap.set(sectionId, currentSection);
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
      modules.push(
        ...manifest.permissionModules.map((mod) => ({
          ...mod,
          pages: mod.pages.map((p) => ({
            ...p,
            entities: p.entities || [p],
          })),
        })),
      );
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
        // 叶子项：判断权限（支持多 Subject OR 准入）
        const leaf = item as FeatureNavItem;
        const hasAccess = (() => {
          if (leaf.subjects && leaf.subjects.length > 0) {
            const act = leaf.requiredAction || "read";
            return leaf.subjects.some((s) => can(act, s));
          }
          if (leaf.requiredAction && leaf.requiredSubject) {
            return can(leaf.requiredAction, leaf.requiredSubject);
          }
          return true;
        })();

        if (hasAccess) {
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

/**
 * 从 Feature Manifests 数组中提取并聚合所有可用标准页面功能池 (Page Catalog)
 * 具备自愈与无损兼容能力：优先读取 manifest.pages；若切片未声明 pages，则从 navSections 递归提取
 */
export function derivePageList(
  manifests: readonly TenantFeatureManifest[],
): StandardPageDescriptor[] {
  const sortedManifests = [...manifests].sort(
    (a, b) => (a.order ?? 100) - (b.order ?? 100),
  );

  const seenPageKeys = new Set<string>();
  const pages: StandardPageDescriptor[] = [];

  for (const manifest of sortedManifests) {
    // 1. 若切片显式提供了 pages，直接规范化收集（自动注入容器层的 featureId 与 featureName）
    if (manifest.pages && manifest.pages.length > 0) {
      for (const p of manifest.pages) {
        if (!seenPageKeys.has(p.pageKey)) {
          seenPageKeys.add(p.pageKey);
          pages.push({
            ...p,
            group: p.group,
            isSystem: p.isSystem ?? (manifest.id === "tenant-admin"),
            isProtected: p.isProtected ?? false,
            featureId:
              "featureId" in p && p.featureId ? p.featureId : manifest.id,
            featureName:
              "featureName" in p && p.featureName
                ? p.featureName
                : manifest.name,
          });
        }
      }
    }

    // 2. 同时从 navSections 扫描补充（确保已有切片零改动即可无缝充实功能池）
    if (manifest.navSections) {
      for (const sec of manifest.navSections) {
        for (const item of sec.items) {
          if ("items" in item && Array.isArray(item.items)) {
            for (const child of item.items) {
              const key = child.id;
              if (!seenPageKeys.has(key)) {
                seenPageKeys.add(key);
                pages.push({
                  pageKey: key,
                  defaultLabel: child.label,
                  href: child.href,
                  defaultIcon: child.icon,
                  requiredAction: child.requiredAction ?? "read",
                  requiredSubject: child.requiredSubject,
                  featureId: manifest.id,
                  featureName: manifest.name,
                  badge: child.badge,
                  isSystem: manifest.id === "tenant-admin",
                  isProtected:
                    key === "settings-navigation" || key === "settings-roles",
                });
              }
            }
          } else {
            const leaf = item as FeatureNavItem;
            const key = leaf.id;
            if (!seenPageKeys.has(key)) {
              seenPageKeys.add(key);
              pages.push({
                pageKey: key,
                defaultLabel: leaf.label,
                href: leaf.href,
                defaultIcon: leaf.icon,
                requiredAction: leaf.requiredAction ?? "read",
                requiredSubject: leaf.requiredSubject,
                featureId: manifest.id,
                featureName: manifest.name,
                badge: leaf.badge,
                isSystem: manifest.id === "tenant-admin",
                isProtected:
                  key === "settings-navigation" || key === "settings-roles",
              });
            }
          }
        }
      }
    }
  }

  return pages;
}

/**
 * 生成按 pageKey 索引的只读 Map，加速运行时权限与路由检索
 */
export function derivePageCatalog(
  manifests: readonly TenantFeatureManifest[],
): Map<string, StandardPageDescriptor> {
  const list = derivePageList(manifests);
  return new Map(list.map((p) => [p.pageKey, p]));
}

/**
 * 租户菜单扁平记录抽象契约（与数据库持久化实体解耦）
 */
export interface FlatTenantMenuItemRecord {
  readonly id: string;
  readonly parentId?: string | null;
  readonly itemType: string;
  readonly pageKey?: string | null;
  readonly externalUrl?: string | null;
  readonly openInNewTab?: boolean;
  readonly customLabel?: string | null;
  readonly customIcon?: string | null;
  readonly sortOrder?: number;
  readonly isVisible?: boolean;
}

/**
 * 通用纯函数：将扁平数据库记录组装为支持无限多层级嵌套的菜单树 (Flat to Recursive Tree)
 * 具备 O(n) 时间复杂度，自动纠偏无效 parentId 孤儿节点并按 sortOrder 稳定排序
 */
export function buildMenuTree(
  records: readonly FlatTenantMenuItemRecord[],
): TenantMenuNode[] {
  if (!records || records.length === 0) {
    return [];
  }

  type MutableMenuNode = TenantMenuNode & { children: TenantMenuNode[] };
  const nodeMap = new Map<string, MutableMenuNode>();
  const roots: MutableMenuNode[] = [];

  for (const r of records) {
    nodeMap.set(r.id, {
      id: r.id,
      parentId: r.parentId || null,
      itemType:
        (r.itemType as "GROUP" | "PAGE" | "LINK" | "SECTION") || "PAGE",
      pageKey: r.pageKey || null,
      externalUrl: r.externalUrl || null,
      openInNewTab: Boolean(r.openInNewTab),
      customLabel: r.customLabel || null,
      customIcon: r.customIcon || null,
      sortOrder: r.sortOrder ?? 0,
      isVisible: r.isVisible !== false,
      children: [],
    });
  }

  for (const r of records) {
    const node = nodeMap.get(r.id)!;
    if (r.parentId && nodeMap.has(r.parentId)) {
      nodeMap.get(r.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // 递归对每一层的 children 按 sortOrder 升序排序
  function sortNodes(nodes: MutableMenuNode[]): TenantMenuNode[] {
    nodes.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    for (const n of nodes) {
      if (n.children && n.children.length > 0) {
        sortNodes(n.children as MutableMenuNode[]);
      }
    }
    return nodes;
  }

  return sortNodes(roots);
}

/**
 * 依据 CASL Ability 对租户自定义菜单树执行服务端递归安全剪枝 (Server-side Pruning)
 * 支持 1 级、2 级、3 级及以上无限层级递归，自动物理折叠无权空目录，转换输出为 @base/ui Sidebar 所需的 FeatureNavSection[]
 */
export function pruneDynamicMenuTree(
  tree: readonly TenantMenuNode[],
  pageMap:
    | Map<string, StandardPageDescriptor>
    | ReadonlyMap<string, StandardPageDescriptor>,
  can: (action: string, subject: string) => boolean,
): FeatureNavSection[] {
  function pruneNode(
    node: TenantMenuNode,
  ): (FeatureNavItem | FeatureNavGroup) | null {
    if (node.isVisible === false) return null;

    if (node.itemType === "LINK") {
      return {
        id: node.id,
        label: node.customLabel || "外部链接",
        href: node.externalUrl || "#",
        icon: node.customIcon || "ExternalLink",
        target: node.openInNewTab ? "_blank" : undefined,
        isExternal: true,
      };
    }

    if (node.itemType === "GROUP") {
      const sortedChildren = [...(node.children || [])]
        .filter((c) => c.isVisible !== false)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

      const allowedChildren: (FeatureNavItem | FeatureNavGroup)[] = [];
      for (const child of sortedChildren) {
        const pruned = pruneNode(child);
        if (pruned) {
          allowedChildren.push(pruned);
        }
      }

      // 若当前目录下的所有后代子项均被裁切，整组自动物理隐藏，消除空抽屉
      if (allowedChildren.length === 0) {
        return null;
      }

      return {
        id: node.id,
        label: node.customLabel || "未命名分组",
        icon: node.customIcon || undefined,
        items: allowedChildren as readonly FeatureNavItem[],
      };
    }

    // PAGE 功能页面
    if (!node.pageKey) return null;
    const pageMeta = pageMap.get(node.pageKey);
    if (!pageMeta) return null;

    // 安全权限校验：复合页面支持多 Subject OR 准入原则（拥有任意一个实体的 READ 权限即可访问页面）
    const hasAccess = (() => {
      if (pageMeta.subjects && pageMeta.subjects.length > 0) {
        const action = pageMeta.requiredAction || "read";
        return pageMeta.subjects.some((subj) => can(action, subj));
      }
      if (pageMeta.requiredSubject && pageMeta.requiredAction) {
        return can(pageMeta.requiredAction, pageMeta.requiredSubject);
      }
      return true;
    })();

    if (!hasAccess) {
      return null;
    }

    return {
      id: node.id,
      label: node.customLabel || pageMeta.defaultLabel,
      href: pageMeta.href,
      icon: node.customIcon || pageMeta.defaultIcon || undefined,
      badge: pageMeta.badge,
      requiredAction: pageMeta.requiredAction,
      requiredSubject: pageMeta.requiredSubject,
      subjects: pageMeta.subjects,
    };
  }

  const visibleNodes = [...tree]
    .filter((n) => n.isVisible !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const sections: FeatureNavSection[] = [];
  let sectionOrder = 1;
  const defaultItems: (FeatureNavItem | FeatureNavGroup)[] = [];

  for (const node of visibleNodes) {
    if (node.itemType === "SECTION") {
      // 收集 SECTION 分区标头下的所有子项 (支持子 GROUP, 子 PAGE, 子 LINK)
      const sortedChildren = [...(node.children || [])]
        .filter((c) => c.isVisible !== false)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

      const sectionItems: (FeatureNavItem | FeatureNavGroup)[] = [];
      for (const child of sortedChildren) {
        const pruned = pruneNode(child);
        if (pruned) {
          sectionItems.push(pruned);
        }
      }

      // 如果当前分区下所有子项均无访问权限，整分区自动隐藏，不留空标头
      if (sectionItems.length > 0) {
        sections.push({
          id: node.id,
          title: node.customLabel || undefined,
          order: sectionOrder++,
          items: sectionItems,
        });
      }
    } else {
      // 非 SECTION 节点（如顶级独立工作台）
      const pruned = pruneNode(node);
      if (pruned) {
        defaultItems.push(pruned);
      }
    }
  }

  if (defaultItems.length > 0) {
    sections.unshift({
      id: "base",
      order: 0,
      items: defaultItems,
    });
  }

  return sections;
}
