"use client";

import React, { useMemo } from "react";
import { Columns3 } from "lucide-react";
import { Button } from "../../shadcn/button";
import { Checkbox } from "../../shadcn/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../shadcn/dropdown-menu";
import { useOptionalAbility } from "@base/authorization";
import { useDataTableContext } from "./DataTableContext";
import { cn } from "../../../lib/utils";

export interface DataTableColumnSettingsProps {
  className?: string;
  /** 按钮文案前缀，默认「列设置」 */
  label?: string;
}

/**
 * 动态列显示/隐藏面板
 * - 基于 DropdownMenu + Checkbox
 * - 按钮展示「列设置 X/Y」
 * - lockVisible 列强制锁定不可隐藏
 * - CASL 字段 HIDDEN 列物理剔除（不进面板）
 */
export function DataTableColumnSettings({
  className,
  label = "列设置",
}: DataTableColumnSettingsProps) {
  const {
    columns,
    visibleColumnIds,
    toggleColumnVisibility,
    resetColumnVisibility,
    subject,
  } = useDataTableContext();
  const ability = useOptionalAbility();

  // 字段级 HIDDEN 列不进入面板
  const panelColumns = useMemo(() => {
    return columns.filter((col) => {
      if (!col.field || !ability || !subject) return true;
      return ability.can("read", subject, col.field);
    });
  }, [columns, ability, subject]);

  const visibleCount = useMemo(() => {
    return panelColumns.filter((col) => visibleColumnIds.has(col.id)).length;
  }, [panelColumns, visibleColumnIds]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-1.5 border-border bg-card px-2.5 text-sm font-normal shadow-xs hover:bg-muted/40",
            className,
          )}
        >
          <Columns3 className="size-3.5 text-muted-foreground" />
          <span>
            {label} {visibleCount}/{panelColumns.length}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 p-1.5">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0 text-xs font-medium text-muted-foreground">
            显示列
          </DropdownMenuLabel>
          <button
            type="button"
            onClick={resetColumnVisibility}
            className="text-[11px] text-primary hover:underline"
          >
            重置
          </button>
        </div>
        <DropdownMenuSeparator className="my-1" />
        <div className="max-h-72 overflow-y-auto py-0.5">
          <DropdownMenuGroup>
            {panelColumns.map((col) => {
              const checked = visibleColumnIds.has(col.id);
              const locked = Boolean(col.lockVisible);
              return (
                <label
                  key={col.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-muted/60",
                    locked && "cursor-not-allowed opacity-70",
                  )}
                >
                  <Checkbox
                    checked={checked}
                    disabled={locked}
                    onCheckedChange={() => {
                      if (!locked) toggleColumnVisibility(col.id);
                    }}
                    aria-label={`切换列 ${col.id}`}
                  />
                  <span className="truncate text-foreground">
                    {typeof col.header === "string" ? col.header : col.id}
                  </span>
                  {locked ? (
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      锁定
                    </span>
                  ) : null}
                </label>
              );
            })}
          </DropdownMenuGroup>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
