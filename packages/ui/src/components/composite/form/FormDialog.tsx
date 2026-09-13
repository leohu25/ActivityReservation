"use client";

import React, { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../shadcn/dialog";
import { Button } from "../../shadcn/button";
import { cn } from "../../../lib/utils";

export interface FormDialogProps<TRecord = unknown> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: TRecord | null;
  title: ReactNode | ((record: TRecord | null | undefined) => ReactNode);
  description?: ReactNode | ((record: TRecord | null | undefined) => ReactNode);
  badge?: string;
  headerExtra?: ReactNode;
  children:
    | ReactNode
    | ((context: {
        record: TRecord | null | undefined;
        close: () => void;
        loading: boolean;
      }) => ReactNode);
  onSubmit?: (record: TRecord | null | undefined) => Promise<void> | void;
  submitText?: string;
  cancelText?: string;
  auditHint?: string | null;
  extraActions?: readonly {
    key: string;
    label: string;
    variant?: "default" | "outline" | "ghost" | "destructive";
    onClick: (record: TRecord | null | undefined) => void | Promise<void>;
  }[];
  footer?:
    | ReactNode
    | ((context: {
        record: TRecord | null | undefined;
        close: () => void;
        loading: boolean;
      }) => ReactNode);
  inline?: boolean;
  className?: string;
}

/**
 * 遵循 shadcn Dialog 标准的通用表单模态框
 * 居中排版、优雅徽标页头、自适应内容区与固定底栏操作组
 */
export function FormDialog<TRecord = unknown>({
  open,
  onOpenChange,
  record,
  title,
  description,
  badge = "CR",
  headerExtra,
  children,
  onSubmit,
  submitText = "保存",
  cancelText = "取消",
  auditHint = null,
  extraActions = [],
  footer,
  inline = false,
  className,
}: FormDialogProps<TRecord>) {
  const [submitting, setSubmitting] = useState(false);

  const close = () => onOpenChange(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!onSubmit) {
      close();
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit(record);
      close();
    } finally {
      setSubmitting(false);
    }
  };

  const renderedTitle = typeof title === "function" ? title(record) : title;
  const renderedDescription =
    typeof description === "function" ? description(record) : description;

  const brandHeader = (
    <div className="flex items-start gap-3 pr-8">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-bold tracking-wide text-primary-foreground shadow-xs">
        {badge}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
        <div className="text-base font-semibold tracking-tight text-foreground">
          {renderedTitle}
        </div>
        {renderedDescription ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {renderedDescription}
          </p>
        ) : null}
      </div>
    </div>
  );

  const body =
    typeof children === "function"
      ? children({ record, close, loading: submitting })
      : children;

  const defaultFooter = (
    <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/60">
      <div className="text-xs text-muted-foreground">{auditHint}</div>
      <div className="flex items-center gap-2">
        {extraActions.map((act) => (
          <Button
            key={act.key}
            type="button"
            variant={act.variant || "outline"}
            size="sm"
            onClick={() => act.onClick(record)}
          >
            {act.label}
          </Button>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={close}>
          {cancelText}
        </Button>
        {onSubmit ? (
          <Button
            type="submit"
            size="sm"
            disabled={submitting}
            onClick={() => handleSubmit()}
          >
            {submitting ? "正在保存..." : submitText}
          </Button>
        ) : null}
      </div>
    </div>
  );

  const renderedFooter =
    typeof footer === "function"
      ? footer({ record, close, loading: submitting })
      : (footer ?? defaultFooter);

  if (inline) {
    return (
      <div
        className={cn(
          "flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm",
          className,
        )}
      >
        {brandHeader}
        {headerExtra}
        <div className="flex-1 overflow-y-auto">{body}</div>
        {renderedFooter}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[85vh] w-full max-w-2xl flex-col gap-4 p-6 sm:max-w-2xl",
          className,
        )}
      >
        <DialogHeader className="gap-2 text-left">
          <DialogTitle asChild>{brandHeader}</DialogTitle>
          <DialogDescription className="sr-only">
            {renderedTitle}
          </DialogDescription>
        </DialogHeader>

        {headerExtra}

        {/* 关键修复：内容区添加 px-1 py-1，避免内部 Input 聚焦时的 focus-visible:ring-3 外晕光圈被父级裁剪或截断 */}
        <div className="flex-1 overflow-y-auto px-1 py-1 -mx-1 -my-1">{body}</div>

        {renderedFooter}
      </DialogContent>
    </Dialog>
  );
}
