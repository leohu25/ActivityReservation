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
  ConfirmDialog,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@base/ui";
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
import type { PositionItem } from "../types";
import {
  createPositionAction,
  deletePositionAction,
  listPositionsAction,
  togglePositionStatusAction,
  updatePositionAction,
} from "../actions";
import { PositionFormModal } from "./PositionFormModal";

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

  const [isPending, startTransition] = useTransition();

  const refreshPositions = async () => {
    const res = await listPositionsAction();
    if (res.success && res.data) {
      setPositions(res.data);
    }
  };

  const openCreateModal = () => {
    setModalState({ mode: "create" });
    setFeedback(null);
  };

  const openEditModal = (pos: PositionItem) => {
    setModalState({ mode: "edit", targetPosition: pos });
    setFeedback(null);
  };

  const closeModal = () => {
    setModalState(null);
  };

  const handleToggleStatus = (pos: PositionItem) => {
    startTransition(async () => {
      const res = await togglePositionStatusAction(pos.id);
      if (res.success) {
        const statusText = res.data?.status === "ACTIVE" ? "已启用" : "已停用";
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

  const [deleteTarget, setDeleteTarget] = useState<PositionItem | null>(null);

  const confirmDelete = (pos: PositionItem) => {
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
      setDeleteTarget(null);
    });
  };

  return (
    <PageShell
      title="企业岗位字典"
      description="维护企业职位与职务名称。严格遵守 Position != Role 解耦原则，岗位用于人事表达，系统权限由独立角色配置。"
      icon={<Briefcase className="size-5 text-blue-600" />}
      actions={
        <Button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
        >
          <Plus className="mr-1.5 size-4" />
          新增岗位
        </Button>
      }
      feedback={feedback}
      onDismissFeedback={() => setFeedback(null)}
    >
      {/* 岗位表格主卡片 */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
            <Briefcase className="size-5 text-blue-600" />
            <span>岗位列表</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            展示企业当前已定义的所有岗位及在职员工人数。有关联员工时执行
            Fail-Closed 删除保护。
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {positions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              暂未维护任何岗位字典，请点击右上角新增岗位
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full text-xs">
                <TableHeader className="bg-muted/50 font-medium">
                  <TableRow className="border-b border-border">
                    <TableHead className="px-5 py-3 text-xs font-semibold text-muted-foreground">岗位名称</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">岗位编码</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">职责说明</TableHead>
                    <TableHead className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">排序号</TableHead>
                    <TableHead className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">在职员工</TableHead>
                    <TableHead className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">状态</TableHead>
                    <TableHead className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/60">
                  {positions.map((pos) => {
                    const isActive = pos.status === "ACTIVE";
                    return (
                      <TableRow
                        key={pos.id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="px-5 py-3.5 font-bold text-foreground">
                          {pos.name}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 font-mono text-muted-foreground">
                          <Badge
                            variant="outline"
                            className="text-[11px] font-mono"
                          >
                            {pos.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-muted-foreground max-w-xs truncate">
                          {pos.description || "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-center font-mono text-muted-foreground">
                          {pos.sort}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-center">
                          <div className="inline-flex items-center gap-1 text-foreground font-semibold">
                            <Users className="size-3.5 text-muted-foreground" />
                            <span>{pos.employeeCount}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-center">
                          <Badge
                            variant={isActive ? "success" : "secondary"}
                            size="sm"
                          >
                            {isActive ? "已启用" : "已停用"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-3.5 text-right space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-primary"
                            onClick={() => openEditModal(pos)}
                          >
                            <Edit2 className="mr-1 size-3.5" />
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => handleToggleStatus(pos)}
                          >
                            <Power className="mr-1 size-3.5" />
                            {isActive ? "停用" : "启用"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(pos)}
                          >
                            <Trash2 className="mr-1 size-3.5" />
                            删除
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {modalState && (
        <PositionFormModal
          mode={modalState.mode}
          record={modalState.targetPosition}
          onClose={() => setModalState(null)}
          onSaved={async () => {
            setModalState(null);
            await refreshPositions();
          }}
        />
      )}

      {/* 删除二次确认弹窗 */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`确定要删除岗位 [${deleteTarget?.name || ""}] 吗？`}
        description="删除后该岗位记录将被移除。如果该岗位下存在在职员工，系统将自动拦截并提示错误。"
        confirmText="确认删除"
        variant="destructive"
        onConfirm={async () => {
          if (deleteTarget) {
            confirmDelete(deleteTarget);
          }
        }}
      />
    </PageShell>
  );
}
