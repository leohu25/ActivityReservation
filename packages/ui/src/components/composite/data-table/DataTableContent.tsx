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
} from "../../primitives/table";
import { Checkbox } from "../../primitives/checkbox";
import { EmptyState } from "../../feedback/EmptyState";
import { useDataTableContext } from "./DataTableContext";
import { cn } from "../../../lib/utils";

export interface DataTableContentProps<TData = any> {
  /** 是否开启行勾选 (Checkbox) */
  selectable?: boolean;
  /** 展开行的渲染插槽 */
  renderExpandedRow?: (record: TData, index: number) => ReactNode;
  /** 自定义空状态 */
  emptyState?: ReactNode;
  className?: string;
}

export function DataTableContent<TData = any>({
  selectable = false,
  renderExpandedRow,
  emptyState,
  className,
}: DataTableContentProps<TData>) {
  const {
    data,
    columns,
    rowKey,
    isLoading,
    selectedKeys,
    toggleSelectRow,
    toggleSelectAll,
    isAllSelected,
    expandedRowKeys,
    toggleExpandRow,
    subject,
    ability,
  } = useDataTableContext<TData>();

  // 根据 CASL ability 自动过滤受控字段列
  const visibleColumns = useMemo(() => {
    return columns.filter((col) => {
      if (!col.field || !ability || !subject) return true;
      return ability.can("read", subject, col.field);
    });
  }, [columns, ability, subject]);

  const totalColSpan =
    visibleColumns.length + (selectable ? 1 : 0) + (renderExpandedRow ? 1 : 0);

  return (
    <div
      className={cn(
        "rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs relative",
        className,
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-xs">
          <div className="flex items-center gap-2 rounded-md bg-card px-3 py-1.5 shadow-md border border-border text-xs text-muted-foreground font-medium">
            <Loader2 className="size-3.5 animate-spin text-primary" />
            <span>加载中...</span>
          </div>
        </div>
      )}

      <Table>
        <TableHeader className="bg-muted/40 font-medium">
          <TableRow className="hover:bg-transparent">
            {selectable && (
              <TableHead className="w-[40px] px-3">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="选择全部行"
                />
              </TableHead>
            )}
            {renderExpandedRow && (
              <TableHead className="w-[36px] px-2 text-center" />
            )}
            {visibleColumns.map((col) => (
              <TableHead
                key={col.id}
                style={{ width: col.width }}
                className={cn(
                  "text-xs font-semibold text-muted-foreground",
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
          {data.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={totalColSpan}
                className="h-64 text-center p-0"
              >
                {emptyState || <EmptyState />}
              </TableCell>
            </TableRow>
          ) : (
            data.map((record, index) => {
              const key = rowKey(record);
              const isSelected = selectedKeys.has(key);
              const isExpanded = expandedRowKeys.has(key);

              return (
                <React.Fragment key={key}>
                  <TableRow
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(
                      "transition-colors text-xs hover:bg-muted/30",
                      isSelected && "bg-muted/50",
                    )}
                  >
                    {selectable && (
                      <TableCell className="w-[40px] px-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectRow(key)}
                          aria-label={`选择行 ${key}`}
                        />
                      </TableCell>
                    )}
                    {renderExpandedRow && (
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
                    )}
                    {visibleColumns.map((col) => (
                      <TableCell
                        key={col.id}
                        style={{ width: col.width }}
                        className={cn(
                          "py-2.5 px-3 text-xs text-foreground",
                          col.align === "center" && "text-center",
                          col.align === "right" && "text-right",
                          col.className,
                        )}
                      >
                        {col.cell(record, index)}
                      </TableCell>
                    ))}
                  </TableRow>
                  {renderExpandedRow && isExpanded && (
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
                  )}
                </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
