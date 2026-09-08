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
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Power,
  Users,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type {
  CreatePositionInput,
  PositionItem,
  UpdatePositionInput,
} from "../types";
import {
  createPositionAction,
  deletePositionAction,
  listPositionsAction,
  togglePositionStatusAction,
  updatePositionAction,
} from "../actions";

export interface PositionViewProps {
  readonly initialPositions: readonly PositionItem[];
}

/**
 * 岗位字典管理面板组件 (现代数智工业风)
 * 严格遵循 Position != Role 物理正交解耦原则，岗位用于表达企业行政职务，不直接绑定 CASL 授权
 */
export function PositionView({ initialPositions }: PositionViewProps) {
  const [positions, setPositions] =
    useState<readonly PositionItem[]>(initialPositions);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [modalState, setModalState] = useState<{
    mode: "create" | "edit";
    targetPosition?: PositionItem;
  } | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    description: string;
    sort: number;
  }>({
    name: "",
    code: "",
    description: "",
    sort: 0,
  });

  const [isPending, startTransition] = useTransition();

  const refreshPositions = async () => {
    const res = await listPositionsAction();
    if (res.success && res.data) {
      setPositions(res.data);
    }
  };

  const openCreateModal = () => {
    setModalState({ mode: "create" });
    setFormData({
      name: "",
      code: "",
      description: "",
      sort: 0,
    });
    setFeedback(null);
  };

  const openEditModal = (pos: PositionItem) => {
    setModalState({ mode: "edit", targetPosition: pos });
    setFormData({
      name: pos.name,
      code: pos.code,
      description: pos.description || "",
      sort: pos.sort,
    });
    setFeedback(null);
  };

  const closeModal = () => {
    setModalState(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFeedback({ type: "error", message: "岗位名称不能为空" });
      return;
    }
    if (!formData.code.trim()) {
      setFeedback({ type: "error", message: "岗位编码不能为空" });
      return;
    }

    startTransition(async () => {
      if (modalState?.mode === "create") {
        const payload: CreatePositionInput = {
          name: formData.name.trim(),
          code: formData.code.trim(),
          description: formData.description.trim() || null,
          sort: Number(formData.sort) || 0,
        };
        const res = await createPositionAction(payload);
        if (res.success) {
          setFeedback({ type: "success", message: "岗位字典已成功创建" });
          closeModal();
          await refreshPositions();
        } else {
          setFeedback({
            type: "error",
            message: res.error || "创建岗位失败",
          });
        }
      } else if (modalState?.mode === "edit" && modalState.targetPosition) {
        const payload: UpdatePositionInput = {
          name: formData.name.trim(),
          code: formData.code.trim(),
          description: formData.description.trim() || null,
          sort: Number(formData.sort) || 0,
        };
        const res = await updatePositionAction(
          modalState.targetPosition.id,
          payload,
        );
        if (res.success) {
          setFeedback({ type: "success", message: "岗位字典已成功更新" });
          closeModal();
          await refreshPositions();
        } else {
          setFeedback({
            type: "error",
            message: res.error || "更新岗位失败",
          });
        }
      }
    });
  };

  const handleToggleStatus = (pos: PositionItem) => {
    startTransition(async () => {
      const res = await togglePositionStatusAction(pos.id);
      if (res.success) {
        const statusText =
          res.data?.status === "ACTIVE" ? "已启用" : "已停用";
        setFeedback({
          type: "success",
          message: `岗位 [${pos.name}] ${statusText}`,
        });
        await refreshPositions();
      } else {
        setFeedback({
          type: "error",
          message: res.error || "切换岗位状态失败",
        });
      }
    });
  };

  const handleDelete = (pos: PositionItem) => {
    if (!confirm(`确定要删除岗位 [${pos.name}] 吗？`)) {
      return;
    }

    startTransition(async () => {
      const res = await deletePositionAction(pos.id);
      if (res.success) {
        setFeedback({ type: "success", message: "岗位已成功删除" });
        await refreshPositions();
      } else {
        setFeedback({
          type: "error",
          message: res.error || "删除岗位失败",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 顶部标题与新建按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            企业岗位字典
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            维护企业职位与职务名称。严格遵守 Position != Role 解耦原则，岗位用于人事表达，系统权限由独立角色配置。
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
        >
          <Plus className="mr-1.5 size-4" />
          新增岗位
        </Button>
      </div>

      {/* 反馈提示 */}
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

      {/* 岗位表格主卡片 */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
            <Briefcase className="size-5 text-blue-600" />
            <span>岗位列表</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            展示企业当前已定义的所有岗位及在职员工人数。有关联员工时执行 Fail-Closed 删除保护。
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {positions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              暂未维护任何岗位字典，请点击右上角新增岗位
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-800/40">
                    <th className="px-5 py-3">岗位名称</th>
                    <th className="px-4 py-3">岗位编码</th>
                    <th className="px-4 py-3">职责说明</th>
                    <th className="px-4 py-3 text-center">排序号</th>
                    <th className="px-4 py-3 text-center">在职员工</th>
                    <th className="px-4 py-3 text-center">状态</th>
                    <th className="px-5 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {positions.map((pos) => {
                    const isActive = pos.status === "ACTIVE";
                    return (
                      <tr
                        key={pos.id}
                        className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                          {pos.name}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                          <Badge
                            variant="outline"
                            className="text-[11px] font-mono"
                          >
                            {pos.code}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                          {pos.description || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-slate-600">
                          {pos.sort}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                            <Users className="size-3.5 text-slate-400" />
                            <span>{pos.employeeCount}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                                : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                            }`}
                          >
                            {isActive ? "已启用" : "已停用"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-blue-600 hover:bg-blue-50"
                            onClick={() => openEditModal(pos)}
                          >
                            <Edit2 className="mr-1 size-3.5" />
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 text-xs ${
                              isActive
                                ? "text-amber-600 hover:bg-amber-50"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                            onClick={() => handleToggleStatus(pos)}
                          >
                            <Power className="mr-1 size-3.5" />
                            {isActive ? "停用" : "启用"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDelete(pos)}
                          >
                            <Trash2 className="mr-1 size-3.5" />
                            删除
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 弹窗模态框 */}
      {modalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {modalState.mode === "create" ? "新建岗位字典" : "编辑岗位信息"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              维护行政职务字典，编码用于接口与系统内部唯一标识。
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  岗位名称 <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="例如: 采购经理、技术主管"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  岗位编码 <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="例如: pos_procurement_mgr"
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  职责说明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="描述该岗位的核心工作范畴与职责要求"
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-700 shadow-xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

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
