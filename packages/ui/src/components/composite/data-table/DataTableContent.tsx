"use client";

import React, { type ReactNode, useMemo } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../shadcn/table";
import { Checkbox } from "../../shadcn/checkbox";
import { useOptionalAbility } from "@chenrun/authorization";
import { EmptyState } from "../../feedback/EmptyState";
import { useDataTableContext } from "./DataTableContext";
import { cn } from "../../../lib/utils";

export interface DataTableContentProps<TData = any> {
  /** 是否开启行勾选 (Checkbox) */
  selectable?: boolean;
  /** 是否显示跨页自增序号列 `#` */
  showIndex?: boolean;
  /** 序号列表头文案，默认 `#` */
  indexHeader?: string;
  /** 展开行的渲染插槽 */
  renderExpandedRow?: (record: TData, index: number) => ReactNode;
  /** 自定义空状态 */
  emptyState?: ReactNode;
  className?: string;
}

export function DataTableContent<TData = any>({
  selectable = false,
  showIndex = false,
  indexHeader = "#",
  renderExpandedRow,
  emptyState,
  className,
}: DataTableContentProps<TData>) {
  const {
    pageData,
    columns,
    rowKey,
    isLoading,
    selectedKeys,
    toggleSelectRow,
    toggleSelectAll,
    isAllSelected,
    expandedRowKeys,
    toggleExpandRow,
    visibleColumnIds,
    page = 1,
    pageSize = pageData.length || 10,
    subject,
  } = useDataTableContext<TData>();
  const ability = useOptionalAbility();

  // CASL 字段 HIDDEN + 用户列设置 visibleColumnIds 双重过滤
  const visibleColumns = useMemo(() => {
    return columns.filter((col) => {
      if (!visibleColumnIds.has(col.id)) return false;
      if (!col.field || !ability || !subject) return true;
      return ability.can("read", subject, col.field);
    });
  }, [columns, visibleColumnIds, ability, subject]);

  const totalColSpan =
    visibleColumns.length +
    (selectable ? 1 : 0) +
    (showIndex ? 1 : 0) +
    (renderExpandedRow ? 1 : 0);

  const indexBase = showIndex ? Math.max(0, (page - 1) * pageSize) : 0;

  return (
    <div className={cn("relative", className)}>
      {isLoading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 rounded-md bg-card px-3 py-1.5 shadow-md border border-border text-xs text-muted-foreground font-medium">
            <Loader2 className="size-3.5 animate-spin text-primary" />
            <span>加载中...</span>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <Table>
          <TableHeader className="bg-muted/50 font-medium">
            <TableRow className="hover:bg-transparent border-b border-border">
              {selectable ? (
                <TableHead className="w-[40px] px-3">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="选择全部行"
                  />
                </TableHead>
              ) : null}
              {showIndex ? (
                <TableHead className="w-[52px] px-2 text-center text-xs font-semibold text-muted-foreground">
                  {indexHeader}
                </TableHead>
              ) : null}
              {renderExpandedRow ? (
                <TableHead className="w-[36px] px-2 text-center" />
              ) : null}
              {visibleColumns.map((col) => (
                <TableHead
                  key={col.id}
                  style={{ width: col.width }}
                  className={cn(
                    "text-xs font-semibold text-muted-foreground h-10",
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right",
                    col.className,
                  )}
                >
                  {typeof col.header === "function"
                    ? col.header({ isAllSelected, toggleAll: toggleSelectAll })
                    : col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={totalColSpan}
                  className="h-64 text-center p-0"
                >
                  {emptyState || <EmptyState />}
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((record, index) => {
                const key = rowKey(record);
                const isSelected = selectedKeys.has(key);
                const isExpanded = expandedRowKeys.has(key);
                const rowNumber = indexBase + index + 1;
                const isZebra = (indexBase + index) % 2 === 1;

                return (
                  <React.Fragment key={key}>
                    <TableRow
                      data-state={isSelected ? "selected" : undefined}
                      className={cn(
                        "text-xs border-b border-border/60",
                        "hover:bg-primary/[0.06]",
                        isZebra && !isSelected && "bg-muted/40",
                        isSelected && "bg-primary/[0.08]",
                      )}
                    >
                      {selectable ? (
                        <TableCell className="w-[40px] px-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectRow(key)}
                            aria-label={`选择第 ${rowNumber} 行`}
                          />
                        </TableCell>
                      ) : null}
                      {showIndex ? (
                        <TableCell className="w-[52px] px-2 text-center font-mono text-[11px] tabular-nums text-muted-foreground">
                          {rowNumber}
                        </TableCell>
                      ) : null}
                      {renderExpandedRow ? (
                        <TableCell className="w-[36px] px-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggleExpandRow(key)}
                            className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                            title={isExpanded ? "收起详情" : "展开详情"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="size-3.5" />
                            ) : (
                              <ChevronRight className="size-3.5" />
                            )}
                          </button>
                        </TableCell>
                      ) : null}
                      {visibleColumns.map((col) => (
                        <TableCell
                          key={col.id}
                          style={{ width: col.width }}
                          className={cn(
                            "py-2.5 px-3 text-xs text-foreground border-b-0",
                            col.align === "center" && "text-center",
                            col.align === "right" && "text-right",
                            col.className,
                          )}
                        >
                          {col.cell(record, index)}
                        </TableCell>
                      ))}
                    </TableRow>
                    {renderExpandedRow && isExpanded ? (
                      <TableRow className="bg-muted/20 hover:bg-muted/20 border-b">
                        <TableCell
                          colSpan={totalColSpan}
                          className="p-3 bg-muted/15"
                        >
                          <div className="rounded-md border border-border/60 bg-background/80 p-3 shadow-2xs">
                            {renderExpandedRow(record, index)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
