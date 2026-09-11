"use client";

import React, { type ReactNode } from "react";
import { cn } from "../../../lib/utils";

export interface DataTableFormFieldGridProps {
  /** 表单字段网格，通常配合 DataTableInputGroup 使用 */
  children: ReactNode;
  /** 列数，默认 4（对齐工业风编辑弹窗） */
  columns?: 2 | 3 | 4;
  className?: string;
}

/** 编辑/新建弹窗字段网格：等宽多列、紧凑间距 */
export function DataTableFormFieldGrid({
  children,
  columns = 4,
  className,
}: DataTableFormFieldGridProps) {
  return (
    <div
      className={cn(
        "grid gap-x-4 gap-y-3",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "sm:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface DataTableFormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/** 编辑弹窗分组区块：在纯白弹窗上使用浅底卡片拉出层次 */
export function DataTableFormSection({
  title,
  description,
  children,
  className,
}: DataTableFormSectionProps) {
  return (
    <section
      className={cn(
        "space-y-3 rounded-xl border border-border/70 bg-background/60 p-4",
        className,
      )}
    >
      {title || description ? (
        <div className="space-y-0.5">
          {title ? (
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
          ) : null}
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export interface DataTableFormBannerProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  className?: string;
}

/** 编辑弹窗顶部信息横幅 */
export function DataTableFormBanner({
  icon,
  title,
  description,
  className,
}: DataTableFormBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/[0.04] px-4 py-3",
        className,
      )}
    >
      {icon ? (
        <span className="mt-0.5 shrink-0 text-primary">{icon}</span>
      ) : null}
      <div className="min-w-0 space-y-0.5">
        <div className="text-sm font-medium text-foreground">{title}</div>
        {description ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
