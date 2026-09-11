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
 * 一体化前缀标签输入组
 * 视觉形态：`[标签 | 输入控件]`，白卡场景下用实边框 + 微阴影拉出层次。
 */
export function DataTableInputGroup({
  label,
  children,
  className,
}: DataTableInputGroupProps) {
  return (
    <div
      className={cn(
        "flex h-10 w-full min-w-0 items-stretch overflow-hidden rounded-lg",
        "border border-border bg-card text-sm shadow-xs",
        "transition-shadow focus-within:border-primary/50 focus-within:shadow-md focus-within:shadow-primary/5",
        className,
      )}
    >
      <span className="flex shrink-0 select-none items-center border-r border-border bg-muted/60 px-3 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 items-center px-2.5 [&_input]:h-full [&_input]:min-w-0 [&_input]:flex-1 [&_input]:rounded-none [&_input]:border-0 [&_input]:bg-transparent [&_input]:px-0 [&_input]:shadow-none [&_input]:text-sm [&_input]:placeholder:text-muted-foreground/70 [&_input]:focus-visible:ring-0 [&_input]:focus-visible:outline-none [&_button]:h-full [&_button]:rounded-none [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-0 [&_button]:shadow-none [&_button]:text-sm [&_button]:justify-between [&_button]:w-full [&_button]:font-normal [&_[role=combobox]]:h-full [&_[role=combobox]]:w-full [&_[role=combobox]]:rounded-none [&_[role=combobox]]:border-0 [&_[role=combobox]]:bg-transparent [&_[role=combobox]]:px-0 [&_[role=combobox]]:shadow-none [&_[role=combobox]]:text-sm [&_[role=combobox]]:font-normal [&_span[data-slot=select-value]]:truncate [&_svg]:size-3.5 [&_svg]:opacity-60">
        {children}
      </div>
    </div>
  );
}
