"use client";

import React, { type ReactNode } from "react";
import { Search, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Button } from "../../primitives/button";
import { cn } from "../../../lib/utils";

export interface DataTableFilterBarProps {
  /** 常用筛选控件插槽（建议使用 DataTableInputGroup 包裹） */
  children?: ReactNode;
  /** 点击「查询」回调 */
  onSearch?: () => void;
  /** 点击「重置」回调 */
  onReset?: () => void;
  /** 点击「高级筛选」回调；提供后自动渲染触发按钮 */
  onAdvancedFilter?: () => void;
  /** 高级筛选当前激活条件数（展示角标） */
  advancedActiveCount?: number;
  /** 是否显示查询按钮，默认 true */
  hasSearchBtn?: boolean;
  /** 是否显示重置按钮，默认 true */
  hasResetBtn?: boolean;
  /** 查询按钮文案 */
  searchText?: string;
  /** 重置按钮文案 */
  resetText?: string;
  /** 高级筛选按钮文案 */
  advancedText?: string;
  /** 右侧额外插槽（如快速关键字搜索） */
  extra?: ReactNode;
  className?: string;
}

/**
 * 一体式组合筛选栏
 * 左侧筛选插槽 + 主色「查询」+ 描边「重置」+ 右侧「高级筛选」触发器。
 */
export function DataTableFilterBar({
  children,
  onSearch,
  onReset,
  onAdvancedFilter,
  advancedActiveCount = 0,
  hasSearchBtn = true,
  hasResetBtn = true,
  searchText = "查询",
  resetText = "重置",
  advancedText = "高级筛选",
  extra,
  className,
}: DataTableFilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-b border-border/60 pb-3",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {children}
        {hasSearchBtn && onSearch ? (
          <Button
            size="sm"
            className="h-10 gap-1.5 px-4 text-sm shadow-xs"
            onClick={onSearch}
          >
            <Search className="size-3.5" />
            {searchText}
          </Button>
        ) : null}
        {hasResetBtn && onReset ? (
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-1.5 border-border bg-card px-4 text-sm shadow-xs hover:bg-muted/40"
            onClick={onReset}
          >
            <RotateCcw className="size-3.5" />
            {resetText}
          </Button>
        ) : null}
        {extra}
      </div>
      {onAdvancedFilter ? (
        <Button
          variant="outline"
          size="sm"
          className="h-10 gap-1.5 border-dashed border-border bg-card px-3 text-sm font-normal shadow-xs hover:bg-muted/40"
          onClick={onAdvancedFilter}
        >
          <SlidersHorizontal className="size-3.5 text-muted-foreground" />
          {advancedText}
          {advancedActiveCount > 0 ? (
            <span className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {advancedActiveCount}
            </span>
          ) : null}
        </Button>
      ) : null}
    </div>
  );
}
