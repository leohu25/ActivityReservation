"use client";

import React, { useState } from "react";
import {
  ChevronRight,
  Plus,
  Search,
  RotateCcw,
  Download,
  Upload,
  Printer,
  MoreHorizontal,
  Building2,
  ChevronLeft,
} from "lucide-react";
import { Button } from "./button";
import { Card, CardHeader, CardTitle, CardContent } from "./card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "./table";
import { cn } from "../lib/utils";

/**
 * 平台通用操作动作标识（与 @chenrun/authorization 的 StandardAction 契约一致）
 */
export const WorkspaceAction = {
  READ: "read",
  CREATE: "create",
  EXPORT: "export",
  IMPORT: "import",
  PRINT: "print",
  UPDATE: "update",
  DELETE: "delete",
} as const;

export interface ColumnDef<TData> {
  id: string;
  header: string | React.ReactNode;
  /** 实体受控字段名，若传入且提供了 ability，将自动校验 ability.can('read', subject, field) */
  field?: string;
  cell: (record: TData, index: number) => React.ReactNode;
  width?: string | number;
  align?: "left" | "center" | "right";
}

export interface WorkspaceViewItem {
  id: string;
  label: string;
  badge?: string;
  count?: number;
}

export interface WorkspaceStatusItem {
  key: string;
  label: string;
  count: number;
}

export interface BusinessTableWorkspaceProps<TData> {
  /** 实体 Subject 标识，如 "PurchaseOrder" */
  subject: string;
  /** CASL Ability 或兼容接口实例，用于自动判定按钮显隐与受控字段权限 */
  ability?: {
    can(action: string, subject: string, field?: string): boolean;
  };

  // --- 1. 顶部 Header 工作区 ---
  breadcrumbs?: Array<{ label: string; href?: string }>;
  title: string;
  description?: string;
  tag?: string;
  extraHeader?: React.ReactNode;

  // --- 2. 常用视图 Tabs ---
  views?: readonly WorkspaceViewItem[];
  activeViewId?: string;
  onViewChange?: (viewId: string) => void;

  // --- 3. 左侧状态侧边栏 (可选) ---
  statusSidebar?: {
    title?: string;
    items: readonly WorkspaceStatusItem[];
    activeKey: string;
    onSelect: (key: string) => void;
  };

  // --- 4. 检索过滤区 ---
  searchFilters?: React.ReactNode;
  onSearch?: () => void;
  onReset?: () => void;

  // --- 5. 工具栏行为（带权限自动拦截）---
  createButton?: {
    label: string;
    onClick: () => void;
    /** 覆盖默认的 'create' 动作权限名 */
    action?: string;
  };
  moreActions?: {
    onExport?: () => void;
    onImport?: () => void;
    onPrint?: () => void;
    extraItems?: Array<{
      label: string;
      action?: string;
      onClick: () => void;
    }>;
  };

  // --- 6. 表格数据与列配置 ---
  data: readonly TData[];
  columns: readonly ColumnDef<TData>[];
  rowKey: (record: TData) => string;
  selectable?: boolean;
  selectedRowKeys?: readonly string[];
  onSelectionChange?: (selectedKeys: string[]) => void;

  // --- 7. 行级操作扩展 ---
  rowActions?: (record: TData) => React.ReactNode;
  rowActionsHeader?: string;

  // --- 8. 调试/SQL 提示插槽 ---
  debugQueryClause?: {
    title: string;
    content: string;
    tenantInfo?: string;
  };

  // --- 9. 分页配置 ---
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
}

