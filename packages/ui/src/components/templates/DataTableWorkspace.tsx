"use client";

import * as React from "react";
import { Download, Plus, RefreshCw } from "lucide-react";
import { Button } from "../shadcn/button";
import { Input } from "../shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../shadcn/select";
import { DataTableRoot, type DataTableRootProps } from "../composite/data-table/DataTableRoot";
import { DataTableHeader } from "../composite/data-table/DataTableHeader";
import { DataTableToolbar } from "../composite/data-table/DataTableToolbar";
import { DataTableFilterBar } from "../composite/data-table/DataTableFilterBar";
import { DataTableInputGroup } from "../composite/data-table/DataTableInputGroup";
import { DataTableColumnSettings } from "../composite/data-table/DataTableColumnSettings";
import {
  DataTableContent,
  type DataTableContentProps,
} from "../composite/data-table/DataTableContent";
import { DataTablePagination } from "../composite/data-table/DataTablePagination";
import { DataTableActionButton } from "../composite/data-table/DataTableActions";
import type { ColumnDef } from "../composite/data-table/DataTableContext";

export interface WorkspaceStatusOption {
  readonly value: string;
  readonly label: string;
}

export interface DataTableWorkspaceProps<TData>
  extends Omit<DataTableRootProps<TData>, "children"> {
  /** 分类小标，默认 BUSINESS WORKSPACE */
  category?: string;
  title: string;
  description?: string;

  // ---- 工具栏：默认全量，hide* 关闭 ----
  /** 默认 true */
  showRefresh?: boolean;
  /** 默认 true；无权限时 ActionButton 自动隐藏 */
  showExport?: boolean;
  /** 默认 true */
  showColumnSettings?: boolean;
  /** 默认 true；无权限时 ActionButton 自动隐藏 */
  showCreate?: boolean;
  /** 额外工具栏按钮（扩展，不替换默认） */
  toolbarExtra?: React.ReactNode;
  onRefresh?: () => void;
  onExport?: () => void;
  onCreate?: () => void;
  createText?: string;
  exportText?: string;
  refreshText?: string;

  // ---- 筛选栏：默认关键字 + 可选状态 ----
  showFilterBar?: boolean;
  /** 默认 true */
  showKeywordFilter?: boolean;
  /** 提供 options 则展示状态筛选；hideStatusFilter 可强制关闭 */
  statusOptions?: readonly WorkspaceStatusOption[];
  hideStatusFilter?: boolean;
  keywordPlaceholder?: string;
  keywordValue?: string;
  statusValue?: string;
  onKeywordChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
  /** 状态「全部」选项 value，默认空字符串 */
  statusAllValue?: string;
  statusAllLabel?: string;
  onSearch?: () => void;
  onReset?: () => void;
  onAdvancedFilter?: () => void;
  /** 状态/关键字之外的自定义筛选插槽 */
  filterExtra?: React.ReactNode;
  /** 完全接管筛选栏 children（仍保留查询/重置按钮） */
  filterChildren?: React.ReactNode;

  // ---- 表格 / 分页 ----
  contentProps?: DataTableContentProps<TData>;
  showPagination?: boolean;
  /** 插入在分页之后（如详情弹窗、表单 Modal） */
  children?: React.ReactNode;
}

/**
 * 一体化列表工作台模板（约定大于配置）
 *
 * 默认全量：Header + 刷新/导出/列设置/新增 + 关键字(+/状态)筛选 + 表格 + 分页。
 * 页面按需 hide / 覆盖；原子积木 API 保留，本模板内部组合使用。
 */
export function DataTableWorkspace<TData>({
  category = "BUSINESS WORKSPACE",
  title,
  description,
  data,
  columns,
  rowKey,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
  subject,
  ability,
  permissions,
  integratedCard = true,
  clientSidePagination,
  className,

  showRefresh = true,
  showExport = true,
  showColumnSettings = true,
  showCreate = true,
  toolbarExtra,
  onRefresh,
  onExport,
  onCreate,
  createText = "新增",
  exportText = "导出",
  refreshText = "刷新",

  showFilterBar = true,
  showKeywordFilter = true,
  statusOptions,
  hideStatusFilter = false,
  keywordPlaceholder = "单号 / 名称 / 关键字",
  keywordValue,
  statusValue,
  onKeywordChange,
  onStatusChange,
  statusAllValue = "",
  statusAllLabel = "全部状态",
  onSearch,
  onReset,
  onAdvancedFilter,
  filterExtra,
  filterChildren,

  contentProps,
  showPagination = true,
  children,
}: DataTableWorkspaceProps<TData>) {
  const showStatusFilter =
    !hideStatusFilter && !!statusOptions && statusOptions.length > 0;

  return (
    <DataTableRoot<TData>
      data={data}
      columns={columns as readonly ColumnDef<TData>[]}
      rowKey={rowKey}
      isLoading={isLoading}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      subject={subject}
      ability={ability}
      permissions={permissions}
      integratedCard={integratedCard}
      clientSidePagination={clientSidePagination}
      className={className}
    >
      <DataTableHeader
        category={category}
        title={title}
        description={description}
        actions={
          <DataTableToolbar>
            {showRefresh ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="gap-1.5 border-border bg-card shadow-xs hover:bg-muted/40"
              >
                <RefreshCw className="size-3.5 text-muted-foreground" />
                {refreshText}
              </Button>
            ) : null}

            {showExport ? (
              <DataTableActionButton
                action="export"
                variant="outline"
                size="sm"
                onClick={onExport}
                className="gap-1.5 border-border bg-card shadow-xs hover:bg-muted/40"
              >
                <Download className="size-3.5 text-muted-foreground" />
                {exportText}
              </DataTableActionButton>
            ) : null}

            {showColumnSettings ? <DataTableColumnSettings /> : null}

            {toolbarExtra}

            {showCreate ? (
              <DataTableActionButton
                action="create"
                size="sm"
                onClick={onCreate}
                className="gap-1.5 shadow-xs"
              >
                <Plus className="size-3.5" />
                {createText}
              </DataTableActionButton>
            ) : null}
          </DataTableToolbar>
        }
      />

      {showFilterBar ? (
        <DataTableFilterBar
          onSearch={onSearch}
          onReset={onReset}
          onAdvancedFilter={onAdvancedFilter}
        >
          {filterChildren ?? (
            <>
              {showKeywordFilter ? (
                <DataTableInputGroup label="关键字" className="w-64">
                  <Input
                    placeholder={keywordPlaceholder}
                    value={keywordValue}
                    onChange={(e) => onKeywordChange?.(e.target.value)}
                  />
                </DataTableInputGroup>
              ) : null}

              {showStatusFilter ? (
                <DataTableInputGroup label="状态" className="w-40">
                  <Select
                    value={statusValue ?? statusAllValue}
                    onValueChange={(v) => onStatusChange?.(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={statusAllLabel} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={statusAllValue}>
                        {statusAllLabel}
                      </SelectItem>
                      {statusOptions?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DataTableInputGroup>
              ) : null}

              {filterExtra}
            </>
          )}
        </DataTableFilterBar>
      ) : null}

      <DataTableContent showIndex {...contentProps} />

      {showPagination ? <DataTablePagination /> : null}

      {children}
    </DataTableRoot>
  );
}
