"use client";

import React, { type ReactNode } from "react";
import { cn } from "../../../lib/utils";

export interface DataTableHeaderProps {
  /** 小标分类徽标，如 BUSINESS WORKSPACE */
  category?: string;
  /** 页面主标题 */
  title: string;
  /** 说明辅文 */
  description?: string;
  /** 右侧操作按钮组插槽 */
  actions?: ReactNode;
  className?: string;
}

/**
 * 一体化工作台标题栏
 * 左侧：分类小标 + 品牌色粗竖条标题 + 描述辅文；右侧：全局操作按钮组。
 */
export function DataTableHeader({
  category,
  title,
  description,
  actions,
  className,
}: DataTableHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-x-4 gap-y-3",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {category ? (
          <div className="text-[10px] font-semibold tracking-[0.14em] text-primary/80 uppercase">
            {category}
          </div>
        ) : null}
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="h-4 w-1 shrink-0 rounded-full bg-primary"
          />
          <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h2>
        </div>
        {description ? (
          <p className="pl-3.5 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
