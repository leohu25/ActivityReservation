"use client";

import React, { useState, useTransition } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
} from "@base/ui";
import { CheckCircle2, XCircle, X, Loader2, AlertTriangle } from "lucide-react";
import { auditOrderAction } from "../actions";
import type {
  ProcurementFieldVisibility,
  ProcurementOrderItem,
} from "../types";

export interface AuditOrderModalProps {
  readonly order: ProcurementOrderItem;
  readonly isOpen: boolean;
  readonly fieldVisibility: ProcurementFieldVisibility;
  readonly onClose: () => void;
  readonly onAudited?: () => void;
}

export function AuditOrderModal({
  order,
  isOpen,
  fieldVisibility,
  onClose,
  onAudited,
}: AuditOrderModalProps) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleAudit = (action: "APPROVE" | "REJECT") => {
    setError(null);
    startTransition(async () => {
      const res = await auditOrderAction({
        orderId: order.id,
        action,
        auditComment: comment.trim(),
      });

      if (!res.success) {
        setError(res.error ?? "审核处理失败");
        return;
      }

      onClose();
      onAudited?.();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              采购单审核审批
            </CardTitle>
            {fieldVisibility.orderNo ? (
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                单号:{" "}
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {order.orderNo}
                </span>
              </CardDescription>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isPending}
            className="size-8 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="size-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </div>
          )}

          {order.isSelfAuditBlocked && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-800 flex items-start gap-2 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
              <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">禁止自审安全警示</p>
                <p className="text-[11px] mt-0.5 text-amber-700 dark:text-amber-400">
                  您是当前采购单的创建人，依据业务内控红线，禁止自我审批自己创建的采购单据。
                </p>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs space-y-1.5 dark:border-slate-800 dark:bg-slate-800/40">
            {fieldVisibility.supplierName ? (
              <div className="flex justify-between">
                <span className="text-slate-500">物料供应商:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {order.supplierName}
                </span>
              </div>
            ) : null}
            {fieldVisibility.quantity ? (
              <div className="flex justify-between">
                <span className="text-slate-500">采购数量:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {order.quantity} 件
                </span>
              </div>
            ) : null}
            {fieldVisibility.costPrice ? (
              <div className="flex justify-between">
                <span className="text-slate-500">采购单价:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {order.costPrice}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-slate-500">提单部门:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {order.departmentName || "未指定"}
              </span>
            </div>
          </div>

          {fieldVisibility.auditComment ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                审核批注意见 (可选)
              </label>
              <Input
                placeholder="如：经核算价格合理，准予执行采购"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isPending || order.isSelfAuditBlocked}
              />
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                isPending ||
                order.isSelfAuditBlocked ||
                !order.canAuditThisOrder
              }
              onClick={() => handleAudit("REJECT")}
              className="border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/40"
            >
              {isPending ? (
                <Loader2 className="size-3.5 mr-1 animate-spin" />
              ) : (
                <XCircle className="size-3.5 mr-1" />
              )}
              <span>审核驳回</span>
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={
                isPending ||
                order.isSelfAuditBlocked ||
                !order.canAuditThisOrder
              }
              onClick={() => handleAudit("APPROVE")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/25"
            >
              {isPending ? (
                <Loader2 className="size-3.5 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5 mr-1" />
              )}
              <span>准予通过</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
