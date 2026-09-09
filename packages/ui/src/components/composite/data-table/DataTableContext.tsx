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
}

export interface DataTableContextValue<TData = any> {
  data: readonly TData[];
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

  // 分页状态
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number, pageSize: number) => void;

  // 权限与业务上下文
  subject?: string;
  ability?: {
    can(action: string, subject: string, field?: string): boolean;
  };
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

export { DataTableContext };
