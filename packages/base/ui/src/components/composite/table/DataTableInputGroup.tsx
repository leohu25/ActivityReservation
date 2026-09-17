"use client";

import React, { type ReactNode } from "react";
import { cn } from "../../../lib/utils";

export interface DataTableInputGroupProps {
  /** 前缀标签文案 */
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * 筛选栏前缀标签输入组
 * 结构：统一的外层容器 border + bg-card，左侧紧凑等高 label (h-full flex items-center shrink-0 whitespace-nowrap bg-muted/60 px-3 text-xs border-r border-border)
 * 右侧为无边框无阴影、完全撑满高度的 Input 或 Select
 */
export function DataTableInputGroup({
  label,
  children,
  className,
}: DataTableInputGroupProps) {
  return (
    <div
      data-slot="data-table-input-group"
      className={cn(
        "relative flex h-8 min-w-fit items-stretch overflow-hidden rounded-lg border border-input bg-card shadow-xs transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring",
        // 右侧如果是 Select，抹平边框、圆角与阴影，保证高度 100% 垂直居中，优化内边距与图标尺寸避免文字挤压
        "[&_[data-slot=select-trigger]]:h-full [&_[data-slot=select-trigger]]:min-w-[5.5rem] [&_[data-slot=select-trigger]]:flex-1 [&_[data-slot=select-trigger]]:rounded-none [&_[data-slot=select-trigger]]:border-0 [&_[data-slot=select-trigger]]:bg-transparent [&_[data-slot=select-trigger]]:shadow-none [&_[data-slot=select-trigger]]:focus:ring-0 [&_[data-slot=select-trigger]]:focus-visible:ring-0 [&_[data-slot=select-trigger]]:text-xs [&_[data-slot=select-trigger]]:px-2.5 [&_[data-slot=select-trigger]]:gap-1.5 [&_[data-slot=select-trigger]_svg]:size-3.5",
        // 右侧如果是普通 Input，抹平边框、圆角与阴影，高度 100%，对齐 text-xs
        "[&_input]:h-full [&_input]:min-w-0 [&_input]:flex-1 [&_input]:rounded-none [&_input]:border-0 [&_input]:bg-transparent [&_input]:shadow-none [&_input]:focus-visible:ring-0 [&_input]:text-xs [&_input]:px-2.5",
        className,
      )}
    >
      <div
        data-slot="input-group-label"
        className="flex h-full shrink-0 items-center justify-center whitespace-nowrap border-r border-border bg-muted/60 px-2.5 text-xs font-medium text-muted-foreground select-none"
      >
        {label}
      </div>
      <div className="flex h-full min-w-0 flex-1 items-center">{children}</div>
    </div>
  );
}
