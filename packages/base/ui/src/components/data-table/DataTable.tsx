"use client";

import * as React from "react";
import { Download, Plus, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Combobox, type ComboboxOption } from "../form/Combobox";
import { PageContainer } from "../layout/PageContainer";
import { DataTableRoot, type DataTableRootProps } from "./DataTableRoot";
import { DataTableHeader } from "./DataTableHeader";
import { DataTableToolbar } from "./DataTableToolbar";
import { DataTableFilterBar } from "./DataTableFilterBar";
import { DataTableInputGroup } from "./DataTableInputGroup";
import { DataTableFacetedFilter } from "./DataTableFacetedFilter";
import { DataTableFilterDrawer } from "./DataTableFilterDrawer";
import { DataTableColumnSettings } from "./DataTableColumnSettings";
import { DataTableBatchBar } from "./DataTableBatchBar";
import {
	DataTableContent,
	type DataTableContentProps,
} from "./DataTableContent";
import { DataTableRowActions } from "./DataTableRowActions";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableActions, DataTableActionButton } from "./DataTableActions";
import { DetailTable } from "./DetailTable";
import { createColumnsFromSchema } from "./DataTableColumnsSchema";
import {
	AuthField as CompositeAuthField,
	AuthGuard as CompositeAuthGuard,
} from "../auth";
import type { ColumnDef } from "./DataTableContext";

export interface DataTableStatusOption {
	readonly value: string;
	readonly label: string;
}

export interface DataTableProps<TData>
	extends Omit<DataTableRootProps<TData>, "children"> {
	/** 标题；`showHeader={false}` 时可省略（壳层自绘 Header） */
	title?: string;
	description?: string;
	/**
	 * 标题右侧扩展插槽 (headerExtra / tabsSlot)
	 * 紧跟在左侧主标题之后，例如大类切换 Tab、分段筛选器等，与右侧新增/刷新按钮自然两端对齐。
	 */
	headerExtra?: React.ReactNode;
	/** 默认 true。false 时不渲染 Header（筛选/表体由外层壳或积木拼装） */
	showHeader?: boolean;
	/**
	 * 默认与 showHeader 一致；showHeader=false 时可单独打开，
	 * 在表体上方渲染刷新/导出/列设置等工具按钮（壳层拆分场景）。
	 */
	showToolbar?: boolean;

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
	/**
	 * 推荐扩展插槽：关键字/状态之外的业务筛选（如客户分类）。
	 * 渲染在默认筛选栏内，与搜索/新增/刷新/导出/列设置并排，**不会**被折叠。
	 * @example filterExtra={<DataTableInputGroup label="客户分类">...</DataTableInputGroup>}
	 */
	filterExtra?: React.ReactNode;
	/** 完全接管筛选栏 children（仍保留查询/重置按钮）；一般业务请优先用 filterExtra */
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
	title,
	description,
	headerExtra,
	showHeader = true,
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
	showToolbar,
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

	const toolbarVisible = showToolbar ?? showHeader !== false;

	const keywordField = showKeywordFilter ? (
		<DataTableInputGroup label="关键字" className="min-w-[220px] sm:w-72">
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
	) : null;

	const statusComboboxOptions = React.useMemo<ComboboxOption[]>(() => {
		if (!statusOptions) return [];
		return statusOptions.map((opt) => ({
			value: opt.value,
			label: opt.label,
		}));
	}, [statusOptions]);

	const statusField = showStatusFilter ? (
		<DataTableInputGroup label="状态" className="min-w-[170px] w-auto">
			<Combobox
				value={statusValue || null}
				options={statusComboboxOptions}
				placeholder={statusAllLabel}
				clearable={true}
				onChange={(val) => onStatusChange?.(val || statusAllValue)}
			/>
		</DataTableInputGroup>
	) : null;

	const toolbar = (
		<DataTableToolbar>
			{showRefresh ? (
				<Button
					variant="outline"
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
					onClick={onCreate}
					className="gap-1.5 shadow-xs"
				>
					<Plus data-icon="inline-start" />
					{createText}
				</DataTableActionButton>
			) : null}
		</DataTableToolbar>
	);

	return (
		<PageContainer scrollable={true} padded={true}>
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
				{showHeader !== false ? (
					<DataTableHeader
						title={title ?? ""}
						description={description}
						slotExtra={headerExtra}
						actions={toolbar}
					/>
				) : toolbarVisible ? (
					<div className="flex flex-wrap items-center justify-end gap-2 px-4 pt-3">
						{toolbar}
					</div>
				) : null}

				{showFilterBar ? (
					<DataTableFilterBar
						onSearch={onSearch}
						onReset={onReset}
						onAdvancedFilter={onAdvancedFilter}
					>
						{filterChildren ?? (
							<>
								{keywordField}
								{statusField}
								{filterExtra}
							</>
						)}
					</DataTableFilterBar>
				) : null}

				<DataTableContent showIndex {...contentProps} />

				{showPagination ? <DataTablePagination /> : null}

				{children}
			</DataTableRoot>
		</PageContainer>
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
