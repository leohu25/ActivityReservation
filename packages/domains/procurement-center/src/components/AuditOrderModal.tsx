"use client";

import React, { useState, useTransition } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@base/ui";
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { auditOrderAction } from "../actions";
import type {
  ProcurementOrderFieldVisibility,
  ProcurementOrderItem,
} from "../types";

export interface AuditOrderModalProps {
  readonly order: ProcurementOrderItem;
  readonly isOpen: boolean;
  readonly fieldVisibility: ProcurementOrderFieldVisibility;
  readonly onClose: () => void;
  readonly onAudited?: () => void;
  readonly inline?: boolean;
}

export function AuditOrderModal({
  order,
  isOpen,
  fieldVisibility,
  onClose,
  onAudited,
  inline = false,
}: AuditOrderModalProps) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen && !inline) return null;

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

  const titleContent = (
    <div className="flex flex-col gap-1.5 text-left">
      <div className="text-base font-semibold leading-none tracking-tight text-foreground">
        采购单审核审批
      </div>
      {fieldVisibility.orderNo ? (
        <div className="text-xs text-muted-foreground">
          单号:{" "}
          <span className="font-mono font-bold text-foreground">
            {order.orderNo}
          </span>
        </div>
      ) : null}
    </div>
  );

  const body = (
    <div className="space-y-4 py-2">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      {order.isSelfAuditBlocked && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">禁止自审安全警示</p>
            <p className="text-[11px] mt-0.5 text-amber-700 dark:text-amber-400">
              您是当前采购单的创建人，依据业务内控红线，禁止自我审批自己创建的采购单据。
            </p>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs space-y-1.5">
        {fieldVisibility.supplierName ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">物料供应商:</span>
            <span className="font-medium text-foreground">
              {order.supplierName}
            </span>
          </div>
        ) : null}
        {fieldVisibility.quantity ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">采购数量:</span>
            <span className="font-medium text-foreground">
              {order.quantity} 件
            </span>
          </div>
        ) : null}
        {fieldVisibility.costPrice ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">采购单价:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {order.costPrice}
            </span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span className="text-muted-foreground">提单部门:</span>
          <span className="font-medium text-foreground">
            {order.departmentName || "未指定"}
          </span>
        </div>
      </div>

      {fieldVisibility.auditComment ? (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
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
    </div>
  );

  const footer = (
    <DialogFooter className="gap-2 sm:gap-2">
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
          isPending || order.isSelfAuditBlocked || !order.canAuditThisOrder
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
          isPending || order.isSelfAuditBlocked || !order.canAuditThisOrder
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
    </DialogFooter>
  );

  if (inline) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm max-w-md">
        {titleContent}
        {body}
        {footer}
      </div>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isPending) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle asChild>{titleContent}</DialogTitle>
          <DialogDescription className="sr-only">
            采购单审核审批
          </DialogDescription>
        </DialogHeader>
        {body}
        {footer}
      </DialogContent>
    </Dialog>
  );
}
