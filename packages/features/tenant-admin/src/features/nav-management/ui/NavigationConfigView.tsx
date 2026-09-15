"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Label,
  Badge,
  PageShell,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  ConfirmDialog,
  IconPicker,
  DynamicNavIcon,
  toast,
  useSafeRouter,
} from "@base/ui";
import {
  Plus,
  Save,
  RotateCcw,
  Trash2,
  ArrowUp,
  ArrowDown,
  Folder,
  ChevronRight,
  ChevronDown,
  Layers,
  Search,
  FileText,
  Sliders,
  Sparkles,
  Download,
} from "lucide-react";
import type {
  StandardPageDescriptor,
  TenantMenuNode,
} from "@base/authorization";
import type { NavigationConfigData, SaveMenuItemInput } from "../types";
import { saveMenuTreeAction, resetMenuTreeAction } from "../actions";

export interface NavigationConfigViewProps {
  readonly initialData: NavigationConfigData;
}

/** 辅助生成临时稳定唯一ID */
function createTempId(prefix = "m"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

/**
 * 将业务切片页面池聚合成出厂推荐的业务大菜单结构 (供用户主动点击载入模板)
 */
function buildRecommendedBusinessTree(
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
function collectGroupNodes(
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
 * 租户导航菜单动态配置控制台 (方案 A：左侧紧凑树形 + 右侧直观属性与功能池)
 */
export function NavigationConfigView({
  initialData,
}: NavigationConfigViewProps) {
  const router = useSafeRouter();
  const [isPending, startTransition] = useTransition();

  // 1. 树状数据状态：若未配置，严格保持为空，不强行塞入默认菜单
  const [tree, setTree] = useState<TenantMenuNode[]>(() => {
    if (initialData.currentTree && initialData.currentTree.length > 0) {
      return [...initialData.currentTree];
    }
    return [];
  });

  const [isConfigured, setIsConfigured] = useState<boolean>(() => {
    return Boolean(
      initialData.currentTree && initialData.currentTree.length > 0,
    );
  });

  // 2. 当前选中的节点 ID
  const [selectedNodeId, setSelectedNodeId] = useState<string>(() => {
    return initialData.currentTree?.[0]?.id || "";
  });

  // 3. 目录展开折叠状态 (nodeId -> boolean)
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(
    {},
  );

  // 4. 业务功能池搜索关键词
  const [poolSearch, setPoolSearch] = useState("");

  // 页面元数据快速查找字典
  const pageMap = useMemo(() => {
    return new Map(initialData.availablePages.map((p) => [p.pageKey, p]));
  }, [initialData.availablePages]);

  // 统计每个页面被挂载的次数（不加任何限制，仅用于视觉提示）
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

  // 可作为父级的目录列表 (支持多级目录选择)
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

    for (const p of initialData.availablePages) {
      if (
        q &&
        !p.defaultLabel.toLowerCase().includes(q) &&
        !p.href.toLowerCase().includes(q)
      ) {
        continue;
      }
      const existing = map.get(p.featureId);
      if (existing) {
        existing.pages.push(p);
      } else {
        map.set(p.featureId, { featureName: p.featureName, pages: [p] });
      }
    }

    return Array.from(map.entries()).map(([featureId, data]) => ({
      featureId,
      featureName: data.featureName,
      pages: data.pages,
    }));
  }, [initialData.availablePages, poolSearch]);

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

  // 1. 新建顶级菜单项 (点击树头部的 [+] 触发)
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

  // 2. 在指定节点下就近添加子项 (点击节点右侧悬浮的 [+] 触发)
  const handleAddChildToNode = (targetNodeId: string) => {
    const newChildId = createTempId("sub");
    const newChild: TenantMenuNode = {
      id: newChildId,
      parentId: targetNodeId,
      itemType: "PAGE",
      pageKey: initialData.availablePages[0]?.pageKey || null,
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
            // 只要添加子项，该节点自动升为 GROUP 类型
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

  // 3. 从功能池快速挂载页面到当前选中的目录
  const handleMountPage = (page: StandardPageDescriptor) => {
    let targetId = "";
    if (selectedNode?.itemType === "GROUP") {
      targetId = selectedNode.id;
    } else if (parentNode) {
      targetId = parentNode.id;
    } else if (tree.length > 0 && tree[0].itemType === "GROUP") {
      targetId = tree[0].id;
    }

    if (!targetId) {
      toast.error("请先在左侧树中选中一个目录项，再挂载功能页面");
      return;
    }

    const newChildId = createTempId("leaf");
    const newChild: TenantMenuNode = {
      id: newChildId,
      parentId: targetId,
      itemType: "PAGE",
      pageKey: page.pageKey,
      customLabel: null,
      customIcon: page.defaultIcon || "FileText",
      sortOrder: 99,
      isVisible: true,
    };

    function insertPage(nodes: readonly TenantMenuNode[]): TenantMenuNode[] {
      return nodes.map((node) => {
        if (node.id === targetId) {
          return {
            ...node,
            children: [...(node.children || []), newChild],
          };
        }
        if (node.children) {
          return { ...node, children: insertPage(node.children) };
        }
        return node;
      });
    }

    setTree((prev) => insertPage(prev));
    setSelectedNodeId(newChildId);
    setExpandedNodes((prev) => ({ ...prev, [targetId]: true }));
    setIsConfigured(true);
    toast.success(`已将“${page.defaultLabel}”挂载到当前目录`);
  };

  // 4. 更新当前选中节点的属性
  const updateSelectedNode = (patch: Partial<TenantMenuNode>) => {
    if (!selectedNode) return;
    const targetId = selectedNode.id;

    function applyPatch(nodes: readonly TenantMenuNode[]): TenantMenuNode[] {
      return nodes.map((node) => {
        if (node.id === targetId) {
          return { ...node, ...patch };
        }
        if (node.children) {
          return { ...node, children: applyPatch(node.children) };
        }
        return node;
      });
    }

    setTree((prev) => applyPatch(prev));
    setIsConfigured(true);
  };

  // 5. 切换节点类型 (PAGE <-> LINK <-> GROUP)
  const handleChangeItemType = (newType: "PAGE" | "LINK" | "GROUP") => {
    if (!selectedNode || selectedNode.itemType === newType) return;

    if (newType === "LINK") {
      updateSelectedNode({
        itemType: "LINK",
        pageKey: null,
        externalUrl: selectedNode.externalUrl || "https://",
        openInNewTab: selectedNode.openInNewTab ?? true,
        customIcon: selectedNode.customIcon || "ExternalLink",
      });
    } else if (newType === "PAGE") {
      const firstPage = initialData.availablePages[0];
      updateSelectedNode({
        itemType: "PAGE",
        pageKey: firstPage?.pageKey || null,
        externalUrl: null,
        customIcon: firstPage?.defaultIcon || "FileText",
      });
    } else if (newType === "GROUP") {
      updateSelectedNode({
        itemType: "GROUP",
        pageKey: null,
        externalUrl: null,
        customIcon: selectedNode.customIcon || "Folder",
        children: selectedNode.children || [],
      });
    }
  };

  // 6. 切换绑定的系统物理功能页
  const handleSelectPageKey = (pageKey: string) => {
    const meta = pageMap.get(pageKey);
    updateSelectedNode({
      pageKey,
      customIcon: meta?.defaultIcon || selectedNode?.customIcon || "FileText",
    });
  };

  // 7. 切换所属父级目录 (支持多级任意挂载)
  const handleChangeParent = (newParentId: string) => {
    if (!selectedNode) return;
    const oldParentId = parentNode ? parentNode.id : "root";
    if (oldParentId === newParentId) return;

    setTree((prev) => {
      let movedItem: TenantMenuNode | null = null;

      // 递归从旧树位置摘出
      function remove(nodes: readonly TenantMenuNode[]): TenantMenuNode[] {
        const result: TenantMenuNode[] = [];
        for (const n of nodes) {
          if (n.id === selectedNode!.id) {
            movedItem = {
              ...n,
              parentId: newParentId === "root" ? null : newParentId,
            };
            continue;
          }
          if (n.children) {
            result.push({ ...n, children: remove(n.children) });
          } else {
            result.push(n);
          }
        }
        return result;
      }

      const stripped = remove(prev);
      if (!movedItem) return prev;

      // 移入新父级
      if (newParentId === "root") {
        return [...stripped, movedItem];
      }

      function insert(nodes: readonly TenantMenuNode[]): TenantMenuNode[] {
        return nodes.map((n) => {
          if (n.id === newParentId) {
            return { ...n, children: [...(n.children || []), movedItem!] };
          }
          if (n.children) {
            return { ...n, children: insert(n.children) };
          }
          return n;
        });
      }

      return insert(stripped);
    });

    setIsConfigured(true);
    toast.success("已变更所属父级目录");
  };

  // 8. 删除节点及其后代
  const handleDeleteNode = (nodeId: string) => {
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
    toast.success("已删除该菜单节点");
  };

  // 9. 同层级排序微调 (上移/下移)
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

  // 10. 保存菜单配置到数据库
  const handleSave = () => {
    startTransition(async () => {
      // 递归全量扁平化提取，保留前端稳定唯一 ID，确保 parentId 严格一致！
      const flatItems: SaveMenuItemInput[] = [];
      let sortCounter = 1;

      function flatten(
        nodes: readonly TenantMenuNode[],
        parentId: string | null,
      ) {
        for (const node of nodes) {
          flatItems.push({
            id: node.id,
            parentId,
            itemType: node.itemType,
            pageKey: node.pageKey || null,
            externalUrl: node.externalUrl || null,
            openInNewTab: node.openInNewTab,
            customLabel: node.customLabel || null,
            customIcon: node.customIcon || null,
            sortOrder: sortCounter++,
            isVisible: node.isVisible !== false,
          });

          if (node.children && node.children.length > 0) {
            flatten(node.children, node.id);
          }
        }
      }

      flatten(tree, null);

      const res = await saveMenuTreeAction(
        { items: flatItems },
        initialData.availablePages,
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

  // 11. 载入推荐业务模板
  const handleLoadRecommendedTemplate = () => {
    const recommended = buildRecommendedBusinessTree(
      initialData.availablePages,
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

  // 12. 清空自定义业务菜单
  const handleClearAll = () => {
    startTransition(async () => {
      const res = await resetMenuTreeAction(initialData.availablePages);
      if (res.success) {
        setTree([]);
        setSelectedNodeId("");
        setIsConfigured(false);
        toast.success("已清空自定义业务菜单，侧边栏仅展示系统基础项");
        router?.refresh();
      } else {
        toast.error(res.error || "操作失败");
      }
    });
  };

  // 递归渲染树节点组件
  const renderTreeNode = (node: TenantMenuNode, depth = 0) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isGroup = node.itemType === "GROUP";
    const isLink = node.itemType === "LINK";
    const isSelected = selectedNodeId === node.id;
    const isExpanded = expandedNodes[node.id] ?? true;
    const pageMeta = node.pageKey ? pageMap.get(node.pageKey) : null;
    const labelText =
      node.customLabel ||
      pageMeta?.defaultLabel ||
      node.externalUrl ||
      "未命名";

    return (
      <div key={node.id} className="space-y-0.5">
        <div
          onClick={() => setSelectedNodeId(node.id)}
          style={{ paddingLeft: `${Math.max(6, depth * 14 + 6)}px` }}
          className={`group flex items-center justify-between rounded pr-1.5 py-1 text-xs cursor-pointer border transition-colors ${
            isSelected
              ? "bg-primary/10 border-primary text-primary font-medium"
              : "border-transparent hover:bg-muted/60 text-foreground"
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {/* 折叠小三角 */}
            {hasChildren || isGroup ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedNodes((prev) => ({
                    ...prev,
                    [node.id]: !isExpanded,
                  }));
                }}
                className="size-4 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="size-3" />
                ) : (
                  <ChevronRight className="size-3" />
                )}
              </button>
            ) : (
              <span className="size-4 shrink-0" />
            )}

            <DynamicNavIcon
              name={node.customIcon || pageMeta?.defaultIcon}
              fallbackType={isGroup ? "group" : isLink ? "external" : "page"}
              className="size-3.5 shrink-0 text-primary"
            />

            <span className="truncate flex-1 text-xs">{labelText}</span>

            {isLink && (
              <span className="text-[9px] text-muted-foreground font-mono bg-muted/60 px-1 rounded shrink-0">
                外链
              </span>
            )}

            {isGroup && hasChildren && (
              <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                ({node.children!.length})
              </span>
            )}
          </div>

          {/* 节点悬浮快捷操作区 */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
            {/* 就近添加子菜单项按钮 */}
            <Button
              variant="ghost"
              size="icon"
              className="size-4 text-primary hover:bg-primary/20 hover:text-primary"
              title="在此项下添加子菜单"
              onClick={(e) => {
                e.stopPropagation();
                handleAddChildToNode(node.id);
              }}
            >
              <Plus className="size-3" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-4 text-muted-foreground"
              title="上移"
              onClick={(e) => {
                e.stopPropagation();
                handleMoveNode(node.id, "up");
              }}
            >
              <ArrowUp className="size-2.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-4 text-muted-foreground"
              title="下移"
              onClick={(e) => {
                e.stopPropagation();
                handleMoveNode(node.id, "down");
              }}
            >
              <ArrowDown className="size-2.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-4 text-muted-foreground hover:text-destructive"
              title="删除此项"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteNode(node.id);
              }}
            >
              <Trash2 className="size-2.5" />
            </Button>
          </div>
        </div>

        {/* 递归子树渲染 */}
        {(hasChildren || isGroup) && isExpanded && node.children && (
          <div className="space-y-0.5 border-l border-border/40 ml-3">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <PageShell
      className="gap-3"
      title="业务导航菜单配置"
      description="配置租户业务大菜单与多级子功能；系统管理（工作台、组织架构、权限管理、企业设置）由底座权限直接控制，无需在此配置。"
      actions={
        <div className="flex items-center gap-2">
          {isConfigured ? (
            <Badge
              variant="default"
              className="text-xs bg-emerald-600 text-white"
            >
              已启用自定义业务菜单
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-xs text-muted-foreground bg-muted/40"
            >
              未配置 (仅显示系统基座)
            </Badge>
          )}

          {tree.length > 0 ? (
            <ConfirmDialog
              title="确认清空自定义业务菜单？"
              description="清空后数据库将不再保存自定义业务菜单，侧边栏将仅展示工作台和系统设置项。"
              confirmText="确认清空"
              variant="destructive"
              onConfirm={handleClearAll}
              trigger={
                <Button variant="outline" size="sm" disabled={isPending}>
                  <RotateCcw className="size-3.5 mr-1.5" />
                  清空配置
                </Button>
              }
            />
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadRecommendedTemplate}
              disabled={isPending}
            >
              <Download className="size-3.5 mr-1.5" />
              载入推荐业务模板
            </Button>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="size-3.5 mr-1.5" />
            {isPending ? "保存中..." : "保存并生效"}
          </Button>
        </div>
      }
    >
      {/* 方案 A 双栏结构：左栏固定 280px 紧凑树，右栏自适应 */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* 左栏：紧凑菜单大纲树 (固定 280px 宽度) */}
        <div className="w-full lg:w-[280px] shrink-0 space-y-3">
          <Card className="border border-border/80 shadow-xs bg-card">
            <CardHeader className="py-2 px-3 border-b border-border/60 bg-transparent flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary" />
                <span>业务菜单树</span>
              </CardTitle>

              {/* 树顶工具栏：新建顶级项 */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[11px] px-2"
                  onClick={handleAddRootItem}
                  title="新建顶级菜单项"
                >
                  <Plus className="size-3 mr-0.5" /> 新建菜单
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-1.5 space-y-1 max-h-[calc(100vh-270px)] overflow-y-auto">
              {tree.length === 0 ? (
                <div className="py-8 px-2 text-center">
                  <div className="mx-auto flex size-8 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-2">
                    <Folder className="size-4" />
                  </div>
                  <div className="text-xs font-medium text-foreground">
                    暂无自定义菜单
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 mb-3">
                    点击右上角“新建菜单”从零搭建，或点击下方载入模板。
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs w-full justify-center"
                    onClick={handleLoadRecommendedTemplate}
                  >
                    <Sparkles className="size-3 mr-1 text-amber-500" />
                    载入官方推荐业务模板
                  </Button>
                </div>
              ) : (
                tree.map((node) => renderTreeNode(node, 0))
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右栏：当前节点属性配置 + 业务功能池 */}
        <div className="flex-1 min-w-0 space-y-3.5 w-full">
          {/* 属性配置面板 */}
          <Card className="border border-border/80 shadow-xs bg-card">
            <CardHeader className="py-2 px-4 border-b border-border/60 bg-transparent flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Sliders className="size-3.5 text-primary" />
                <CardTitle className="text-xs font-semibold">
                  {selectedNode ? "节点属性配置" : "请在左侧选择一个菜单节点"}
                </CardTitle>
              </div>

              {selectedNode && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">
                    节点类型:
                  </span>
                  <div className="flex items-center rounded-md border border-border bg-background p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleChangeItemType("PAGE")}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        selectedNode.itemType === "PAGE"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      系统功能页
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChangeItemType("LINK")}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        selectedNode.itemType === "LINK"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      外部链接
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChangeItemType("GROUP")}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        selectedNode.itemType === "GROUP"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      目录分组
                    </button>
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-4">
              {selectedNode ? (
                <div className="space-y-3.5">
                  {/* 类型 1：系统功能页面 */}
                  {selectedNode.itemType === "PAGE" && (
                    <>
                      <div className="grid grid-cols-12 gap-3 items-center">
                        <Label className="col-span-3 text-xs font-medium text-muted-foreground">
                          关联系统功能:
                        </Label>
                        <div className="col-span-9 space-y-1">
                          <Select
                            value={selectedNode.pageKey || ""}
                            onValueChange={handleSelectPageKey}
                          >
                            <SelectTrigger className="h-8 text-xs font-medium">
                              <SelectValue placeholder="选择要绑定的业务功能页面..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[280px]">
                              {categorizedPages.map((cat) => (
                                <div key={cat.featureId} className="py-1">
                                  <div className="px-2 py-0.5 text-[10px] font-semibold text-muted-foreground bg-muted/40">
                                    {cat.featureName}
                                  </div>
                                  {cat.pages.map((p) => (
                                    <SelectItem
                                      key={p.pageKey}
                                      value={p.pageKey}
                                      className="text-xs pl-4"
                                    >
                                      <span className="font-medium">
                                        {p.defaultLabel}
                                      </span>
                                      <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                                        ({p.href})
                                      </span>
                                    </SelectItem>
                                  ))}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>

                          {selectedNode.pageKey && (
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/20 px-2 py-1 rounded border border-border/50">
                              <span className="font-semibold text-foreground">
                                物理路由:
                              </span>
                              <code className="font-mono text-primary text-[11px]">
                                {pageMap.get(selectedNode.pageKey)?.href ||
                                  selectedNode.pageKey}
                              </code>
                              <span className="text-muted-foreground ml-auto">
                                所属:{" "}
                                {pageMap.get(selectedNode.pageKey)?.featureName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-3 items-center">
                        <Label className="col-span-3 text-xs font-medium text-muted-foreground">
                          菜单显示别名:
                        </Label>
                        <div className="col-span-9">
                          <Input
                            value={
                              selectedNode.customLabel ??
                              (selectedNode.pageKey
                                ? pageMap.get(selectedNode.pageKey)
                                    ?.defaultLabel
                                : "") ??
                              ""
                            }
                            placeholder={
                              selectedNode.pageKey
                                ? pageMap.get(selectedNode.pageKey)
                                    ?.defaultLabel
                                : "输入显示别名"
                            }
                            className="h-8 text-xs font-medium"
                            onChange={(e) =>
                              updateSelectedNode({
                                customLabel: e.target.value.trim()
                                  ? e.target.value
                                  : null,
                              })
                            }
                          />
                          {selectedNode.pageKey && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              系统出厂默认名称为：
                              <span className="font-medium text-foreground">
                                {
                                  pageMap.get(selectedNode.pageKey)
                                    ?.defaultLabel
                                }
                              </span>
                              （清空则自动回退默认名）
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* 类型 2：外部系统链接 */}
                  {selectedNode.itemType === "LINK" && (
                    <>
                      <div className="grid grid-cols-12 gap-3 items-center">
                        <Label className="col-span-3 text-xs font-medium text-muted-foreground">
                          外链显示名称:
                        </Label>
                        <div className="col-span-9">
                          <Input
                            value={selectedNode.customLabel || ""}
                            placeholder="例如：外部 BI 看板、飞书知识库、MES 控制台"
                            className="h-8 text-xs font-medium"
                            onChange={(e) =>
                              updateSelectedNode({
                                customLabel: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-3 items-center">
                        <Label className="col-span-3 text-xs font-medium text-muted-foreground">
                          目标 URL 地址:
                        </Label>
                        <div className="col-span-9">
                          <Input
                            value={selectedNode.externalUrl || ""}
                            placeholder="https://bi.company.com"
                            className="h-8 text-xs font-mono"
                            onChange={(e) =>
                              updateSelectedNode({
                                externalUrl: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-3 items-center">
                        <Label className="col-span-3 text-xs font-medium text-muted-foreground">
                          打开行为:
                        </Label>
                        <div className="col-span-9 flex items-center gap-2">
                          <Switch
                            checked={selectedNode.openInNewTab !== false}
                            onCheckedChange={(checked) =>
                              updateSelectedNode({ openInNewTab: checked })
                            }
                          />
                          <span className="text-xs text-muted-foreground">
                            在新浏览器标签页中打开 (_blank)
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 类型 3：目录分组 */}
                  {selectedNode.itemType === "GROUP" && (
                    <div className="grid grid-cols-12 gap-3 items-center">
                      <Label className="col-span-3 text-xs font-medium text-muted-foreground">
                        目录显示名称:
                      </Label>
                      <div className="col-span-9">
                        <Input
                          value={selectedNode.customLabel || ""}
                          placeholder="输入目录名称，如：基础设置、日常业务、物料管理"
                          className="h-8 text-xs font-medium"
                          onChange={(e) =>
                            updateSelectedNode({ customLabel: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* 通用：图标选择器 */}
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <Label className="col-span-3 text-xs font-medium text-muted-foreground">
                      菜单图标:
                    </Label>
                    <div className="col-span-9">
                      <IconPicker
                        value={
                          selectedNode.customIcon ||
                          (selectedNode.pageKey
                            ? pageMap.get(selectedNode.pageKey)?.defaultIcon
                            : null)
                        }
                        onChange={(iconName) =>
                          updateSelectedNode({ customIcon: iconName })
                        }
                        fallbackType={
                          selectedNode.itemType === "GROUP"
                            ? "group"
                            : selectedNode.itemType === "LINK"
                              ? "external"
                              : "page"
                        }
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* 通用：所属父级目录 (支持选择顶级或任意层级目录) */}
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <Label className="col-span-3 text-xs font-medium text-muted-foreground">
                      所属父级目录:
                    </Label>
                    <div className="col-span-9">
                      <Select
                        value={parentNode ? parentNode.id : "root"}
                        onValueChange={(val) => handleChangeParent(val)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="选择所属父级..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[260px]">
                          <SelectItem
                            value="root"
                            className="text-xs font-medium"
                          >
                            [ 作为顶级菜单项 ]
                          </SelectItem>
                          {availableParentGroups
                            .filter((g) => g.id !== selectedNode.id) // 不能选自己作为父级
                            .map((g) => (
                              <SelectItem
                                key={g.id}
                                value={g.id}
                                className="text-xs"
                              >
                                <span
                                  style={{ paddingLeft: `${g.depth * 10}px` }}
                                >
                                  📁 {g.label}
                                </span>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 通用：侧边栏可见性开关 */}
                  <div className="grid grid-cols-12 gap-3 items-center pt-2 border-t border-border/50">
                    <Label className="col-span-3 text-xs font-medium text-muted-foreground">
                      侧边栏显示状态:
                    </Label>
                    <div className="col-span-9 flex items-center gap-2">
                      <Switch
                        checked={selectedNode.isVisible !== false}
                        onCheckedChange={(checked) =>
                          updateSelectedNode({ isVisible: checked })
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        {selectedNode.isVisible === false
                          ? "已隐藏（侧边栏不展示，无需删除）"
                          : "正常显示"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  点击左侧菜单树中的任意菜单项，或点击菜单项后的 [+]
                  创建子项，即可在此配置关联页面、外链与别名
                </div>
              )}
            </CardContent>
          </Card>

          {/* 下半部：跨业务切片功能池 (可挂载到当前选中目录，支持任意重复挂载) */}
          <Card className="border border-border/80 shadow-xs bg-card">
            <CardHeader className="py-2 px-4 border-b border-border/60 bg-transparent flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                  <FileText className="size-3.5 text-primary" />
                  <span>业务功能池 (可多次重复挂载)</span>
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                  点击“+
                  挂载”可将功能直接添加至当前选中的目录中；同一页面支持出现在多个分类中
                </CardDescription>
              </div>

              {/* 搜索框 */}
              <div className="w-[180px] relative">
                <Search className="size-3 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  value={poolSearch}
                  placeholder="搜索业务页面..."
                  className="h-7 pl-7 text-xs"
                  onChange={(e) => setPoolSearch(e.target.value)}
                />
              </div>
            </CardHeader>

            <CardContent className="p-3 max-h-[300px] overflow-y-auto space-y-3">
              {categorizedPages.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  未检索到匹配的业务功能
                </div>
              ) : (
                categorizedPages.map((cat) => (
                  <div key={cat.featureId} className="space-y-1">
                    <div className="text-[11px] font-semibold text-muted-foreground px-1 flex items-center gap-1">
                      <Folder className="size-3 text-primary/70" />
                      <span>{cat.featureName}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {cat.pages.map((page) => {
                        const mountCount =
                          pageMountCounts.get(page.pageKey) ?? 0;
                        return (
                          <div
                            key={page.pageKey}
                            className="flex items-center justify-between p-2 rounded-md border border-border/70 bg-card hover:bg-muted/30 transition-colors text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <DynamicNavIcon
                                name={page.defaultIcon}
                                className="size-3.5 text-primary shrink-0"
                              />
                              <div className="truncate">
                                <div className="font-medium truncate flex items-center gap-1.5">
                                  <span>{page.defaultLabel}</span>
                                  {mountCount > 0 && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] h-3.5 px-1 text-muted-foreground font-mono"
                                    >
                                      已挂 {mountCount} 处
                                    </Badge>
                                  )}
                                </div>
                                <div className="font-mono text-[10px] text-muted-foreground truncate">
                                  {page.href}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 ml-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[11px] px-2 text-primary hover:bg-primary/10 border-primary/40"
                                onClick={() => handleMountPage(page)}
                              >
                                <Plus className="size-2.5 mr-0.5" /> 挂载
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
