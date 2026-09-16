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
 * 将业务切片页面池聚合成出厂推荐的业务大菜单结构 (供用户主动点击载入模板)
 */
export function buildRecommendedBusinessTree(
  pages: readonly StandardPageDescriptor[],
): TenantMenuNode[] {
  const featureGroups = new Map<
    string,
    { name: string; pages: StandardPageDescriptor[] }
  >();

  for (const page of pages) {
    const existing = featureGroups.get(page.featureId);
    if (existing) {
      existing.pages.push(page);
    } else {
      featureGroups.set(page.featureId, {
        name: page.featureName,
        pages: [page],
      });
    }
  }

  const result: TenantMenuNode[] = [];
  let groupSort = 1;

  for (const [featureId, groupData] of featureGroups.entries()) {
    const groupId = createTempId(`g_${featureId}`);
    result.push({
      id: groupId,
      parentId: null,
      itemType: "GROUP",
      customLabel: groupData.name,
      customIcon: "Folder",
      sortOrder: groupSort++,
      isVisible: true,
      children: groupData.pages.map((p, idx) => ({
        id: createTempId(`p_${p.pageKey.replace(/\./g, "_")}`),
        parentId: groupId,
        itemType: "PAGE",
        pageKey: p.pageKey,
        customLabel: null,
        customIcon: p.defaultIcon || null,
        sortOrder: idx + 1,
        isVisible: true,
      })),
    });
  }

  return result;
}

/**
 * 递归收集树中所有可作为父级容器的节点 (即 itemType === "GROUP" 的节点)
 */
export function collectGroupNodes(
  nodes: readonly TenantMenuNode[],
  depth = 0,
): { id: string; label: string; depth: number }[] {
  const result: { id: string; label: string; depth: number }[] = [];
  for (const node of nodes) {
    if (node.itemType === "GROUP") {
      result.push({
        id: node.id,
        label: node.customLabel || "未命名目录",
        depth,
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
