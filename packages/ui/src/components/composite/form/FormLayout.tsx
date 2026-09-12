"use client";

import React, { type ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "../../../lib/utils";

export interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/** 表单字段逻辑分组，带轻量分割线与标题 */
export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <div className={cn("flex flex-col gap-3 py-2", className)}>
      {title ? (
        <div className="flex flex-col gap-0.5 border-b border-border/50 pb-2">
          <div className="text-xs font-semibold tracking-wide text-foreground uppercase">
            {title}
          </div>
          {description ? (
            <p className="text-[11px] text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

export interface FormBannerProps {
  title: string;
  description?: string;
  className?: string;
}

/** 表单头部强调提示横幅 */
export function FormBanner({ title, description, className }: FormBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-primary",
        className,
      )}
    >
      <Info className="size-4 shrink-0 mt-0.5" />
      <div className="flex flex-col gap-0.5 text-xs">
        <span className="font-semibold">{title}</span>
        {description ? (
          <span className="text-muted-foreground leading-relaxed">
            {description}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export interface FormFieldGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

/** 响应式表单字段网格 */
export function FormFieldGrid({
  children,
  columns = 2,
  className,
}: FormFieldGridProps) {
  const colClass =
    columns === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : columns === 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2";

  return (
    <div className={cn("grid gap-3.5", colClass, className)}>{children}</div>
  );
}
