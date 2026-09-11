"use client";

import React, { createContext, useContext } from "react";

export interface ColumnDef<TData> {
  id: string;
  header:
    | React.ReactNode
    | ((context: {
        isAllSelected: boolean;
        toggleAll: () => void;
      }) => React.ReactNode);
  field?: string;
  cell: (record: TData, index: number) => React.ReactNode;
  width?: string | number;
  align?: "left" | "center" | "right";
  className?: string;
  /** 默认是否可见（列设置面板初始化） */
  defaultVisible?: boolean;
  /** 锁定可见，列设置面板中禁止隐藏 */
  lockVisible?: boolean;
}

export interface DataTableContextValue<TData = any> {
  /** 传入的全量（或服务端当前页）数据 */
  data: readonly TData[];
  /** 当前应渲染的数据：客户端分页时为切片结果 */
  pageData: readonly TData[];
  columns: readonly ColumnDef<TData>[];
  rowKey: (record: TData) => string;
  isLoading?: boolean;

  // 行勾选与批量操作状态
  selectedKeys: Set<string>;
  toggleSelectRow: (key: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
  isAllSelected: boolean;
  isAnySelected: boolean;

  // 展开行状态
  expandedRowKeys: Set<string>;
  toggleExpandRow: (key: string) => void;

  // 分页状态（effective 值，已合并内部状态）
  page: number;
  pageSize: number;
  total: number;
  onPageChange?: (page: number, pageSize: number) => void;

  // 动态列显隐
  visibleColumnIds: Set<string>;
  toggleColumnVisibility: (columnId: string) => void;
  resetColumnVisibility: () => void;

  // 业务上下文：仅承载 subject；Ability 一律来自 @casl/react AbilityProvider
  subject?: string;
}

const DataTableContext = createContext<DataTableContextValue<any> | null>(null);

export function useDataTableContext<TData = any>() {
  const context = useContext(DataTableContext);
  if (!context) {
    throw new Error(
      "useDataTableContext must be used within a DataTable.Root component.",
    );
  }
  return context as DataTableContextValue<TData>;
}

/** 默认可见列集合：lockVisible / defaultVisible !== false 的列 */
export function resolveDefaultVisibleColumnIds<TData>(
  columns: readonly ColumnDef<TData>[],
): Set<string> {
  const ids = new Set<string>();
  for (const col of columns) {
    if (col.lockVisible || col.defaultVisible !== false) {
      ids.add(col.id);
    }
  }
  return ids;
}

export { DataTableContext };
