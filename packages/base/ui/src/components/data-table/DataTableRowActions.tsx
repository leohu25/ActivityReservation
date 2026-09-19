"use client";

import React, { type ReactNode, useState, useCallback } from "react";
import { MoreHorizontal, Eye, Edit2, Trash2, Power, RotateCcw } from "lucide-react";
import { useUiAbility } from "../auth";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { ConfirmDialog } from "../feedback/ConfirmDialog";
import { useDataTableContext } from "./DataTableContext";
import { cn } from "../../lib/utils";

export interface RowActionConfirm {
	title: string;
	description?: string;
	confirmText?: string;
	cancelText?: string;
}

export interface RowActionItem<TRecord> {
	label: string;
	/** 可选自定义图标 */
	icon?: ReactNode;
	action?: string;
	variant?: "default" | "destructive";
	/** 是否折叠进 ... 菜单中 (默认 false，所有操作默认在行内直接平铺展示) */
	collapsed?: boolean;
	/** 平铺展示时的自定义样式 */
	inlineClassName?: string;
	onClick: (record: TRecord) => void | Promise<void>;
	confirm?: RowActionConfirm;
}

export interface ToggleStatusActionOptions<TRecord> {
	/** 当前记录的状态值（如 "ACTIVE" / "DISABLED" / "SUSPENDED"），或返回状态的计算函数 */
	status?: string | ((record: TRecord) => string);
	/** 判断当前是否处于启用态。默认判定 status === "ACTIVE" */
	isActive?: (record: TRecord) => boolean;
	/** 启用状态下的动作文案，默认 "停用" */
	activeLabel?: string;
	/** 停用状态下的动作文案，默认 "启用" */
	inactiveLabel?: string;
	/** 自定义权限 action 标识，默认 StandardAction.TOGGLE_STATUS ("toggle_status")，如果未配则回退校验 "update" */
	action?: string;
	/** 是否强制折叠到 ... 菜单中，默认为 false（直接在行内平铺展示） */
	collapsed?: boolean;
	/** 二次确认弹窗配置，传入 false 可关闭确认 */
	confirm?:
		| boolean
		| ((record: TRecord, active: boolean) => RowActionConfirm | undefined);
}

export interface DataTableRowActionsProps<TRecord> {
	record: TRecord;
	/** 内置查看操作回调（固定绑定 Eye 图标） */
	onView?: (record: TRecord) => void;
	/** 内置编辑操作回调（固定绑定 Edit2 图标） */
	onEdit?: (record: TRecord) => void;
	/** 内置删除操作回调（固定绑定 Trash2 图标，默认行内平铺） */
	onDelete?: (record: TRecord) => void | Promise<void>;
	/** 内置停用/启用状态切换回调（高频内置操作） */
	onToggleStatus?: (record: TRecord) => void | Promise<void>;
	/** 停用/启用操作的定制参数 */
	toggleStatusOptions?: ToggleStatusActionOptions<TRecord>;
	/** 删除确认提示文案配置 */
	deleteConfirm?: {
		title?: string;
		description?: string;
		confirmText?: string;
		cancelText?: string;
	};
	/**
	 * 平铺文本链接操作，未提供时默认平铺内置「详情/编辑/删除/启停」。
	 */
	inlineActions?: readonly RowActionItem<TRecord>[];
	/** 扩展操作列表（默认全部在行内平铺展示，只有显式指定 collapsed: true 才进入 ... 折叠菜单） */
	extraActions?: readonly RowActionItem<TRecord>[];
	/** 显式隐藏内置操作 */
	hideView?: boolean;
	hideEdit?: boolean;
	hideDelete?: boolean;
	/** 显式隐藏内置停用/启用操作（当传入了 onToggleStatus 但希望临时隐藏时） */
	hideToggleStatus?: boolean;
	/** 显式指定折叠内置操作到 ... 菜单中（默认均为 false，全在行内平铺展示） */
	collapseView?: boolean;
	collapseEdit?: boolean;
	collapseDelete?: boolean;
	collapseToggleStatus?: boolean;
	/** 无权限时的展示策略：hidden（默认隐藏）或 disabled-tooltip */
	unauthorizedStrategy?: "hidden" | "disabled-tooltip";
	className?: string;
}

