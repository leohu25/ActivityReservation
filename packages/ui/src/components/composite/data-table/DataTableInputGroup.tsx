"use client";

import React, { type ReactNode } from "react";
import {
  InputGroup,
  InputGroupAddon,
} from "../../shadcn/input-group";
import { cn } from "../../../lib/utils";

export interface DataTableInputGroupProps {
  /** 前缀标签文案 */
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * 前缀标签输入组：基于官方 shadcn InputGroup + InputGroupAddon。
 * 禁止再用子选择器强行抹平 Input/Select 样式。
 */
export function DataTableInputGroup({
  label,
  children,
  className,
}: DataTableInputGroupProps) {
  return (
    <InputGroup
      className={cn(
        "h-10 w-full min-w-0 overflow-hidden rounded-lg bg-card",
        "[&_[data-slot=select-trigger]]:h-full [&_[data-slot=select-trigger]]:min-w-0 [&_[data-slot=select-trigger]]:flex-1 [&_[data-slot=select-trigger]]:rounded-none [&_[data-slot=select-trigger]]:border-0 [&_[data-slot=select-trigger]]:bg-transparent [&_[data-slot=select-trigger]]:shadow-none [&_[data-slot=select-trigger]]:focus-visible:ring-0",
        "[&_[role=combobox]]:h-full [&_[role=combobox]]:w-full",
        className,
      )}
    >
      <InputGroupAddon
        align="inline-start"
        className="border-r border-border bg-muted/60 px-3 text-xs font-medium"
      >
        {label}
      </InputGroupAddon>
      {children}
    </InputGroup>
  );
}
