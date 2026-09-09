"use client";

import React, { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../primitives/dialog";
import { Button } from "../../primitives/button";
import { Loader2 } from "lucide-react";
import { cn } from "../../../lib/utils";

export interface DataTableFormModalProps<TRecord = any> {
  /** 弹窗是否开启 */
  open: boolean;
  /** 开关状态变更回调 */
  onOpenChange: (open: boolean) => void;
  /** 当前编辑或新建的初始数据记录 */
  record?: TRecord | null;
  /** 弹窗主标题，支持字符串或根据数据动态渲染 */
  title: ReactNode | ((record: TRecord | null | undefined) => ReactNode);
  /** 弹窗说明文字 */
  description?: ReactNode | ((record: TRecord | null | undefined) => ReactNode);
  /** 表单主体内容插槽 */
  children:
    | ReactNode
    | ((context: {
        record: TRecord | null | undefined;
        close: () => void;
        loading: boolean;
      }) => ReactNode);
  /** 提交表单动作回调，支持返回 Promise 执行异步校验与保存 */
  onSubmit?: (record: TRecord | null | undefined) => Promise<void> | void;
  /** 确认按钮文字，默认 "保存" */
  submitText?: string;
  /** 取消按钮文字，默认 "取消" */
  cancelText?: string;
  /** 底部操作栏完全自定义插槽（若提供则覆盖默认取消/保存按钮） */
  footer?:
    | ReactNode
    | ((context: {
        record: TRecord | null | undefined;
        close: () => void;
        loading: boolean;
      }) => ReactNode);
  /** 是否以内联/嵌入模式渲染（用于非弹层嵌入面板或 SSR 渲染断言），默认 false */
  inline?: boolean;
  /** 自定义弹窗最大宽度 */
  className?: string;
}

/**
 * 列表通用 CRUD - 新建/编辑表单弹窗插槽 (DataTableFormModal)
 * 开箱即用，支持异步提交状态与全自定义表单插槽
 */
export function DataTableFormModal<TRecord = any>({
  open,
  onOpenChange,
  record,
  title,
  description,
  children,
  onSubmit,
  submitText = "保存",
  cancelText = "取消",
  footer,
  inline = false,
  className,
}: DataTableFormModalProps<TRecord>) {
  const [submitting, setSubmitting] = useState(false);

  const close = () => onOpenChange(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
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

  const renderFormContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {inline ? (
        <div className="pb-3 border-b border-border/60">
          <div className="text-base font-semibold text-foreground">
            {renderedTitle}
          </div>
          {renderedDescription && (
            <p className="text-xs text-muted-foreground mt-1">
              {renderedDescription}
            </p>
          )}
        </div>
      ) : (
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">
            {renderedTitle}
          </DialogTitle>
          {renderedDescription && (
            <DialogDescription className="text-xs text-muted-foreground">
              {renderedDescription}
            </DialogDescription>
          )}
        </DialogHeader>
      )}

      <div className="py-2">
        {typeof children === "function"
          ? children({ record, close, loading: submitting })
          : children}
      </div>

      {inline ? (
        <div className="mt-4 pt-3 border-t border-border/60 flex justify-end gap-2">
          {footer ? (
            typeof footer === "function" ? (
              footer({ record, close, loading: submitting })
            ) : (
              footer
            )
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={close}
                disabled={submitting}
                className="text-xs"
              >
                {cancelText}
              </Button>
              {onSubmit && (
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="text-xs font-semibold"
                >
                  {submitting && (
                    <Loader2 className="size-3.5 animate-spin mr-1" />
                  )}
                  {submitText}
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        <DialogFooter className="mt-4 flex sm:justify-end gap-2">
          {footer ? (
            typeof footer === "function" ? (
              footer({ record, close, loading: submitting })
            ) : (
              footer
            )
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={close}
                disabled={submitting}
                className="text-xs"
              >
                {cancelText}
              </Button>
              {onSubmit && (
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="text-xs font-semibold"
                >
                  {submitting && (
                    <Loader2 className="size-3.5 animate-spin mr-1" />
                  )}
                  {submitText}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      )}
    </form>
  );

  if (inline) {
    return (
      <div
        data-slot="form-modal-inline"
        className={cn(
          "rounded-lg border border-border/70 bg-card p-4 shadow-xs",
          className,
        )}
      >
        {renderFormContent}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("sm:max-w-xl max-h-[90vh] overflow-y-auto", className)}
      >
        {renderFormContent}
      </DialogContent>
    </Dialog>
  );
}
