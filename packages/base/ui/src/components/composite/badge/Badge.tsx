"use client";

import * as React from "react";
import { Badge as ShadcnBadge } from "../../shadcn/badge";
import { cn } from "../../../lib/utils";

export interface BadgeProps extends Omit<
  React.ComponentProps<typeof ShadcnBadge>,
  "variant"
> {
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "ghost"
    | "link"
    | "success"
    | "warning"
    | "process";
}

/**
 * 复合层 Badge：保持 shadcn 官方原子组件 100% 纯净，
 * 在 Level 2 分子层提供对既有业务常用的 size 与 success/warning 扩展。
 */
export function Badge({
  size = "default",
  variant = "default",
  className,
  ...props
}: BadgeProps) {
  let mappedVariant: React.ComponentProps<typeof ShadcnBadge>["variant"] =
    "default";
  let extraClass = "";

  if (variant === "success") {
    mappedVariant = "outline";
    extraClass = "border-primary/30 bg-primary/10 text-primary";
  } else if (variant === "warning") {
    mappedVariant = "outline";
    extraClass =
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400";
  } else if (variant === "process") {
    mappedVariant = "outline";
    extraClass =
      "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400";
  } else {
    mappedVariant = variant;
  }

  const sizeClass =
    size === "sm"
      ? "h-4 px-1.5 py-0 text-[10px]"
      : size === "lg"
        ? "h-6 px-2.5 py-0.5 text-sm"
        : undefined;

  return (
    <ShadcnBadge
      variant={mappedVariant}
      className={cn(sizeClass, extraClass, className)}
      {...props}
    />
  );
}