export function BusinessTableWorkspace<TData>({
  subject,
  ability,
  breadcrumbs,
  title,
  description,
  tag = "BUSINESS WORKSPACE",
  extraHeader,
  views,
  activeViewId,
  onViewChange,
  statusSidebar,
  searchFilters,
  onSearch,
  onReset,
  createButton,
  moreActions,
  data,
  columns,
  rowKey,
  selectable = true,
  selectedRowKeys = [],
  onSelectionChange,
  rowActions,
  rowActionsHeader = "操作",
  debugQueryClause,
  pagination,
}: BusinessTableWorkspaceProps<TData>) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // 权限计算
  const canCreate = createButton
    ? ability
      ? ability.can(createButton.action ?? WorkspaceAction.CREATE, subject)
      : true
    : false;

  const canExport = moreActions?.onExport
    ? ability
      ? ability.can(WorkspaceAction.EXPORT, subject)
      : true
    : false;

  const canImport = moreActions?.onImport
    ? ability
      ? ability.can(WorkspaceAction.IMPORT, subject)
      : true
    : false;

  const canPrint = moreActions?.onPrint
    ? ability
      ? ability.can(WorkspaceAction.PRINT, subject)
      : true
    : false;

  // 过滤出具备读取权限的列
  const visibleColumns = columns.filter((col) => {
    if (!col.field || !ability) return true;
    return ability.can(WorkspaceAction.READ, subject, col.field);
  });

  // 多选逻辑
  const allCurrentKeys = data.map(rowKey);
  const isAllSelected =
    allCurrentKeys.length > 0 &&
    allCurrentKeys.every((k) => selectedRowKeys.includes(k));

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      onSelectionChange(
        selectedRowKeys.filter((k) => !allCurrentKeys.includes(k)),
      );
    } else {
      const merged = Array.from(
        new Set([...selectedRowKeys, ...allCurrentKeys]),
      );
      onSelectionChange(merged);
    }
  };

  const toggleSelectRow = (key: string) => {
    if (!onSelectionChange) return;
    if (selectedRowKeys.includes(key)) {
      onSelectionChange(selectedRowKeys.filter((k) => k !== key));
    } else {
      onSelectionChange([...selectedRowKeys, key]);
    }
  };

  return (
    <div className="space-y-5">
      {/* 顶部面包屑与页头 */}
      <div className="border-b border-slate-200/80 pb-5 dark:border-slate-800">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 dark:text-slate-400">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="size-3 text-slate-400" />}
                <span
                  className={cn(
                    i === breadcrumbs.length - 1 &&
                      "font-bold text-slate-800 dark:text-slate-200",
                  )}
                >
                  {b.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono tracking-wider text-amber-600 font-bold uppercase dark:text-amber-500">
              {tag}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {title}
              </h1>
            </div>
            {description && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
          {extraHeader && (
            <div className="flex items-center gap-2">{extraHeader}</div>
          )}
        </div>
      </div>

      {/* 视图切换 Tabs + 顶部工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-3 dark:border-slate-800">
        {/* 左侧视图 Tabs */}
        {views && views.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium mr-1">
              视图
            </span>
            <div className="flex items-center gap-1.5">
              {views.map((view) => {
                const isActive = view.id === activeViewId;
                return (
                  <button
                    key={view.id}
                    type="button"
                    onClick={() => onViewChange?.(view.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                      isActive
                        ? "bg-amber-50 text-amber-800 border border-amber-300/80 shadow-xs dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent dark:text-slate-400 dark:hover:bg-slate-800",
                    )}
                  >
                    <span>{view.label}</span>
                    {view.badge && (
                      <span className="text-[10px] px-1 rounded bg-blue-100 text-blue-700 font-mono">
                        {view.badge}
                      </span>
                    )}
                    {typeof view.count === "number" && (
                      <span className="text-[10px] opacity-75 font-mono">
                        ({view.count})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div />
        )}

        {/* 右侧工具栏操作 */}
        <div className="flex items-center gap-2 ml-auto">
          {/* 更多操作下拉菜单 */}
          {moreActions &&
            (canExport || canImport || canPrint || moreActions.extraItems) && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMoreMenu((prev) => !prev)}
                  className="h-8 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  <MoreHorizontal className="size-3.5 mr-1" />
                  <span>更多</span>
                </Button>

                {showMoreMenu && (
                  <div
                    className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-20 text-xs dark:border-slate-800 dark:bg-slate-900"
                    onMouseLeave={() => setShowMoreMenu(false)}
                  >
                    {canExport && (
                      <button
                        type="button"
                        onClick={() => {
                          moreActions.onExport?.();
                          setShowMoreMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Download className="size-3.5" />
                        <span>导出当前视图</span>
                      </button>
                    )}
                    {canImport && (
                      <button
                        type="button"
                        onClick={() => {
                          moreActions.onImport?.();
                          setShowMoreMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Upload className="size-3.5" />
                        <span>导入数据</span>
                      </button>
                    )}
                    {canPrint && (
                      <button
                        type="button"
                        onClick={() => {
                          moreActions.onPrint?.();
                          setShowMoreMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Printer className="size-3.5" />
                        <span>打印列表</span>
                      </button>
                    )}
                    {moreActions.extraItems?.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          item.onClick();
                          setShowMoreMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

          {/* 新增主按钮 (自动受 canCreate 守卫) */}
          {createButton && canCreate && (
            <Button
              size="sm"
              onClick={createButton.onClick}
              className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
            >
              <Plus className="size-3.5 mr-1" />
              <span>{createButton.label}</span>
            </Button>
          )}
        </div>
      </div>

      {/* 主体工作区布局：左侧可选侧栏 + 右侧主内容 */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* 左侧状态侧边栏 */}
        {statusSidebar && (
          <aside className="w-full lg:w-48 shrink-0 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            {statusSidebar.title && (
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-2">
                {statusSidebar.title}
              </div>
            )}
            <nav className="space-y-1">
              {statusSidebar.items.map((item) => {
                const isActive = item.key === statusSidebar.activeKey;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => statusSidebar.onSelect(item.key)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left",
                      isActive
                        ? "bg-blue-50 text-blue-700 font-bold dark:bg-blue-950/40 dark:text-blue-300"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60",
                    )}
                  >
                    <span>{item.label}</span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-mono",
                        isActive
                          ? "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                      )}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        {/* 右侧主体：搜索栏 + 调试卡片 + 数据表格 */}
        <div className="flex-1 w-full space-y-4 min-w-0">
          {/* 搜索栏 */}
          {(searchFilters || onSearch) && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3.5 shadow-xs text-card-foreground">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                {searchFilters}
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-auto">
                {onSearch && (
                  <Button
                    size="sm"
                    onClick={onSearch}
                    className="h-8 font-semibold text-xs"
                  >
                    <Search className="size-3.5 mr-1" />
                    <span>查询</span>
                  </Button>
                )}
                {onReset && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onReset}
                    className="h-8 text-xs font-semibold"
                  >
                    <RotateCcw className="size-3.5 mr-1" />
                    <span>重置</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* 实时下推查询条件展示（用于审计与可视化） */}
          {debugQueryClause && (
            <Card className="bg-card">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold text-foreground">
                    {debugQueryClause.title}
                  </CardTitle>
                  {debugQueryClause.tenantInfo && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Building2 className="size-3" />
                      <span>{debugQueryClause.tenantInfo}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <pre className="rounded-lg bg-muted p-3 font-mono text-xs text-foreground overflow-x-auto border">
                  {debugQueryClause.content}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* 数据表格核心区：纯正 shadcn/ui Table 原生组件规范 */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  {selectable && (
                    <TableHead className="w-10 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="size-3.5 rounded border-input text-primary focus:ring-ring"
                      />
                    </TableHead>
                  )}
                  {visibleColumns.map((col) => (
                    <TableHead
                      key={col.id}
                      className={cn(
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                      )}
                      style={{ width: col.width }}
                    >
                      {col.header}
                    </TableHead>
                  ))}
                  {rowActions && (
                    <TableHead className="px-4 text-right">
                      {rowActionsHeader}
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={
                        visibleColumns.length +
                        (selectable ? 1 : 0) +
                        (rowActions ? 1 : 0)
                      }
                      className="h-28 text-center text-muted-foreground text-xs"
                    >
                      暂无符合条件的数据记录
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((record, index) => {
                    const key = rowKey(record);
                    const isSelected = selectedRowKeys.includes(key);
                    return (
                      <TableRow
                        key={key}
                        data-state={isSelected ? "selected" : undefined}
                      >
                        {selectable && (
                          <TableCell className="px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRow(key)}
                              className="size-3.5 rounded border-input text-primary focus:ring-ring"
                            />
                          </TableCell>
                        )}
                        {visibleColumns.map((col) => (
                          <TableCell
                            key={col.id}
                            className={cn(
                              col.align === "right" && "text-right",
                              col.align === "center" && "text-center",
                            )}
                          >
                            {col.cell(record, index)}
                          </TableCell>
                        ))}
                        {rowActions && (
                          <TableCell className="px-4 text-right whitespace-nowrap">
                            {rowActions(record)}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* 分页栏 */}
            {pagination && (
              <div className="flex items-center justify-between border-t px-4 py-3 bg-muted/30 text-xs text-muted-foreground">
                <div>
                  共{" "}
                  <span className="font-semibold text-foreground">
                    {pagination.total}
                  </span>{" "}
                  条单据记录
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.current <= 1}
                    onClick={() =>
                      pagination.onChange(
                        pagination.current - 1,
                        pagination.pageSize,
                      )
                    }
                    className="h-7 px-2 text-xs"
                  >
                    <ChevronLeft className="size-3.5 mr-1" />
                    <span>上一页</span>
                  </Button>
                  <span className="font-mono text-xs px-2">
                    {pagination.current} /{" "}
                    {Math.max(
                      1,
                      Math.ceil(pagination.total / pagination.pageSize),
                    )}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      pagination.current >=
                      Math.ceil(pagination.total / pagination.pageSize)
                    }
                    onClick={() =>
                      pagination.onChange(
                        pagination.current + 1,
                        pagination.pageSize,
                      )
                    }
                    className="h-7 px-2 text-xs"
                  >
                    <span>下一页</span>
                    <ChevronRight className="size-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
