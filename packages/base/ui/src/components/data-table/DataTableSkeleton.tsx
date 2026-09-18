import { Skeleton } from "../ui/skeleton";
import { cn } from "../../lib/utils";

export interface DataTableSkeletonProps {
  readonly columns?: number;
  readonly rows?: number;
  readonly className?: string;
  /**
   * full：标题 + 筛选 + 表格（整页加载）
   * table：仅表体（筛选区在 Suspense 外时使用，避免筛选条被骨架顶掉）
   */
  readonly variant?: "full" | "table";
}

/** 列表 Suspense 流式占位骨架（工业风 DataTable 配套） */
export function DataTableSkeleton({
  columns = 5,
  rows = 8,
  className,
  variant = "full",
}: DataTableSkeletonProps) {
  const cols = Math.max(1, columns);
  const rowList = Array.from({ length: Math.max(1, rows) }, (_, i) => i);
  const colList = Array.from({ length: cols }, (_, i) => i);
  const gridStyle = { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` };

  return (
    <div
      className={cn(
        "w-full space-y-3",
        variant === "full" ? "p-4" : "px-4 pb-4 pt-2",
        className,
      )}
    >
      {variant === "full" ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="h-9 w-full max-w-xl" />
        </>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-border/60">
        <div
          className="grid gap-3 border-b border-border/50 bg-muted/40 p-3"
          style={gridStyle}
        >
          {colList.map((c) => (
            <Skeleton key={`h-${c}`} className="h-4" />
          ))}
        </div>
        {rowList.map((r) => (
          <div
            key={`r-${r}`}
            className="grid gap-3 border-b border-border/40 p-3 last:border-b-0"
            style={gridStyle}
          >
            {colList.map((c) => (
              <Skeleton key={`r-${r}-c-${c}`} className="h-4" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
