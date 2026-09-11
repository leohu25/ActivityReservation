"use client";

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../primitives/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../primitives/select";
import { useDataTableContext } from "./DataTableContext";
import { cn } from "../../../lib/utils";

export interface DataTablePaginationProps {
  pageSizeOptions?: readonly number[];
  /** 是否显示「显示第 X-Y 条」范围文案，默认 true */
  showRange?: boolean;
  /** 数字页码窗口大小（当前页左右各展示多少页），默认 1 */
  siblingCount?: number;
  className?: string;
}

/** 生成紧凑页码序列：[1, '…', 4, 5, 6, '…', 20] */
function buildPageItems(
  current: number,
  total: number,
  siblingCount: number,
): Array<number | "ellipsis"> {
  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  pages.add(current);
  for (let i = 1; i <= siblingCount; i += 1) {
    if (current - i >= 1) pages.add(current - i);
    if (current + i <= total) pages.add(current + i);
  }
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const items: Array<number | "ellipsis"> = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) {
      items.push("ellipsis");
    }
    items.push(p);
    prev = p;
  }
  return items;
}

export function DataTablePagination({
  pageSizeOptions = [10, 20, 50, 100],
  showRange = true,
  siblingCount = 1,
  className,
}: DataTablePaginationProps) {
  const {
    page = 1,
    pageSize = 10,
    total = 0,
    onPageChange,
  } = useDataTableContext();

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize],
  );
  const canPreviousPage = page > 1;
  const canNextPage = page < totalPages;

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const pageItems = useMemo(
    () => buildPageItems(page, totalPages, siblingCount),
    [page, totalPages, siblingCount],
  );

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    onPageChange?.(newPage, pageSize);
  };

  const handlePageSizeChange = (newSizeStr: string) => {
    const newSize = Number(newSizeStr);
    onPageChange?.(1, newSize);
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 px-1 py-1 text-xs text-muted-foreground",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>
          共 <span className="font-semibold text-foreground font-mono">{total}</span> 条
        </span>
        {showRange && total > 0 ? (
          <span className="text-muted-foreground/80">
            显示第{" "}
            <span className="font-mono tabular-nums text-foreground">
              {rangeStart}-{rangeEnd}
            </span>{" "}
            条
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="h-7 w-[64px] text-xs">
              <SelectValue placeholder={String(pageSize)} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)} className="text-xs">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs">条/页</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="size-7 p-0"
            onClick={() => handlePageChange(page - 1)}
            disabled={!canPreviousPage}
            title="上一页"
          >
            <ChevronLeft className="size-3.5" />
          </Button>

          {pageItems.map((item, idx) =>
            item === "ellipsis" ? (
              <span
                key={`e-${idx}`}
                className="inline-flex size-7 items-center justify-center text-muted-foreground"
              >
                …
              </span>
            ) : (
              <Button
                key={item}
                variant={item === page ? "default" : "outline"}
                size="sm"
                className={cn(
                  "size-7 p-0 font-mono text-xs",
                  item === page && "pointer-events-none",
                )}
                onClick={() => handlePageChange(item)}
                title={`第 ${item} 页`}
              >
                {item}
              </Button>
            ),
          )}

          <Button
            variant="outline"
            size="sm"
            className="size-7 p-0"
            onClick={() => handlePageChange(page + 1)}
            disabled={!canNextPage}
            title="下一页"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
