"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../shadcn/dialog";
import { Button } from "../../shadcn/button";
import { cn } from "../../../lib/utils";

export interface DataTableDetailDrawerProps<TRecord = any> {
  record: TRecord | null;
  onClose: () => void;
  title?: ReactNode | ((record: TRecord) => ReactNode);
  description?: ReactNode | ((record: TRecord) => ReactNode);
  badge?: string;
  children: ReactNode | ((record: TRecord) => ReactNode);
  footer?: ReactNode | ((record: TRecord, close: () => void) => ReactNode);
  inline?: boolean;
  className?: string;
}

/**
 * 列表通用 CRUD - 详情查看居中弹窗
 * 与 FormModal 同构：品牌徽标页头 + 内容区 + 左提示/右按钮组底栏。
 */
export function DataTableDetailDrawer<TRecord = any>({
  record,
  onClose,
  title = "数据详情查看",
  description,
  badge = "CR",
  children,
  footer,
  inline = false,
  className,
}: DataTableDetailDrawerProps<TRecord>) {
  if (!record) {
    return null;
  }

  const renderedTitle = typeof title === "function" ? title(record) : title;
  const renderedDescription =
    typeof description === "function" ? description(record) : description;
  const renderedContent =
    typeof children === "function" ? children(record) : children;
  const renderedFooter =
    typeof footer === "function" ? footer(record, onClose) : footer;

  const brandHeader = (
    <div className="flex items-start gap-3 pr-8">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-bold tracking-wide text-primary-foreground shadow-xs">
        {badge}
      </span>
      <div className="min-w-0 flex-1 space-y-1 pt-0.5">
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

  const defaultFooter = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClose}
      className="min-w-[72px] text-sm"
    >
      关闭
    </Button>
  );

  if (inline) {
    return (
      <div
        data-slot="detail-modal-inline"
        className={cn(
          "rounded-xl border border-border/70 bg-card p-5 shadow-xs",
          className,
        )}
      >
        <div className="space-y-4">
          <div className="border-b border-border/60 pb-4">{brandHeader}</div>
          <div>{renderedContent}</div>
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-4">
            {renderedFooter ?? defaultFooter}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "max-h-[90vh] w-[min(860px,calc(100vw-2rem))] gap-0 overflow-hidden rounded-2xl border border-border/80 bg-card p-0 shadow-xl sm:max-w-none",
          className,
        )}
      >
        <div className="flex max-h-[90vh] flex-col bg-card">
          <div className="flex-1 space-y-4 overflow-y-auto bg-card px-6 pb-5 pt-5">
            {brandHeader}
            <DialogHeader className="sr-only">
              <DialogTitle>{renderedTitle}</DialogTitle>
              {renderedDescription ? (
                <DialogDescription>{renderedDescription}</DialogDescription>
              ) : null}
            </DialogHeader>
            <div>{renderedContent}</div>
          </div>
          <div className="shrink-0 border-t border-border/80 bg-card px-6 py-4">
            <div className="flex flex-wrap items-center justify-end gap-2">
              {renderedFooter ?? defaultFooter}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
