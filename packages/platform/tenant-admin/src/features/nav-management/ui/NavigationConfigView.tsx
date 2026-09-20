"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Card,
  CardContent,
  Button,
  Badge,
  MasterDetailShell,
  ConfirmDialog,
  toast,
  useSafeRouter,
} from "@base/ui";
import {
  Plus,
  Save,
  RotateCcw,
  Layers,
  Sliders,
  Sparkles,
  Download,
} from "lucide-react";
import type {
  StandardPageDescriptor,
  TenantMenuNode,
} from "@base/authorization";
import type { NavigationConfigData } from "../types";
import { saveMenuTreeAction, resetMenuTreeAction } from "../actions";
import {
  createTempId,
  buildRecommendedBusinessTree,
  collectGroupNodes,
  flattenMenuTreeForSave,
} from "./components/menu-tree-helpers";
import { MenuTreeNodeItem } from "./components/MenuTreeNodeItem";
import { AvailablePagePool } from "./components/AvailablePagePool";
import { NodePropertyForm } from "./components/NodePropertyForm";

export interface NavigationConfigViewProps {
  readonly data: NavigationConfigData;
}

/**
 * 租户导航菜单动态配置控制台 (已解构治理：紧凑树形 + 属性配置 + 功能池)
 */
export function NavigationConfigView({
  data,
}: NavigationConfigViewProps) {
  const router = useSafeRouter();
  const [isPending, startTransition] = useTransition();

  // 1. 树状数据状态：若租户数据库已有自定义配置则直接加载；若从未配置过，则自动加载系统出厂推荐树供预览与微调
  const [tree, setTree] = useState<TenantMenuNode[]>(() => {
    if (data.currentTree && data.currentTree.length > 0) {
      return [...data.currentTree];
    }
    return buildRecommendedBusinessTree(data.availablePages);
  });

  const [isConfigured, setIsConfigured] = useState<boolean>(() => {
    return Boolean(data.currentTree && data.currentTree.length > 0);
  });

  // 2. 当前选中的节点 ID
  const [selectedNodeId, setSelectedNodeId] = useState<string>(() => {
    if (data.currentTree && data.currentTree.length > 0) {
      return data.currentTree[0]?.id || "";
    }
    const recommended = buildRecommendedBusinessTree(data.availablePages);
    return recommended[0]?.id || "";
  });

  // 3. 目录展开折叠状态
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(
    () => {
      const exp: Record<string, boolean> = {};
      const initialNodes =
        data.currentTree && data.currentTree.length > 0
          ? data.currentTree
          : buildRecommendedBusinessTree(data.availablePages);
      for (const item of initialNodes) {
        exp[item.id] = true;
      }
      return exp;
    },
  );

  // 4. 业务功能池搜索关键词
  const [poolSearch, setPoolSearch] = useState("");

  // 页面元数据快速查找字典
  const pageMap = useMemo(() => {
    return new Map(data.availablePages.map((p) => [p.pageKey, p]));
  }, [data.availablePages]);

  // 统计每个页面被挂载的次数
  const pageMountCounts = useMemo(() => {
    const counts = new Map<string, number>();
    function traverse(nodes: readonly TenantMenuNode[]) {
      for (const node of nodes) {
        if (node.pageKey) {
          counts.set(node.pageKey, (counts.get(node.pageKey) ?? 0) + 1);
        }
        if (node.children) {
          traverse(node.children);
        }
      }
    }
    traverse(tree);
    return counts;
  }, [tree]);

  // 可作为父级的目录列表
  const availableParentGroups = useMemo(() => {
    return collectGroupNodes(tree);
  }, [tree]);

  // 按切片分类可用功能页
  const categorizedPages = useMemo(() => {
    const map = new Map<
      string,
      { featureName: string; pages: StandardPageDescriptor[] }
    >();
    const q = poolSearch.trim().toLowerCase();

    for (const p of data.availablePages) {
      if (
        q &&
        !p.defaultLabel.toLowerCase().includes(q) &&
        !p.href.toLowerCase().includes(q)
      ) {
        continue;
      }
      const groupKey = p.group ? `${p.featureId}:${p.group}` : p.featureId;
      const groupName = p.group || p.featureName;
      const existing = map.get(groupKey);
      if (existing) {
        existing.pages.push(p);
      } else {
        map.set(groupKey, { featureName: groupName, pages: [p] });
      }
    }

    return Array.from(map.entries()).map(([key, data]) => ({
      featureId: key,
      featureName: data.featureName,
      pages: data.pages,
    }));
  }, [data.availablePages, poolSearch]);

  // 递归定位当前选中的节点及其父节点
  const { selectedNode, parentNode } = useMemo(() => {
    function find(
      nodes: readonly TenantMenuNode[],
      parent: TenantMenuNode | null,
    ): {
      selectedNode: TenantMenuNode | null;
      parentNode: TenantMenuNode | null;
    } {
      for (const node of nodes) {
        if (node.id === selectedNodeId) {
          return { selectedNode: node, parentNode: parent };
        }
        if (node.children) {
          const res = find(node.children, node);
          if (res.selectedNode) return res;
        }
      }
      return { selectedNode: null, parentNode: null };
    }
    return find(tree, null);
  }, [tree, selectedNodeId]);

  // 1. 新建顶级菜单项
  const handleAddRootItem = () => {
    const newId = createTempId("root");
    const newItem: TenantMenuNode = {
      id: newId,
      parentId: null,
      itemType: "GROUP",
      customLabel: "新菜单项",
      customIcon: "Folder",
      sortOrder: tree.length + 1,
      isVisible: true,
      children: [],
    };

    setTree((prev) => [...prev, newItem]);
    setSelectedNodeId(newId);
    setExpandedNodes((prev) => ({ ...prev, [newId]: true }));
    setIsConfigured(true);
    toast.success("已添加顶级菜单项");
  };

  // 2. 在指定节点下添加子项
  const handleAddChildToNode = (targetNodeId: string) => {
    const newChildId = createTempId("sub");
    const newChild: TenantMenuNode = {
      id: newChildId,
      parentId: targetNodeId,
      itemType: "PAGE",
      pageKey: data.availablePages[0]?.pageKey || null,
      customLabel: null,
      customIcon: "FileText",
      sortOrder: 99,
      isVisible: true,
    };

    function insertChild(nodes: readonly TenantMenuNode[]): TenantMenuNode[] {
      return nodes.map((node) => {
        if (node.id === targetNodeId) {
          return {
            ...node,
            itemType: "GROUP",
            children: [...(node.children || []), newChild],
          };
        }
        if (node.children) {
          return { ...node, children: insertChild(node.children) };
        }
        return node;
      });
    }

    setTree((prev) => insertChild(prev));
    setSelectedNodeId(newChildId);
    setExpandedNodes((prev) => ({ ...prev, [targetNodeId]: true }));
    setIsConfigured(true);
    toast.success("已就近添加子菜单项");
  };

  // 3. 从功能池挂载页面
  const handleMountPage = (page: StandardPageDescriptor) => {
    let targetId = "";
    if (selectedNode?.itemType === "GROUP") {
      targetId = selectedNode.id;
    } else if (parentNode) {
      targetId = parentNode.id;
    } else if (tree.length > 0 && tree[0].itemType === "GROUP") {
      targetId = tree[0].id;
    }

    const newChildId = createTempId("page");
    const newChild: TenantMenuNode = {
      id: newChildId,
      parentId: targetId || null,
      itemType: "PAGE",
      pageKey: page.pageKey,
      customLabel: null,
      customIcon: page.defaultIcon || null,
      sortOrder: 99,
      isVisible: true,
    };

    if (targetId) {
      function appendToTarget(
        nodes: readonly TenantMenuNode[],
      ): TenantMenuNode[] {
        return nodes.map((node) => {
          if (node.id === targetId) {
            return {
              ...node,
              itemType: "GROUP",
              children: [...(node.children || []), newChild],
            };
          }
          if (node.children) {
            return { ...node, children: appendToTarget(node.children) };
          }
          return node;
        });
      }
      setTree((prev) => appendToTarget(prev));
      setExpandedNodes((prev) => ({ ...prev, [targetId]: true }));
    } else {
      setTree((prev) => [...prev, newChild]);
    }

    setSelectedNodeId(newChildId);
    setIsConfigured(true);
    toast.success(`已挂载页面：${page.defaultLabel}`);
  };

  // 4. 更新当前选中节点
  const handleUpdateNode = (patch: Partial<TenantMenuNode>) => {
    if (!selectedNodeId) return;
    const meta = selectedNode?.pageKey
      ? pageMap.get(selectedNode.pageKey)
      : null;
    if (
      (selectedNode?.isProtected || meta?.isProtected) &&
      patch.isVisible === false
    ) {
      toast.error("系统核心受保护功能必须保持可见，不可隐藏！");
      return;
    }

    function update(nodes: readonly TenantMenuNode[]): TenantMenuNode[] {
      return nodes.map((node) => {
        if (node.id === selectedNodeId) {
          return { ...node, ...patch };
        }
        if (node.children) {
          return { ...node, children: update(node.children) };
        }
        return node;
      });
    }
    setTree((prev) => update(prev));
    setIsConfigured(true);
  };

  // 5. 切换选中节点类型
  const handleChangeNodeType = (
    newType: "PAGE" | "LINK" | "GROUP" | "SECTION",
  ) => {
    if (!selectedNode) return;
    const meta = selectedNode.pageKey
      ? pageMap.get(selectedNode.pageKey)
      : null;
    if (
      (selectedNode.isProtected || meta?.isProtected) &&
      newType !== "PAGE"
    ) {
      toast.error(
        "系统核心受保护功能必须保持为功能页面类型，不可转为外部链接、目录或分区！",
      );
      return;
    }

    const patch: Record<string, unknown> = { itemType: newType };
    if (newType === "PAGE") {
      patch.externalUrl = null;
      if (!selectedNode.pageKey) {
        patch.pageKey = data.availablePages[0]?.pageKey || null;
      }
    } else if (newType === "LINK") {
      patch.pageKey = null;
      if (!selectedNode.externalUrl) {
        patch.externalUrl = "https://";
      }
    } else if (newType === "GROUP") {
      patch.pageKey = null;
      patch.externalUrl = null;
      if (!selectedNode.children) {
        patch.children = [];
      }
    } else if (newType === "SECTION") {
      patch.pageKey = null;
      patch.externalUrl = null;
      patch.customIcon = null;
      if (!selectedNode.children) {
        patch.children = [];
      }
    }
    handleUpdateNode(patch as Partial<TenantMenuNode>);
  };

  // 6. 移动选中节点到新父节点
  const handleMoveToParent = (targetParentId: string | null) => {
    if (!selectedNode) return;
    let nodeToMove: TenantMenuNode | null = null;

    function extract(nodes: readonly TenantMenuNode[]): TenantMenuNode[] {
      const remaining: TenantMenuNode[] = [];
      for (const node of nodes) {
        if (node.id === selectedNodeId) {
          nodeToMove = { ...node, parentId: targetParentId };
        } else {
          remaining.push({
            ...node,
            children: node.children ? extract(node.children) : undefined,
          });
        }
      }
      return remaining;
    }

    const treeWithoutNode = extract(tree);
    if (!nodeToMove) return;

    if (targetParentId) {
      function insert(nodes: readonly TenantMenuNode[]): TenantMenuNode[] {
        return nodes.map((node) => {
          if (node.id === targetParentId) {
            return {
              ...node,
              itemType: "GROUP",
              children: [...(node.children || []), nodeToMove!],
            };
          }
          if (node.children) {
            return { ...node, children: insert(node.children) };
          }
          return node;
        });
      }
      setTree(insert(treeWithoutNode));
      setExpandedNodes((prev) => ({ ...prev, [targetParentId]: true }));
    } else {
      setTree([...treeWithoutNode, nodeToMove]);
    }
    setIsConfigured(true);
    toast.success("已更改所属目录");
  };

  // 7. 删除节点
  const handleDeleteNode = (nodeId: string) => {
    // 递归检查要删除的子树中是否包含受保护的核心节点
    function containsProtected(n: TenantMenuNode): boolean {
      const meta = n.pageKey ? pageMap.get(n.pageKey) : null;
      if (n.isProtected || meta?.isProtected) return true;
      if (n.children && n.children.length > 0) {
        return n.children.some(containsProtected);
      }
      return false;
    }

    function findTarget(
      nodes: readonly TenantMenuNode[],
    ): TenantMenuNode | null {
      for (const n of nodes) {
        if (n.id === nodeId) return n;
        if (n.children) {
          const found = findTarget(n.children);
          if (found) return found;
        }
      }
      return null;
    }

    const targetNode = findTarget(tree);
    if (targetNode && containsProtected(targetNode)) {
      toast.error(
        "该节点（或其子项）包含系统核心受保护功能，不可删除，防止丢失管理入口！",
      );
      return;
    }

    function remove(nodes: readonly TenantMenuNode[]): TenantMenuNode[] {
      return nodes
        .filter((n) => n.id !== nodeId)
        .map((n) => (n.children ? { ...n, children: remove(n.children) } : n));
    }
    setTree((prev) => remove(prev));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId("");
    }
    setIsConfigured(true);
    toast.success("已删除菜单节点");
  };

  // 8. 排序节点
  const handleMoveNode = (nodeId: string, direction: "up" | "down") => {
    function reorder(nodes: readonly TenantMenuNode[]): TenantMenuNode[] {
      const idx = nodes.findIndex((n) => n.id === nodeId);
      if (idx !== -1) {
        const targetIdx = direction === "up" ? idx - 1 : idx + 1;
        if (targetIdx >= 0 && targetIdx < nodes.length) {
          const updated = [...nodes];
          const temp = updated[idx];
          updated[idx] = updated[targetIdx];
          updated[targetIdx] = temp;
          return updated.map((item, s) => ({ ...item, sortOrder: s + 1 }));
        }
        return [...nodes];
      }
      return nodes.map((n) =>
        n.children ? { ...n, children: reorder(n.children) } : n,
      );
    }
    setTree((prev) => reorder(prev));
    setIsConfigured(true);
  };

  // 9. 保存菜单配置到数据库
  const handleSave = () => {
    startTransition(async () => {
      const flatItems = flattenMenuTreeForSave(tree);

      const res = await saveMenuTreeAction(
        { items: flatItems },
        data.availablePages,
      );

      if (res.success) {
        setTree([...res.data.currentTree]);
        setIsConfigured(res.data.currentTree.length > 0);
        toast.success("导航菜单配置已成功持久化，侧边栏即刻生效！");
        router?.refresh();
      } else {
        toast.error(res.error || "保存失败，请稍后重试");
      }
    });
  };

  // 10. 载入推荐业务模板
  const handleLoadRecommendedTemplate = () => {
    const recommended = buildRecommendedBusinessTree(
      data.availablePages,
    );
    setTree(recommended);
    setIsConfigured(true);
    if (recommended.length > 0) {
      setSelectedNodeId(recommended[0].id);
      const exp: Record<string, boolean> = {};
      for (const item of recommended) {
        exp[item.id] = true;
      }
      setExpandedNodes(exp);
    }
    toast.success("已载入系统推荐的业务菜单结构，可在界面继续微调并保存");
  };

  // 11. 恢复出厂预设菜单
  const handleResetToDefault = () => {
    startTransition(async () => {
      const res = await resetMenuTreeAction(data.availablePages);
      if (res.success) {
        const fresh = buildRecommendedBusinessTree(data.availablePages);
        setTree(fresh);
        setSelectedNodeId(fresh[0]?.id || "");
        setIsConfigured(false);
        toast.success("已恢复出厂默认预设，数据库个性化记录已重置");
        router?.refresh();
      } else {
        toast.error(res.error || "操作失败");
      }
    });
  };

  return (
    <MasterDetailShell
      className="h-[calc(100vh-5.5rem)] min-h-[560px] border border-border/80 rounded-lg bg-card shadow-xs"
      masterWidth="w-full lg:w-80 xl:w-[320px]"
      masterHeader={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs font-semibold flex items-center gap-1.5">
            <Layers className="size-3.5 text-primary" />
            <span>业务菜单树</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[11px] px-2"
            onClick={handleAddRootItem}
            title="新建顶级菜单项"
          >
            <Plus className="size-3 mr-1" />
            新增顶级
          </Button>
        </div>
      }
      master={
        <div className="space-y-0.5">
          {tree.length === 0 ? (
            <div className="py-12 px-3 text-center space-y-3">
              <div className="size-8 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                <Sparkles className="size-4" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">
                  尚未配置任何业务菜单
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  租户左侧边栏当前仅展示工作台和系统设置。
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-1.5">
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 text-xs w-full"
                  onClick={handleLoadRecommendedTemplate}
                >
                  <Download className="size-3 mr-1" />
                  一键载入出厂推荐菜单
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs w-full"
                  onClick={handleAddRootItem}
                >
                  <Plus className="size-3 mr-1" />
                  从空白手工创建
                </Button>
              </div>
            </div>
          ) : (
            tree.map((node) => (
              <MenuTreeNodeItem
                key={node.id}
                node={node}
                selectedNodeId={selectedNodeId}
                expandedNodes={expandedNodes}
                pageMap={pageMap}
                onSelectNode={setSelectedNodeId}
                onToggleExpand={(id) =>
                  setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }))
                }
                onAddChild={handleAddChildToNode}
                onMoveNode={handleMoveNode}
                onDeleteNode={handleDeleteNode}
              />
            ))
          )}
        </div>
      }
      detailHeader={
        <div className="flex flex-wrap items-center justify-between w-full gap-2">
          {/* 左侧：节点类型快速切换组 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground shrink-0">
              <Sliders className="size-3.5 text-primary" />
              <span>类型:</span>
            </div>

            {selectedNode ? (
              <div className="flex items-center rounded-md border border-border/80 p-0.5 bg-muted/60 text-xs">
                <button
                  type="button"
                  onClick={() => handleChangeNodeType("PAGE")}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    selectedNode.itemType === "PAGE"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  }`}
                >
                  功能页面
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeNodeType("LINK")}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    selectedNode.itemType === "LINK"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  }`}
                >
                  外部链接
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeNodeType("GROUP")}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    selectedNode.itemType === "GROUP"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  }`}
                >
                  目录分组
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeNodeType("SECTION")}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    selectedNode.itemType === "SECTION"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  }`}
                >
                  分区标头
                </button>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">未选择节点</span>
            )}
          </div>

          {/* 右侧：全局保存与状态操作组 */}
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <Badge
                variant="default"
                className="text-[11px] bg-emerald-600 text-white font-normal h-6"
              >
                个性化配置已生效
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30 font-normal h-6"
              >
                出厂预设模式
              </Badge>
            )}

            {isConfigured ? (
              <ConfirmDialog
                title="确认恢复出厂预设菜单？"
                description="恢复后将清空租户数据库中的个性化菜单配置，重新生效平台最新的出厂推荐树与自动升级能力。"
                confirmText="确认恢复预设"
                variant="destructive"
                onConfirm={handleResetToDefault}
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6.5 text-xs px-2"
                    disabled={isPending}
                  >
                    <RotateCcw className="size-3 mr-1" />
                    恢复出厂
                  </Button>
                }
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-6.5 text-xs px-2"
                onClick={handleLoadRecommendedTemplate}
                disabled={isPending}
              >
                <Download className="size-3 mr-1" />
                重新载入
              </Button>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              className="h-6.5 text-xs px-2.5 bg-primary hover:bg-primary/90"
            >
              <Save className="size-3 mr-1" />
              {isPending ? "保存中..." : "保存生效"}
            </Button>
          </div>
        </div>
      }
      detail={
        <div className="space-y-3">
          {selectedNode ? (
            <Card className="border border-border/80 shadow-xs">
              <CardContent className="p-3">
                <NodePropertyForm
                  selectedNode={selectedNode}
                  availableParentGroups={availableParentGroups}
                  categorizedPages={categorizedPages}
                  pageMap={pageMap}
                  onUpdateNode={handleUpdateNode}
                  onSelectPageKey={(val) => {
                    const meta = pageMap.get(val);
                    handleUpdateNode({
                      pageKey: val,
                      customIcon:
                        meta?.defaultIcon || selectedNode.customIcon,
                    });
                  }}
                  onMoveToParent={handleMoveToParent}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground">
              请从左侧树中点击选择一个菜单项，或点击 [+] 新增一项以进行配置
            </div>
          )}

          {/* 可用功能页面池 */}
          <AvailablePagePool
            categorizedPages={categorizedPages}
            poolSearch={poolSearch}
            onSearchChange={setPoolSearch}
            pageMountCounts={pageMountCounts}
            onMountPage={handleMountPage}
          />
        </div>
      }
    />
  );
}
