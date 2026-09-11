"use client";

import React, { type ReactNode } from "react";
import { cn } from "../../../lib/utils";

export interface DataTableDetailFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

/** 详情弹窗字段：标签 + 值，浅底卡片内展示 */
export function DataTableDetailField({
  label,
  children,
  className,
}: DataTableDetailFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

export interface DataTableDetailPanelProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * 详情内容分区面板
 * 在纯白弹窗上使用浅灰底 + 实边框，避免与卡片背景融为一体。
 */
export function DataTableDetailPanel({
  title,
  children,
  className,
}: DataTableDetailPanelProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border/80 bg-background/70 p-4",
        className,
      )}
    >
      {title ? (
        <h3 className="mb-3 text-sm font-medium text-foreground">{title}</h3>
      ) : null}
      {children}
    </section>
  );
}
