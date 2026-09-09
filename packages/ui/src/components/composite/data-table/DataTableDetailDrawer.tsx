"use client";

import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "../../primitives/sheet";
import { Button } from "../../primitives/button";
import { cn } from "../../../lib/utils";

export interface DataTableDetailDrawerProps<TRecord = any> {
  /** 当前选中的记录（非 null/undefined 时自动打开） */
  record: TRecord | null;
  /** 关闭抽屉回调 */
  onClose: () => void;
  /** 抽屉主标题，支持字符串或动态渲染函数 */
  title?: ReactNode | ((record: TRecord) => ReactNode);
  /** 抽屉副标题或业务说明 */
  description?: ReactNode | ((record: TRecord) => ReactNode);
  /** 自定义详情主体内容插槽 */
  children: ReactNode | ((record: TRecord) => ReactNode);
  /** 底部操作栏插槽（如关闭、打印、进入编辑等） */
  footer?: ReactNode | ((record: TRecord, close: () => void) => ReactNode);
  /** 是否以内联/嵌入模式渲染（用于非弹层嵌入面板或 SSR 渲染断言），默认 false */
  inline?: boolean;
  /** 抽屉宽度规格，默认 sm:max-w-lg */
  className?: string;
}

/**
 * 列表通用 CRUD - 详情查看抽屉插槽 (DataTableDetailDrawer)
 * 开箱即用，支持自由传递标题、详情内容与底部操作插槽
 */
export function DataTableDetailDrawer<TRecord = any>({
  record,
  onClose,
  title = "数据详情查看",
  description,
  children,
  footer,
  inline = false,
  className,
}: DataTableDetailDrawerProps<TRecord>) {
  const isOpen = Boolean(record);

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

  const innerContent = (
    <div className="space-y-4">
      <SheetHeader className="pb-3 border-b border-border/60">
        <SheetTitle className="text-base font-semibold text-foreground">
          {renderedTitle}
        </SheetTitle>
        {renderedDescription && (
          <SheetDescription className="text-xs text-muted-foreground">
            {renderedDescription}
          </SheetDescription>
        )}
      </SheetHeader>
      <div className="py-2">{renderedContent}</div>
      <SheetFooter className="pt-3 border-t border-border/60 flex sm:justify-end gap-2">
        {renderedFooter ? (
          renderedFooter
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            关闭
          </Button>
        )}
      </SheetFooter>
    </div>
  );

  if (inline) {
    return (
      <div
        data-slot="detail-drawer-inline"
        className={cn(
          "rounded-lg border border-border/70 bg-card p-4 shadow-xs space-y-4",
          className,
        )}
      >
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
        <div className="py-2">{renderedContent}</div>
        <div className="pt-3 border-t border-border/60 flex justify-end gap-2">
          {renderedFooter ? (
            renderedFooter
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              关闭
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className={cn(
          "sm:max-w-lg flex flex-col justify-between overflow-y-auto",
          className,
        )}
      >
        {innerContent}
      </SheetContent>
    </Sheet>
  );
}