const EMPTY_EXTRA_ACTIONS: readonly any[] = [];

/**
 * 官方标准行操作栏 (DataTableRowActions)
 * - 规则：操作按钮默认全部在行内直接平铺展示，直观高频，除非显式指定 collapsed 折叠；
 * - 图标：内置操作（详情、编辑、删除）恒定展示统一标准图标，扩展操作支持任意传入；
 * - 安全：高危删除操作点击弹出 ConfirmDialog 二次防误删。
 */
export function DataTableRowActions<TRecord>({
	record,
	onView,
	onEdit,
	onDelete,
	onToggleStatus,
	toggleStatusOptions,
	deleteConfirm,
	inlineActions,
	extraActions = EMPTY_EXTRA_ACTIONS,
	collapseView = false,
	collapseEdit = false,
	collapseDelete = false,
	collapseToggleStatus = false,
	hideView = false,
	hideEdit = false,
	hideDelete = false,
	hideToggleStatus = false,
	unauthorizedStrategy = "hidden",
	className,
}: DataTableRowActionsProps<TRecord>) {
	const { subject } = useDataTableContext();
	const ability = useUiAbility();
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [activeConfirmAction, setActiveConfirmAction] =
		useState<RowActionItem<TRecord> | null>(null);

	// Fail-Closed：缺 ability 或 subject 一律拒绝
	const canPerform = useCallback(
		(actionName: string) => {
			if (!subject || !ability) return false;
			return ability.can(actionName, subject);
		},
		[ability, subject],
	);

	const canView = canPerform("read");
	const canEdit = canPerform("update");
	const canDelete = canPerform("delete");

	// 启停权限判断：优先检验指定 action 或 StandardAction.TOGGLE_STATUS，若未配则回退检验 update 权限
	const toggleActionName =
		toggleStatusOptions?.action ?? "toggle_status";
	const canToggleStatus =
		canPerform(toggleActionName) || canPerform("update");

	const keepUnauthorized = unauthorizedStrategy === "disabled-tooltip";

	// 解析当前记录的启用/停用状态
	const currentRecordStatus = React.useMemo(() => {
		if (typeof toggleStatusOptions?.status === "function") {
			return toggleStatusOptions.status(record);
		}
		if (typeof toggleStatusOptions?.status === "string") {
			return toggleStatusOptions.status;
		}
		const untyped = record as Record<string, unknown>;
		return typeof untyped.status === "string" ? untyped.status : "";
	}, [record, toggleStatusOptions]);

	const isRecordActive = React.useMemo(() => {
		if (toggleStatusOptions?.isActive) {
			return toggleStatusOptions.isActive(record);
		}
		return currentRecordStatus === "ACTIVE";
	}, [currentRecordStatus, record, toggleStatusOptions]);

	// 构建内置操作列表项
	const builtInActions: RowActionItem<TRecord>[] = React.useMemo(() => {
		if (inlineActions) {
			return inlineActions.filter((item) =>
				item.action ? canPerform(item.action) || keepUnauthorized : true,
			);
		}
		const list: RowActionItem<TRecord>[] = [];
		if (!hideView && (canView || keepUnauthorized)) {
			list.push({
				label: "详情",
				action: "read",
				icon: <Eye className="size-3.5" />,
				collapsed: collapseView,
				onClick: () => onView?.(record),
			});
		}
		if (!hideEdit && (canEdit || keepUnauthorized)) {
			list.push({
				label: "编辑",
				action: "update",
				icon: <Edit2 className="size-3.5" />,
				collapsed: collapseEdit,
				onClick: () => onEdit?.(record),
			});
		}
		if (onToggleStatus && !hideToggleStatus && (canToggleStatus || keepUnauthorized)) {
			const label = isRecordActive
				? (toggleStatusOptions?.activeLabel ?? "停用")
				: (toggleStatusOptions?.inactiveLabel ?? "启用");

			// 计算是否需要二次确认
			let confirmConfig: RowActionConfirm | undefined;
			if (toggleStatusOptions?.confirm === false) {
				confirmConfig = undefined;
			} else if (typeof toggleStatusOptions?.confirm === "function") {
				confirmConfig = toggleStatusOptions.confirm(record, isRecordActive);
			} else if (isRecordActive) {
				// 默认仅停用时提示二次确认防误触
				const recordName =
					(record as Record<string, unknown>).name ||
					(record as Record<string, unknown>).title ||
					"";
				confirmConfig = {
					title: recordName ? `确认停用 "${recordName}"？` : "确认停用该记录？",
					description: "停用后该数据将处于禁用状态，相关业务流程可能受限。",
					confirmText: "确认停用",
					cancelText: "取消",
				};
			}

			list.push({
				label,
				action: toggleActionName,
				icon: isRecordActive ? (
					<Power className="size-3.5" />
				) : (
					<RotateCcw className="size-3.5" />
				),
				variant: isRecordActive ? "destructive" : "default",
				collapsed: toggleStatusOptions?.collapsed ?? collapseToggleStatus,
				confirm: confirmConfig,
				onClick: () => onToggleStatus(record),
			});
		}
		return list;
	}, [
		inlineActions,
		hideView,
		hideEdit,
		hideToggleStatus,
		collapseView,
		collapseEdit,
		collapseToggleStatus,
		canView,
		canEdit,
		canToggleStatus,
		onView,
		onEdit,
		onToggleStatus,
		isRecordActive,
		toggleStatusOptions,
		toggleActionName,
		record,
		canPerform,
		keepUnauthorized,
	]);

	// 合并所有合法的扩展操作
	const validExtraActions = React.useMemo(() => {
		return extraActions.filter((item) =>
			item.action ? canPerform(item.action) || keepUnauthorized : true,
		);
	}, [extraActions, keepUnauthorized, canPerform]);

	// 区分平铺操作与折叠操作（默认全部平铺，只有 collapsed: true 才进入折叠菜单）
	const allActions = React.useMemo(() => {
		return [...validExtraActions, ...builtInActions];
	}, [validExtraActions, builtInActions]);

	const inlineItems = React.useMemo(() => {
		return allActions.filter((act) => !act.collapsed);
	}, [allActions]);

	const menuItems = React.useMemo(() => {
		return allActions.filter((act) => act.collapsed);
	}, [allActions]);

	const showDelete = !hideDelete && (canDelete || keepUnauthorized);
	const deleteDisabled = !onDelete;
	const isDeleteInline = !collapseDelete;

	// 有权限但未配置回调 → 置灰
	const isActionDisabled = (item: RowActionItem<TRecord>) => {
		if (item.action === "read") return !onView;
		if (item.action === "update") return !onEdit;
		return false;
	};

	const showDropdown = menuItems.length > 0 || (showDelete && !isDeleteInline);
	const hasAnyAction =
		inlineItems.length > 0 || (showDelete && isDeleteInline) || showDropdown;

	if (!hasAnyAction) {
		return null;
	}

	const runAction = (item: RowActionItem<TRecord>) => {
		if (item.confirm) {
			setActiveConfirmAction(item);
		} else {
			void item.onClick(record);
		}
	};

	return (
		<div className={cn("flex items-center justify-end gap-2", className)}>
			{/* 1. 默认平铺在行内的所有操作（包括内置与扩展，带图标） */}
			{inlineItems.map((item) => {
				const disabled = isActionDisabled(item);
				return (
					<Button
						key={item.label}
						type="button"
						variant="link"
						size="sm"
						disabled={disabled}
						title={disabled ? "未配置操作回调" : undefined}
						className={cn(
							"h-auto p-0 px-1 text-xs font-medium no-underline hover:underline inline-flex items-center gap-1",
							disabled && "opacity-50 hover:no-underline cursor-not-allowed",
							item.variant === "destructive"
								? "text-destructive hover:text-destructive"
								: "text-primary hover:text-primary",
							item.inlineClassName,
						)}
						onClick={() => {
							if (!disabled) runAction(item);
						}}
					>
						{item.icon}
						<span>{item.label}</span>
					</Button>
				);
			})}

			{/* 2. 平铺删除操作（默认平铺，带 Trash2 图标，高频动作直接呈现） */}
			{showDelete && isDeleteInline && (
				<Button
					type="button"
					variant="link"
					size="sm"
					disabled={deleteDisabled}
					className={cn(
						"h-auto p-0 px-1 text-xs font-medium no-underline hover:underline text-destructive hover:text-destructive inline-flex items-center gap-1",
						deleteDisabled &&
							"opacity-50 hover:no-underline cursor-not-allowed",
					)}
					onClick={() => setDeleteConfirmOpen(true)}
				>
					<Trash2 className="size-3.5" />
					<span>删除</span>
				</Button>
			)}

			{/* 3. 只有显式指定 collapsed: true 的操作才进入 ... 折叠菜单 */}
			{showDropdown && (
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								variant="ghost"
								size="sm"
								className="size-7 p-0 text-muted-foreground hover:text-foreground"
							/>
						}
					>
						<MoreHorizontal className="size-3.5" />
						<span className="sr-only">打开操作菜单</span>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-[140px] text-xs">
						<DropdownMenuGroup>
							{menuItems.map((item) => {
								const disabled = isActionDisabled(item);
								return (
									<DropdownMenuItem
										key={item.label}
										disabled={disabled}
										onClick={() => {
											if (!disabled) runAction(item);
										}}
										className={cn(
											"gap-2 cursor-pointer",
											item.variant === "destructive" && "text-destructive",
										)}
									>
										{item.icon}
										<span>{item.label}</span>
									</DropdownMenuItem>
								);
							})}

							{showDelete && !isDeleteInline && (
								<DropdownMenuItem
									disabled={deleteDisabled}
									onClick={() => setDeleteConfirmOpen(true)}
									className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
								>
									<Trash2 className="size-3.5" />
									<span>删除记录</span>
								</DropdownMenuItem>
							)}
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			)}

			{/* 内置二次确认防误删弹窗 */}
			{showDelete && !deleteDisabled && (
				<ConfirmDialog
					open={deleteConfirmOpen}
					onOpenChange={setDeleteConfirmOpen}
					title={deleteConfirm?.title || "确认删除此记录？"}
					description={
						deleteConfirm?.description ||
						"此操作无法撤销，数据删除后将无法恢复，请谨慎操作。"
					}
					confirmText={deleteConfirm?.confirmText || "确认删除"}
					cancelText={deleteConfirm?.cancelText || "取消"}
					variant="destructive"
					onConfirm={async () => {
						await onDelete?.(record);
					}}
				/>
			)}

			{/* 扩展操作自定义二次确认弹窗 */}
			{activeConfirmAction && (
				<ConfirmDialog
					open={Boolean(activeConfirmAction)}
					onOpenChange={(open) => {
						if (!open) setActiveConfirmAction(null);
					}}
					title={activeConfirmAction.confirm?.title || "请确认操作"}
					description={activeConfirmAction.confirm?.description}
					confirmText={activeConfirmAction.confirm?.confirmText || "确定"}
					cancelText={activeConfirmAction.confirm?.cancelText || "取消"}
					variant={activeConfirmAction.variant || "default"}
					onConfirm={async () => {
						await activeConfirmAction.onClick(record);
					}}
				/>
			)}
		</div>
	);
}
