"use client";

import React, { useState, type ReactNode } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../shadcn/dialog";
import { Button } from "../../shadcn/button";
import { cn } from "../../../lib/utils";

export interface DataTableFormModalProps<TRecord = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: TRecord | null;
  title: ReactNode | ((record: TRecord | null | undefined) => ReactNode);
  description?: ReactNode | ((record: TRecord | null | undefined) => ReactNode);
  /** 品牌徽标缩写，默认 "CR" */
  badge?: string;
  /** 信息横幅 / 额外头部插槽（放在标题区与字段区之间） */
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
  /** 底部左侧审计提示，默认 null（不展示无意义冗余文案）；可显式传入自定义文案 */
  auditHint?: string | null;
  /**
   * 额外底部操作按钮（排在 cancel/submit 左侧，同组右对齐）
   * 例：另存为新产品 / 保存并新增
   */
  extraActions?: readonly {
    key: string;
    label: string;
    variant?: "default" | "outline" | "ghost" | "destructive";
    onClick: (record: TRecord | null | undefined) => void | Promise<void>;
  }[];
  /** 完全自定义底栏按钮（覆盖 cancel/submit/extraActions） */
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
 * 列表通用 CRUD - 新建/编辑居中弹窗
 * 对齐工业风高保真：品牌徽标页头 + 字段网格 + 左审计/右按钮组底栏。
 */
export function DataTableFormModal<TRecord = any>({
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
}: DataTableFormModalProps<TRecord>) {
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

  const auditLine =
    auditHint != null && auditHint !== "" ? (
      <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 shrink-0 text-emerald-600" />
        <span className="truncate">{auditHint}</span>
      </div>
    ) : (
      <span aria-hidden className="min-w-0" />
    );

  const defaultButtons = (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={close}
        disabled={submitting}
        className="min-w-[72px] text-sm"
      >
        {cancelText}
      </Button>
      {onSubmit ? (
        <Button
          type="submit"
          size="sm"
          disabled={submitting}
          className="min-w-[72px] text-sm font-medium"
        >
          {submitting ? (
            <Loader2 className="mr-1 size-3.5 animate-spin" />
          ) : null}
          {submitText}
        </Button>
      ) : null}
    </>
  );

  const extraButtons = extraActions.map((item) => (
    <Button
      key={item.key}
      type="button"
      variant={item.variant ?? "outline"}
      size="sm"
      disabled={submitting}
      className="min-w-[72px] text-sm"
      onClick={async () => {
        try {
          setSubmitting(true);
          await item.onClick(record);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {item.label}
    </Button>
  ));

  const footerButtons = footer ? (
    typeof footer === "function" ? (
      footer({ record, close, loading: submitting })
    ) : (
      footer
    )
  ) : (
    <>
      {extraButtons}
      {defaultButtons}
    </>
  );

  const body = (
    <>
      {brandHeader}
      {headerExtra ? <div className="pt-1">{headerExtra}</div> : null}
      <div className="py-1">
        {typeof children === "function"
          ? children({ record, close, loading: submitting })
          : children}
      </div>
    </>
  );

  const actionBar = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {auditLine}
      <div className="flex shrink-0 items-center gap-2">{footerButtons}</div>
    </div>
  );

  if (inline) {
    return (
      <div
        data-slot="form-modal-inline"
        className={cn(
          "rounded-xl border border-border/70 bg-card p-5 shadow-xs",
          className,
        )}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="border-b border-border/60 pb-4">{body}</div>
          {actionBar}
        </form>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[90vh] w-[min(960px,calc(100vw-2rem))] gap-0 overflow-hidden rounded-2xl border border-border/80 bg-card p-0 shadow-xl sm:max-w-none",
          className,
        )}
      >
        <form
          onSubmit={handleSubmit}
          className="flex max-h-[90vh] flex-col bg-card"
        >
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-card px-6 pb-5 pt-5">
            {brandHeader}
            <DialogHeader className="sr-only">
              <DialogTitle>{renderedTitle}</DialogTitle>
              {renderedDescription ? (
                <DialogDescription>{renderedDescription}</DialogDescription>
              ) : null}
            </DialogHeader>
            {headerExtra ? <div className="pt-1">{headerExtra}</div> : null}
            <div className="py-0.5">
              {typeof children === "function"
                ? children({ record, close, loading: submitting })
                : children}
            </div>
          </div>
          <div className="shrink-0 border-t border-border/80 bg-card px-6 py-4">
            {actionBar}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
