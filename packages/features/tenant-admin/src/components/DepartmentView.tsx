"use client";

import React, { useState, useTransition } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Button,
  Badge,
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
import type {
  CreateDepartmentInput,
  DepartmentTreeNode,
  UpdateDepartmentInput,
} from "../types";
import {
  createDepartmentAction,
  deleteDepartmentAction,
  listDepartmentTreeAction,
  updateDepartmentAction,
} from "../actions";

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

  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    parentId: string;
    leaderMemberId: string;
    sort: number;
  }>({
    name: "",
    code: "",
    parentId: "",
    leaderMemberId: "",
    sort: 0,
  });

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
    setFormData({
      name: "",
      code: "",
      parentId: defaultParentId || "",
      leaderMemberId: "",
      sort: 0,
    });
    setFeedback(null);
  };

  const openEditModal = (dept: DepartmentTreeNode) => {
    setModalState({ mode: "edit", targetDept: dept });
    setFormData({
      name: dept.name,
      code: dept.code,
      parentId: dept.parentId || "",
      leaderMemberId: dept.leaderMemberId || "",
      sort: dept.sort,
    });
    setFeedback(null);
  };

  const closeModal = () => {
    setModalState(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFeedback({ type: "error", message: "部门名称不能为空" });
      return;
    }
    if (!formData.code.trim()) {
      setFeedback({ type: "error", message: "部门编码不能为空" });
      return;
    }

    startTransition(async () => {
      if (modalState?.mode === "create") {
        const payload: CreateDepartmentInput = {
          name: formData.name.trim(),
          code: formData.code.trim(),
          parentId: formData.parentId ? formData.parentId : null,
          leaderMemberId: formData.leaderMemberId.trim() || null,
          sort: Number(formData.sort) || 0,
        };
        const res = await createDepartmentAction(payload);
        if (res.success) {
          setFeedback({ type: "success", message: "部门创建成功" });
          closeModal();
          await refreshTree();
        } else {
          setFeedback({
            type: "error",
            message: res.error || "创建部门失败",
          });
        }
      } else if (modalState?.mode === "edit" && modalState.targetDept) {
        const payload: UpdateDepartmentInput = {
          name: formData.name.trim(),
          code: formData.code.trim(),
          parentId: formData.parentId ? formData.parentId : null,
          leaderMemberId: formData.leaderMemberId.trim() || null,
          sort: Number(formData.sort) || 0,
        };
        const res = await updateDepartmentAction(
          modalState.targetDept.id,
          payload,
        );
        if (res.success) {
          setFeedback({ type: "success", message: "部门更新成功" });
          closeModal();
          await refreshTree();
        } else {
          setFeedback({
            type: "error",
            message: res.error || "更新部门失败",
          });
        }
      }
    });
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

              {hasChildren && isExpanded && renderTree(node.children, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 顶部标题栏与全局操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            部门组织拓扑
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            维护企业多层级组织架构树，作为 CASL 数据范围（DEPT / DEPT_TREE）的核心判定事实源。
          </p>
        </div>
        <Button
          onClick={() => openCreateModal(null)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
        >
          <Plus className="mr-1.5 size-4" />
          新增根部门
        </Button>
      </div>

      {/* 状态反馈通知 */}
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-semibold border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

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

      {/* 新增/编辑部门弹窗模态框 */}
      {modalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {modalState.mode === "create" ? "新建部门节点" : "编辑部门节点"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              请填写部门基础信息。系统将严格防范循环引用与重复编码。
            </p>

            <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  部门名称 <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="例如: 华东销售部、研发中心"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  部门编码 (唯一标识) <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="例如: SALES_EAST、DEV"
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  上级部门
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      parentId: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="">-- 无上级 (作为顶级根部门) --</option>
                  {flatSelectOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {"— ".repeat(opt.depth)}
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    同级排序号
                  </label>
                  <Input
                    type="number"
                    value={formData.sort}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sort: Number(e.target.value),
                      }))
                    }
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={closeModal}
                  disabled={isPending}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isPending ? "保存中..." : "确认保存"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
