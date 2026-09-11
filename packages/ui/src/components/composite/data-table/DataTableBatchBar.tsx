"use client";

import type { ReactNode } from "react";
import { CheckSquare, X } from "lucide-react";
import { Button } from "../../shadcn/button";
import { useDataTableContext } from "./DataTableContext";
import { cn } from "../../../lib/utils";

export interface DataTableBatchBarProps {
  /** 批量操作按钮组插槽，参数为当前选中的 rowKey 数组 */
  children?:
    | ReactNode
    | ((context: {
        selectedKeys: string[];
        clearSelection: () => void;
      }) => ReactNode);
  className?: string;
}

export function DataTableBatchBar({
  children,
  className,
}: DataTableBatchBarProps) {
  const { selectedKeys, clearSelection, isAnySelected } = useDataTableContext();

  if (!isAnySelected) {
    return null;
  }

  const selectedArray = Array.from(selectedKeys);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-primary/30 bg-primary/5 text-xs text-foreground transition-all animate-in fade-in-50 slide-in-from-top-1",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <CheckSquare className="size-4 text-primary shrink-0" />
        <span>
          已选择{" "}
          <strong className="font-semibold text-primary">
            {selectedKeys.size}
          </strong>{" "}
          项
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSelection}
          className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground gap-1"
        >
          <X className="size-3" />
          <span>取消选择</span>
        </Button>
      </div>
      <div className="flex items-center gap-2">
        {typeof children === "function"
          ? children({ selectedKeys: selectedArray, clearSelection })
          : children}
      </div>
    </div>
  );
}
