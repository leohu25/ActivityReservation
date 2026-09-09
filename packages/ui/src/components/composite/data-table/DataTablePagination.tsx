"use client";

import React, { useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
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
  className?: string;
}

export function DataTablePagination({
  pageSizeOptions = [10, 20, 50, 100],
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
      <div className="flex items-center gap-1.5">
        <span>共</span>
        <span className="font-semibold text-foreground font-mono">{total}</span>
        <span>条记录</span>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        <div className="flex items-center gap-1.5">
          <span>每页</span>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="h-7 w-[70px] text-xs">
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
          <span>条</span>
        </div>

        <div className="flex items-center gap-1 font-mono text-xs">
          <span className="font-semibold text-foreground">{page}</span>
          <span>/</span>
          <span>{totalPages}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="size-7 p-0"
            onClick={() => handlePageChange(1)}
            disabled={!canPreviousPage}
            title="第一页"
          >
            <ChevronsLeft className="size-3.5" />
          </Button>
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
          <Button
            variant="outline"
            size="sm"
            className="size-7 p-0"
            onClick={() => handlePageChange(totalPages)}
            disabled={!canNextPage}
            title="最后一页"
          >
            <ChevronsRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
