"use client";

import * as React from "react";
import {
  DataTableContext,
  resolveDefaultVisibleColumnIds,
  type ColumnDef,
  type DataTableContextValue,
} from "./DataTableContext";
import { cn } from "../../../lib/utils";

export interface PlainTablePermissions {
  readonly actions: readonly string[];
  readonly fieldPolicies?: Readonly<Record<string, string>>;
}

export interface DataTableRootProps<TData> {
  data: readonly TData[];
  columns: readonly ColumnDef<TData>[];
  rowKey: (record: TData) => string;
  isLoading?: boolean;
  /** 当前页码（受控，服务端分页必传） */
  page?: number;
  /** 每页条数（受控，服务端分页必传） */
  pageSize?: number;
  /** 总条数（服务端分页必传，来自 API total） */
  total?: number;
  /** 翻页回调：由业务层请求服务端 API 拉取目标页 */
  onPageChange?: (page: number, pageSize: number) => void;
  subject?: string;
  ability?: {
    can(action: string, subject: string, field?: string): boolean;
  };
  permissions?: PlainTablePermissions;
  /**
   * 一体化白卡容器。默认 true：
   * 渲染 `bg-card border shadow-xs rounded-xl`，将标题/筛选/表格/分页整合为一体化操作容器。
   */
  integratedCard?: boolean;
  /**
   * 仅用于本地演示/小数据集：对 data 做客户端切片。
   * 生产列表严禁开启，必须走服务端 page/pageSize/total。
   */
  clientSidePagination?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function DataTableRoot<TData>({
  data,
  columns,
  rowKey,
  isLoading = false,
  page,
  pageSize,
  total,
  onPageChange,
  subject,
  ability: explicitAbility,
  permissions,
  integratedCard = true,
  clientSidePagination = false,
  children,
  className,
}: DataTableRootProps<TData>) {
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(
    new Set(),
  );
  const [expandedRowKeys, setExpandedRowKeys] = React.useState<Set<string>>(
    new Set(),
  );

  // 仅 clientSidePagination 时用内部状态；服务端分页一律受控
  const [internalPage, setInternalPage] = React.useState(1);
  const [internalPageSize, setInternalPageSize] = React.useState(10);

  const effectiveTotal = total ?? data.length;
  const effectivePageSize = pageSize ?? internalPageSize;
  const effectivePage = page ?? internalPage;

  const pageData = React.useMemo(() => {
    if (!clientSidePagination) {
      // 服务端分页：data 即当前页，禁止再切片
      return data;
    }
    const start = (effectivePage - 1) * effectivePageSize;
    return data.slice(start, start + effectivePageSize);
  }, [data, clientSidePagination, effectivePage, effectivePageSize]);

  const handlePageChange = React.useCallback(
    (nextPage: number, nextPageSize: number) => {
      onPageChange?.(nextPage, nextPageSize);
      if (clientSidePagination) {
        setInternalPage(nextPage);
        setInternalPageSize(nextPageSize);
      }
    },
    [onPageChange, clientSidePagination],
  );

  const defaultVisibleIds = React.useMemo(
    () => resolveDefaultVisibleColumnIds(columns),
    [columns],
  );

  const [visibleColumnIds, setVisibleColumnIds] = React.useState<Set<string>>(
    () => new Set(defaultVisibleIds),
  );

  // 记录上一轮列 id，用于区分「用户隐藏」与「新增列」
  const prevColumnIdsRef = React.useRef<Set<string>>(
    new Set(columns.map((c) => c.id)),
  );

  React.useEffect(() => {
    const prevIds = prevColumnIdsRef.current;
    const nextIds = new Set(columns.map((c) => c.id));
    prevColumnIdsRef.current = nextIds;

    setVisibleColumnIds((prev) => {
      // 初始化后 prev 为空的异常兜底
      if (prev.size === 0) {
        return new Set(defaultVisibleIds);
      }
      const next = new Set<string>();
      for (const col of columns) {
        if (col.lockVisible) {
          next.add(col.id);
          continue;
        }
        // 用户已显示 → 保留
        if (prev.has(col.id)) {
          next.add(col.id);
          continue;
        }
        // 全新列且默认可见 → 自动加入
        if (!prevIds.has(col.id) && col.defaultVisible !== false) {
          next.add(col.id);
        }
        // 其余（用户隐藏过）保持隐藏
      }
      return next;
    });
  }, [columns, defaultVisibleIds]);

  const toggleColumnVisibility = React.useCallback(
    (columnId: string) => {
      const col = columns.find((c) => c.id === columnId);
      if (col?.lockVisible) return;
      setVisibleColumnIds((prev) => {
        const next = new Set(prev);
        if (next.has(columnId)) {
          next.delete(columnId);
        } else {
          next.add(columnId);
        }
        return next;
      });
    },
    [columns],
  );

  const resetColumnVisibility = React.useCallback(() => {
    setVisibleColumnIds(new Set(defaultVisibleIds));
  }, [defaultVisibleIds]);

  const effectiveAbility = React.useMemo(() => {
    if (explicitAbility) {
      return explicitAbility;
    }
    if (!permissions) {
      return undefined;
    }
    return {
      can(action: string, s: string, field?: string) {
        if (subject && s && s !== subject) {
          return false;
        }
        if (!permissions.actions.includes(action)) {
          return false;
        }
        // 与 CASL 字段规则对齐：HIDDEN 剥离；READONLY 不可写
        if (
          field &&
          permissions.fieldPolicies?.[field] === "HIDDEN"
        ) {
          return false;
        }
        if (
          field &&
          (action === "create" || action === "update") &&
          permissions.fieldPolicies?.[field] === "READONLY"
        ) {
          return false;
        }
        return true;
      },
    };
  }, [explicitAbility, permissions, subject]);

  const allRowKeys = React.useMemo(
    () => pageData.map((item) => rowKey(item)),
    [pageData, rowKey],
  );

  const isAllSelected = React.useMemo(
    () =>
      allRowKeys.length > 0 && allRowKeys.every((key) => selectedKeys.has(key)),
    [allRowKeys, selectedKeys],
  );

  const isAnySelected = selectedKeys.size > 0;

  const toggleSelectRow = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(allRowKeys));
    }
  };

  const clearSelection = () => {
    setSelectedKeys(new Set());
  };

  const toggleExpandRow = (key: string) => {
    setExpandedRowKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const value = React.useMemo<DataTableContextValue<TData>>(
    () => ({
      data,
      pageData,
      columns,
      rowKey,
      isLoading,
      selectedKeys,
      toggleSelectRow,
      toggleSelectAll,
      clearSelection,
      isAllSelected,
      isAnySelected,
      expandedRowKeys,
      toggleExpandRow,
      page: effectivePage,
      pageSize: effectivePageSize,
      total: effectiveTotal,
      onPageChange: handlePageChange,
      visibleColumnIds,
      toggleColumnVisibility,
      resetColumnVisibility,
      subject,
      ability: effectiveAbility,
    }),
    [
      data,
      pageData,
      columns,
      rowKey,
      isLoading,
      selectedKeys,
      isAllSelected,
      isAnySelected,
      expandedRowKeys,
      effectivePage,
      effectivePageSize,
      effectiveTotal,
      handlePageChange,
      visibleColumnIds,
      toggleColumnVisibility,
      resetColumnVisibility,
      subject,
      effectiveAbility,
    ],
  );

  return (
    <DataTableContext.Provider value={value}>
      {integratedCard ? (
        <div
          className={cn(
            "w-full rounded-xl border border-border bg-card p-5 shadow-sm",
            className,
          )}
        >
          <div className="flex flex-col gap-3 w-full">{children}</div>
        </div>
      ) : (
        <div className={cn("flex flex-col gap-3 w-full", className)}>
          {children}
        </div>
      )}
    </DataTableContext.Provider>
  );
}
