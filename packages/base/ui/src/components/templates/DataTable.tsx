"use client";

import * as React from "react";
import { Download, Plus, RefreshCw } from "lucide-react";
import { Button } from "../shadcn/button";
import { Input } from "../shadcn/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../shadcn/select";
import {
  DataTableRoot,
  DataTableHeader,
  DataTableToolbar,
  DataTableFilterBar,
  DataTableInputGroup,
  DataTableFacetedFilter,
  DataTableFilterDrawer,
  DataTableColumnSettings,
  DataTableBatchBar,
  DataTableContent,
  DataTableRowActions,
  DataTablePagination,
  DataTableActions,
  DataTableActionButton,
} from "../composite/table";
import { DetailTable } from "../composite/table/DetailTable";
import { createColumnsFromSchema } from "../composite/table/DataTableColumnsSchema";
import {
  AuthField as CompositeAuthField,
  AuthGuard as CompositeAuthGuard,
} from "../composite/auth";
import type { ColumnDef } from "../composite/table/DataTableContext";
import type { DataTableRootProps } from "../composite/table/DataTableRoot";
import type { DataTableContentProps } from "../composite/table/DataTableContent";

export interface DataTableStatusOption {
  readonly value: string;
  readonly label: string;
}

export interface DataTableProps<TData> extends Omit<
  DataTableRootProps<TData>,
  "children"
> {
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
  statusOptions?: readonly DataTableStatusOption[];
  hideStatusFilter?: boolean;
  /** 输入框搜索提示文案，默认「输入关键字搜索...」 */
  keywordPlaceholder?: string;
  searchPlaceholder?: string;
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
 * 全系统标准列表模板 (DataTable)
 *
 * 默认全量一体化结构：Header + 刷新/导出/列设置/新增 + 关键字(+/状态)筛选 + 表格 + 分页。
 * 纯中立、无业务胶水代码。
 */
export function DataTable<TData>({
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
  keywordPlaceholder,
  searchPlaceholder,
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
}: DataTableProps<TData>) {
  const showStatusFilter =
    !hideStatusFilter && !!statusOptions && statusOptions.length > 0;

  const resolvedPlaceholder =
    searchPlaceholder ?? keywordPlaceholder ?? "输入关键字搜索...";

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
                <RefreshCw
                  data-icon="inline-start"
                  className="text-muted-foreground"
                />
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
                <Download
                  data-icon="inline-start"
                  className="text-muted-foreground"
                />
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
                <Plus data-icon="inline-start" />
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
                <DataTableInputGroup
                  label="关键字"
                  className="min-w-[280px] sm:w-80"
                >
                  <Input
                    placeholder={resolvedPlaceholder}
                    value={keywordValue}
                    onChange={(e) => onKeywordChange?.(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onSearch?.();
                      }
                    }}
                  />
                </DataTableInputGroup>
              ) : null}

              {showStatusFilter ? (
                <DataTableInputGroup
                  label="状态"
                  className="min-w-[170px] w-auto"
                >
                  <Select
                    value={statusValue ?? statusAllValue}
                    onValueChange={(value) =>
                      onStatusChange?.(value ?? statusAllValue)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={statusAllLabel} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value={statusAllValue}>
                          {statusAllLabel}
                        </SelectItem>
                        {statusOptions?.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
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

// 积木化子组件挂载，方便积木式拼装
DataTable.Root = DataTableRoot;
DataTable.Header = DataTableHeader;
DataTable.Toolbar = DataTableToolbar;
DataTable.FilterBar = DataTableFilterBar;
DataTable.InputGroup = DataTableInputGroup;
DataTable.FacetedFilter = DataTableFacetedFilter;
DataTable.FilterDrawer = DataTableFilterDrawer;
DataTable.ColumnSettings = DataTableColumnSettings;
DataTable.BatchBar = DataTableBatchBar;
DataTable.Content = DataTableContent;
DataTable.RowActions = DataTableRowActions;
DataTable.Pagination = DataTablePagination;
DataTable.Actions = DataTableActions;
DataTable.ActionButton = DataTableActionButton;
DataTable.AuthField = CompositeAuthField;
DataTable.AuthorizedField = CompositeAuthField;
DataTable.AuthGuard = CompositeAuthGuard;
DataTable.Detail = DetailTable;
DataTable.createColumnsFromSchema = createColumnsFromSchema;
