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
  HierarchyTree,
  ConfirmDialog,
  type HierarchyNodeData,
} from "@base/ui";
import {
  Building,
  Plus,
  Edit2,
  Trash2,
  Users,
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

export interface AdaptedDeptNode extends HierarchyNodeData {
  id: string;
  name: string;
  code: string;
  leaderName: string | null;
  employeeCount: number;
  raw: DepartmentTreeNode;
  children?: AdaptedDeptNode[];
}

function adaptDeptTree(
  nodes: readonly DepartmentTreeNode[],
): AdaptedDeptNode[] {
  return nodes.map((n) => ({
    id: n.id,
    name: n.name,
    code: n.code,
    leaderName: n.leaderName ?? null,
    employeeCount: n.employeeCount,
    raw: n,
    children: n.children ? adaptDeptTree(n.children) : undefined,
  }));
}

/**
 * 部门拓扑树形管理面板组件
 * 基于官方 HierarchyTree 构建，统一管理企业部门组织架构与就近派生操作
 */
export function DepartmentView({ initialTree }: DepartmentViewProps) {
  const [treeData, setTreeData] =
    useState<readonly DepartmentTreeNode[]>(initialTree);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [modalState, setModalState] = useState<{
    mode: "create" | "edit";
    targetDept?: DepartmentTreeNode;
    defaultParentId?: string | null;
  } | null>(null);

  const [deletingDept, setDeletingDept] = useState<DepartmentTreeNode | null>(null);

  const [isPending, startTransition] = useTransition();

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

  const handleConfirmDelete = async () => {
    if (!deletingDept) return;
    const target = deletingDept;

    startTransition(async () => {
      const res = await deleteDepartmentAction(target.id);
      if (res.success) {
        setFeedback({ type: "success", message: "部门已成功删除" });
        await refreshTree();
      } else {
        setFeedback({
          type: "error",
          message: res.error || "删除部门失败",
        });
      }
      setDeletingDept(null);
    });
  };

  const flatSelectOptions = flattenTreeForSelect(treeData);
  const adaptedTree = adaptDeptTree(treeData);

  return (
    <PageShell
      title="企业部门架构"
      description="支持展开折叠查看完整部门拓扑。调换上级部门自动进行防环保护，严禁产生循环依赖。"
      icon={<Building className="size-5 text-primary" />}
      feedback={feedback}
      onDismissFeedback={() => setFeedback(null)}
    >
      <Card className="rounded-xl border border-border/80 bg-card shadow-xs">
        <CardHeader className="border-b border-border/80 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                组织架构拓扑树
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                点击展开或收起子部门，首行常驻快速新建根级部门，行内支持就近新建子部门与信息维护。
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <HierarchyTree<AdaptedDeptNode>
            data={adaptedTree}
            createRootText="新建一级根部门"
            emptyText="暂无部门架构数据，点击上方按钮创建第一条根部门"
            onCreateRoot={() => openCreateModal(null)}
            renderTitle={(node) => (
              <div className="flex items-center gap-2 min-w-0">
                <Building className="size-4 text-primary shrink-0" />
                <span className="text-sm font-semibold text-foreground">
                  {node.name}
                </span>
                <Badge variant="outline" className="text-[11px] font-mono">
                  {node.code}
                </Badge>
              </div>
            )}
            renderExtra={(node) => (
              <div className="flex items-center gap-2 pl-2">
                {node.leaderName && (
                  <Badge variant="secondary" className="text-[11px]">
                    负责人: {node.leaderName}
                  </Badge>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  <span>在职 {node.employeeCount} 人</span>
                </div>
              </div>
            )}
            renderActions={(node) => (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs border-dashed text-primary hover:bg-primary/5 hover:text-primary"
                  onClick={() => openCreateModal(node.id)}
                  title={`在【${node.name}】下添加子部门`}
                >
                  <Plus className="mr-1 size-3.5" />
                  子部门
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => openEditModal(node.raw)}
                >
                  <Edit2 className="mr-1 size-3.5" />
                  编辑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeletingDept(node.raw)}
                  disabled={isPending}
                  title="删除部门"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </>
            )}
          />
        </CardContent>
      </Card>

      {/* 新建/编辑部门 Modal */}
      {modalState && (
        <DepartmentFormModal
          mode={modalState.mode}
          record={modalState.targetDept}
          defaultParentId={modalState.defaultParentId}
          parentOptions={flatSelectOptions}
          onClose={() => setModalState(null)}
          onSaved={async () => {
            setModalState(null);
            setFeedback({
              type: "success",
              message:
                modalState.mode === "create"
                  ? "部门创建成功"
                  : "部门信息更新成功",
            });
            await refreshTree();
          }}
        />
      )}

      {/* 部门删除二次确认弹窗 (UI 框架 ConfirmDialog) */}
      <ConfirmDialog
        open={Boolean(deletingDept)}
        onOpenChange={(v) => {
          if (!v) setDeletingDept(null);
        }}
        title={`确定要删除部门 [${deletingDept?.name}] 吗？`}
        description="该操作不可逆。若部门下尚有在职员工或子级部门，系统将自动拦截并禁止删除。"
        confirmText="确认删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </PageShell>
  );
}
