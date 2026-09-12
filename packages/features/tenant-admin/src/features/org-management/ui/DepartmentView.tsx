"use client";

import React, { useState, useTransition } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  PageShell,
} from "@chenrun/ui";
import {
  Building,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Users,
  AlertCircle,
  CheckCircle2,
  FolderTree,
} from "lucide-react";
import type { DepartmentTreeNode } from "../types";
import { deleteDepartmentAction, listDepartmentTreeAction } from "../actions";
import { DepartmentFormModal } from "./DepartmentFormModal";

export interface DepartmentViewProps {
  readonly initialTree: readonly DepartmentTreeNode[];
}

/** 扁平化部门项，用于上级下拉选择 */
interface FlatDeptOption {
  readonly id: string;
  readonly name: string;
  readonly depth: number;
}

function flattenTreeForSelect(
  nodes: readonly DepartmentTreeNode[],
  depth = 0,
): FlatDeptOption[] {
  const result: FlatDeptOption[] = [];
  for (const n of nodes) {
    result.push({ id: n.id, name: n.name, depth });
    if (n.children && n.children.length > 0) {
      result.push(...flattenTreeForSelect(n.children, depth + 1));
    }
  }
  return result;
}

/**
 * 部门拓扑树形管理面板组件 (现代数智工业风)
 * 支持递归树状展开折叠、新增子部门、调整上下级与删除保护
 */
export function DepartmentView({ initialTree }: DepartmentViewProps) {
  const [treeData, setTreeData] =
    useState<readonly DepartmentTreeNode[]>(initialTree);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // 默认展开前两层
    const set = new Set<string>();
    for (const node of initialTree) {
      set.add(node.id);
    }
    return set;
  });

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [modalState, setModalState] = useState<{
    mode: "create" | "edit";
    targetDept?: DepartmentTreeNode;
    defaultParentId?: string | null;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const refreshTree = async () => {
    const res = await listDepartmentTreeAction();
    if (res.success && res.data) {
      setTreeData(res.data);
    }
  };

  const openCreateModal = (defaultParentId?: string | null) => {
    setModalState({ mode: "create", defaultParentId });
    setFeedback(null);
  };

  const openEditModal = (dept: DepartmentTreeNode) => {
    setModalState({ mode: "edit", targetDept: dept });
    setFeedback(null);
  };

  const handleDelete = (dept: DepartmentTreeNode) => {
    if (!confirm(`确定要删除部门 [${dept.name}] 吗？该操作不可逆。`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteDepartmentAction(dept.id);
      if (res.success) {
        setFeedback({ type: "success", message: "部门已成功删除" });
        await refreshTree();
      } else {
        setFeedback({
          type: "error",
          message: res.error || "删除部门失败",
        });
      }
    });
  };

  const flatSelectOptions = flattenTreeForSelect(treeData);

  const renderTree = (nodes: readonly DepartmentTreeNode[], depth = 0) => {
    if (!nodes || nodes.length === 0) return null;

    return (
      <div className="space-y-2">
        {nodes.map((node) => {
          const hasChildren = node.children && node.children.length > 0;
          const isExpanded = expandedIds.has(node.id);

          return (
            <div key={node.id} className="space-y-1.5">
              <div
                className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition-all hover:border-blue-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
                style={{ marginLeft: `${depth * 24}px` }}
              >
                <div className="flex items-center gap-2.5">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => toggleExpand(node.id)}
                      className="flex size-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-4 text-blue-600" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </button>
                  ) : (
                    <span className="size-6 shrink-0 flex items-center justify-center text-slate-300">
                      •
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <Building className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {node.name}
                    </span>
                    <Badge variant="outline" className="text-[11px] font-mono">
                      {node.code}
                    </Badge>
                  </div>

                  {node.leaderName && (
                    <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-[11px]">
                      负责人: {node.leaderName}
                    </Badge>
                  )}

                  <div className="flex items-center gap-1 text-xs text-slate-400 pl-2">
                    <Users className="size-3.5 text-slate-400" />
                    <span>在职 {node.employeeCount} 人</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-90 transition-opacity group-hover:opacity-100">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-blue-600 hover:bg-blue-50"
                    onClick={() => openCreateModal(node.id)}
                  >
                    <Plus className="mr-1 size-3.5" />
                    添加子部门
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-slate-600 hover:bg-slate-100"
                    onClick={() => openEditModal(node)}
                  >
                    <Edit2 className="mr-1 size-3.5" />
                    编辑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                    onClick={() => handleDelete(node)}
                  >
                    <Trash2 className="mr-1 size-3.5" />
                    删除
                  </Button>
                </div>
              </div>

              {hasChildren &&
                isExpanded &&
                renderTree(node.children, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <PageShell
      title="企业部门架构"
      description="支持展开折叠查看完整部门拓扑。调换上级部门自动进行防环保护，严禁产生循环依赖。"
      icon={<Building className="size-5 text-blue-600" />}
      actions={
        <Button
          onClick={() => openCreateModal(null)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
        >
          <Plus className="mr-1.5 size-4" />
          新建部门
        </Button>
      }
      feedback={feedback}
      onDismissFeedback={() => setFeedback(null)}
    >
      {/* 部门架构树主卡片 */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
            <FolderTree className="size-5 text-blue-600" />
            <span>企业部门组织树</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            支持展开折叠查看完整部门拓扑。调换上级部门自动进行防环保护，严禁产生循环依赖。
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {treeData.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              当前暂未建立任何部门，请点击右上角按钮创建初始部门
            </div>
          ) : (
            renderTree(treeData)
          )}
        </CardContent>
      </Card>

      {modalState && (
        <DepartmentFormModal
          mode={modalState.mode}
          record={modalState.targetDept}
          parentOptions={flatSelectOptions}
          defaultParentId={modalState.defaultParentId}
          onClose={() => setModalState(null)}
          onSaved={async () => {
            setModalState(null);
            await refreshTree();
          }}
        />
      )}
    </PageShell>
  );
}
