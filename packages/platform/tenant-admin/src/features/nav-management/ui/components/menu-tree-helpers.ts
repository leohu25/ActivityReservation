import type {
  StandardPageDescriptor,
  TenantMenuNode,
} from "@base/authorization";
import type { SaveMenuItemInput } from "../../types";

/** 辅助生成临时稳定唯一ID */
export function createTempId(prefix = "m"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

/**
 * 将页面功能池聚合成出厂推荐的标准菜单结构 (SSoT 单一事实来源)
 * 1. 工作台独立置顶 (顶级独立单页)；
 * 2. 业务页面自动归入对应业务 SECTION 分区标头（如【客户中心】）；
 * 3. 系统管理页面归入【系统管理】SECTION 分区标头，下设组织架构、权限管理、企业设置、审计追踪 4 大目录；
 * 严格对齐左侧边栏视觉标头（SidebarGroupLabel）。
 */
export function buildRecommendedBusinessTree(
  pages: readonly StandardPageDescriptor[],
): TenantMenuNode[] {
  const result: TenantMenuNode[] = [];
  let sortOrder = 1;

  // 1. 工作台独立置顶 (若存在)
  const workbenchPage = pages.find((p) => p.pageKey === "workbench");
  if (workbenchPage) {
    result.push({
      id: createTempId("p_workbench"),
      parentId: null,
      itemType: "PAGE",
      pageKey: workbenchPage.pageKey,
      customLabel: workbenchPage.defaultLabel,
      customIcon: workbenchPage.defaultIcon || "LayoutDashboard",
      sortOrder: sortOrder++,
      isVisible: true,
      isSystem: true,
    });
  }

  // 2. 业务页面 (按业务大区分区聚类)
  const businessPages = pages.filter(
    (p) => p.featureId !== "tenant-admin" && p.pageKey !== "workbench",
  );
  if (businessPages.length > 0) {
    const bizSectionId = createTempId("sec_business");
    const bizSectionChildren: TenantMenuNode[] = [];

    const bizGroups = new Map<string, StandardPageDescriptor[]>();
    for (const p of businessPages) {
      const g = p.group || p.featureName;
      const list = bizGroups.get(g) || [];
      list.push(p);
      bizGroups.set(g, list);
    }

    let bizGroupSort = 1;
    for (const [groupName, groupPages] of bizGroups.entries()) {
      const groupId = createTempId(`g_${groupName}`);
      bizSectionChildren.push({
        id: groupId,
        parentId: bizSectionId,
        itemType: "GROUP",
        customLabel: groupName,
        customIcon: groupPages[0]?.defaultIcon || "Folder",
        sortOrder: bizGroupSort++,
        isVisible: true,
        children: groupPages.map((p, idx) => ({
          id: createTempId(`p_${p.pageKey.replace(/\./g, "_")}`),
          parentId: groupId,
          itemType: "PAGE",
          pageKey: p.pageKey,
          customLabel: null,
          customIcon: p.defaultIcon || null,
          sortOrder: idx + 1,
          isVisible: true,
          isProtected: p.isProtected,
        })),
      });
    }

    result.push({
      id: bizSectionId,
      parentId: null,
      itemType: "SECTION",
      customLabel: businessPages[0]?.featureName || "业务中心",
      sortOrder: sortOrder++,
      isVisible: true,
      children: bizSectionChildren,
    });
  }

  // 3. 系统管理页面 (按系统大区分区聚类)
  const systemPages = pages.filter(
    (p) =>
      (p.featureId === "tenant-admin" || p.isSystem) &&
      p.pageKey !== "workbench",
  );
  if (systemPages.length > 0) {
    const sysSectionId = createTempId("sec_system");
    const sysSectionChildren: TenantMenuNode[] = [];

    const sysGroups = new Map<string, StandardPageDescriptor[]>();
    for (const p of systemPages) {
      const g = p.group || "系统设置";
      const list = sysGroups.get(g) || [];
      list.push(p);
      sysGroups.set(g, list);
    }

    let sysGroupSort = 1;
    for (const [groupName, groupPages] of sysGroups.entries()) {
      const groupId = createTempId(`g_${groupName}`);
      sysSectionChildren.push({
        id: groupId,
        parentId: sysSectionId,
        itemType: "GROUP",
        customLabel: groupName,
        customIcon:
          groupName === "组织架构"
            ? "Users"
            : groupName === "权限管理"
              ? "ShieldCheck"
              : groupName === "审计追踪"
                ? "FileText"
                : "Settings",
        sortOrder: sysGroupSort++,
        isVisible: true,
        isSystem: true,
        children: groupPages.map((p, idx) => ({
          id: createTempId(`p_${p.pageKey.replace(/\./g, "_")}`),
          parentId: groupId,
          itemType: "PAGE",
          pageKey: p.pageKey,
          customLabel: null,
          customIcon: p.defaultIcon || null,
          sortOrder: idx + 1,
          isVisible: true,
          isSystem: true,
          isProtected: p.isProtected,
        })),
      });
    }

    result.push({
      id: sysSectionId,
      parentId: null,
      itemType: "SECTION",
      customLabel: "系统管理",
      sortOrder: sortOrder++,
      isVisible: true,
      isSystem: true,
      children: sysSectionChildren,
    });
  }

  return result;
}

/**
 * 递归收集树中所有可作为父级容器的节点 (即 itemType === "GROUP" 或 "SECTION" 的节点)
 */
export function collectGroupNodes(
  nodes: readonly TenantMenuNode[],
  depth = 0,
): { id: string; label: string; depth: number; isSection?: boolean }[] {
  const result: {
    id: string;
    label: string;
    depth: number;
    isSection?: boolean;
  }[] = [];
  for (const node of nodes) {
    if (node.itemType === "GROUP" || node.itemType === "SECTION") {
      result.push({
        id: node.id,
        label:
          node.customLabel ||
          (node.itemType === "SECTION" ? "未命名分区" : "未命名目录"),
        depth,
        isSection: node.itemType === "SECTION",
      });
      if (node.children && node.children.length > 0) {
        result.push(...collectGroupNodes(node.children, depth + 1));
      }
    }
  }
  return result;
}

/**
 * 递归将树形结构扁平化为用于后端保存的 DTO 数组
 */
export function flattenMenuTreeForSave(
  nodes: readonly TenantMenuNode[],
  parentId: string | null = null,
): SaveMenuItemInput[] {
  const list: SaveMenuItemInput[] = [];
  nodes.forEach((node, idx) => {
    list.push({
      id: node.id,
      parentId: parentId,
      itemType: node.itemType,
      pageKey: node.itemType === "PAGE" ? node.pageKey || null : null,
      customLabel: node.customLabel || null,
      customIcon: node.customIcon || null,
      sortOrder: idx + 1,
      isVisible: node.isVisible,
      externalUrl: node.itemType === "LINK" ? node.externalUrl || null : null,
    });

    if (node.children && node.children.length > 0) {
      list.push(...flattenMenuTreeForSave(node.children, node.id));
    }
  });
  return list;
}
