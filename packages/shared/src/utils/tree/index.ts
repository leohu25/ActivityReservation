/**
 * @chenrun/shared - 企业组织架构与层级树形数据结构工具
 */

export interface TreeNodeLike {
  readonly id: string;
  readonly parentId?: string | null;
}

export type WithChildren<T> = T & {
  children: Array<WithChildren<T>>;
};

export type FlatTreeNode<T> = T & {
  readonly depth: number;
};

/**
 * 将扁平的包含 id 与 parentId 的列表转换为嵌套树形结构
 */
export function buildTree<T extends TreeNodeLike>(
  items: readonly T[],
  rootId: string | null = null,
): Array<WithChildren<T>> {
  const itemMap = new Map<string, WithChildren<T>>();
  const rootNodes: Array<WithChildren<T>> = [];

  for (const item of items) {
    itemMap.set(item.id, { ...item, children: [] });
  }

  for (const item of items) {
    const node = itemMap.get(item.id);
    if (!node) continue;

    const parentId = item.parentId ?? null;
    if (parentId === rootId || (rootId === null && !parentId)) {
      rootNodes.push(node);
    } else if (parentId) {
      const parentNode = itemMap.get(parentId);
      if (parentNode) {
        parentNode.children.push(node);
      } else if (rootId === null) {
        // 当未指定 rootId 且父节点不在列表中时，作为根节点容错兜底
        rootNodes.push(node);
      }
    }
  }

  return rootNodes;
}

/**
 * 将嵌套树形结构展开为带 depth 深度层级的扁平化列表 (深度优先遍历)
 */
export function flattenTree<T extends { readonly children?: readonly any[] }>(
  nodes: readonly T[],
  depth: number = 0,
): Array<FlatTreeNode<T>> {
  const result: Array<FlatTreeNode<T>> = [];

  for (const node of nodes) {
    result.push({ ...node, depth });
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }

  return result;
}

/**
 * 递归查找树中符合条件的单一节点
 */
export function findTreeNode<T extends { readonly children?: readonly any[] }>(
  nodes: readonly T[],
  predicate: (node: T) => boolean,
): T | null {
  for (const node of nodes) {
    if (predicate(node)) {
      return node;
    }
    if (node.children && node.children.length > 0) {
      const found = findTreeNode(node.children, predicate);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * 收集指定节点及其所有后代子节点的 ID 集合 (防环终止)
 */
export function collectSubtreeIds<
  T extends { readonly id: string; readonly children?: readonly any[] },
>(node: T): string[] {
  const visited = new Set<string>();
  const queue: T[] = [node];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current.id)) continue;
    visited.add(current.id);

    if (current.children && current.children.length > 0) {
      for (const child of current.children) {
        if (!visited.has(child.id)) {
          queue.push(child);
        }
      }
    }
  }

  return Array.from(visited);
}
