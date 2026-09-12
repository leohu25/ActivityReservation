"use client";

import * as React from "react";
import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../shadcn/sheet";
import { cn } from "../../../lib/utils";

export interface FormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

/**
 * 遵循 shadcn Sheet 标准的侧滑抽屉（详情/编辑侧边栏）
 */
export function FormDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  width = "md",
  className,
}: FormDrawerProps) {
  const widthClass =
    width === "sm"
      ? "sm:max-w-md"
      : width === "lg"
        ? "sm:max-w-2xl"
        : width === "xl"
          ? "sm:max-w-4xl"
          : "sm:max-w-xl";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(
          "flex h-full flex-col gap-4 overflow-hidden p-6",
          widthClass,
          className,
        )}
      >
        <SheetHeader className="gap-1 text-left border-b border-border/60 pb-3">
          <SheetTitle className="text-base font-semibold">{title}</SheetTitle>
          {description ? (
            <SheetDescription className="text-xs">
              {description}
            </SheetDescription>
          ) : null}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pr-1">{children}</div>

        {footer ? (
          <div className="border-t border-border/60 pt-3">{footer}</div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
