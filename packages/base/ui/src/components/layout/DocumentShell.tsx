"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DocumentHeader } from "./DocumentHeader";
import { AuthGuard } from "../auth";
import { updateTabTitle } from "./TabBar";
import { useSafeRouter } from "../../lib/use-safe-router";
import { cn } from "../../lib/utils";
import {
	DocumentContext,
	type DocumentContextValue,
	type DocumentMode,
} from "./DocumentContext";

export type { DocumentMode, DocumentContextValue };
export { useDocumentContext, useOptionalDocumentContext } from "./DocumentContext";

export interface DocumentShellProps {
	/** 单据模式，默认 'create' */
	readonly mode?: DocumentMode;
	/** 单据是否业务冻结/全局只读 (如：已审核、已作废，或 view 模式) */
	readonly readonly?: boolean;
	/** 业务实体 Subject (用于 CASL 权限判定与向下广播) */
	readonly subject?: string;
	/** 单据主标题 */
	readonly title: React.ReactNode;
	/** 单据描述副标题 */
	readonly description?: React.ReactNode;
	/** TabBar 页签标题（缺省自动从 title 推导或同步） */
	readonly tabTitle?: string;
	/** 业务单号 (显示在顶栏) */
	readonly documentNumber?: string;
	/** 业务分类/实体类型徽章 (如 "制造BOM", "工序档案") */
	readonly badge?: React.ReactNode;
	/** 单据状态徽章 (如 "已生效", "草稿") */
	readonly statusBadge?: React.ReactNode;
	/** 顶栏中间插槽 (例如单据类型选择器等) */
	readonly slotMiddle?: React.ReactNode;
	/** 自定义操作栏插槽 (传入则完全接管右侧按钮区) */
	readonly slotActions?: React.ReactNode;
	/** 额外操作按钮插槽 (放置在默认的 保存/返回 按钮之前) */
	readonly extraActions?: React.ReactNode;
	/** 返回按钮文本，默认 '返回' */
	readonly backText?: string;
	/** 返回上一级回调 (缺省时自动使用 router.back 或 backUrl) */
	readonly onBack?: () => void;
	/** 返回的目标 URL 路径 */
	readonly backUrl?: string;
	/** 触发保存回调 */
	readonly onSave?: () => void | Promise<void>;
	/** 保存按钮文本，默认按模式自适应 */
	readonly saveText?: string;
	/** 取消/返回按钮文本，默认 '取消' */
	readonly cancelText?: string;
	/** 当前是否正在保存加载中 */
	readonly submitting?: boolean;
	/** 表单是否有未保存修改 (用于拦截关闭与离开) */
	readonly isDirty?: boolean;
	/** 内容区最大宽度约束 (默认 'max-w-6xl w-full mx-auto') */
	readonly contentClassName?: string;
	/** 根容器自定义样式 */
	readonly className?: string;
	/** 内部积木组件插槽 */
	readonly children: React.ReactNode;
}

/**
 * 通用复杂单据工作台外壳组件 (DocumentShell)
 * 沉淀自企业级复杂单据开发规范，为“积木拼装型”单据提供统一的外壳：
 * 1. 顶栏 DocumentHeader 吸顶与状态同步；
 * 2. 统一分发 DocumentContext (模式、只读穿透、Subject)；
 * 3. 统一操作区与 AuthGuard 写操作守卫拦截；
 * 4. TabBar 标题联动与未保存离开守卫基础。
 */
export function DocumentShell({
	mode = "create",
	readonly = false,
	subject,
	title,
	description,
	tabTitle,
	documentNumber,
	badge,
	statusBadge,
	slotMiddle,
	slotActions: customSlotActions,
	extraActions,
	backText = "返回",
	onBack,
	backUrl,
	onSave,
	saveText,
	cancelText = "取消",
	submitting = false,
	isDirty: _isDirty = false,
	contentClassName,
	className,
	children,
}: DocumentShellProps) {
	const router = useSafeRouter();
	const isReadonly = readonly || mode === "view";

	// 自动同步当前多页签 TabBar 的标题
	React.useEffect(() => {
		const targetTitle =
			tabTitle || (typeof title === "string" ? title : undefined);
		if (targetTitle) {
			updateTabTitle(targetTitle);
		}
	}, [tabTitle, title]);

	// 统一处理返回行为
	const handleBack = React.useCallback(() => {
		if (onBack) {
			onBack();
			return;
		}
		if (backUrl) {
			router?.push(backUrl);
			return;
		}
		router?.back();
	}, [onBack, backUrl, router]);

	// 广播给深层积木的只读和状态上下文
	const contextValue = React.useMemo<DocumentContextValue>(
		() => ({
			mode,
			isReadonly,
			subject,
			documentNumber,
			isSubmitting: submitting,
		}),
		[mode, isReadonly, subject, documentNumber, submitting],
	);

	// 徽章区渲染
	const headerBadges = (
		<div className="flex items-center gap-1.5 shrink-0">
			{badge ? (
				<Badge
					variant="secondary"
					className="font-mono text-[10px] px-1.5 py-0 h-4 uppercase tracking-wider shrink-0"
				>
					{badge}
				</Badge>
			) : null}

			{documentNumber ? (
				<span className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/60">
					{documentNumber}
				</span>
			) : null}

			{statusBadge}
		</div>
	);

	const defaultSubmitText =
		saveText ||
		(mode === "create" ? "创建保存" : mode === "edit" ? "保存修改" : "保存");

	// 顶部操作区默认渲染（支持 AuthGuard 自动包裹）
	const defaultActions = (
		<div className="flex items-center gap-2">
			{extraActions}

			<Button
				type="button"
				size="sm"
				variant="outline"
				onClick={handleBack}
				disabled={submitting}
				className="h-8 text-xs cursor-pointer"
			>
				{cancelText}
			</Button>

			{!isReadonly && onSave ? (
				subject ? (
					<AuthGuard
						action={mode === "edit" ? "update" : "create"}
						subject={subject}
					>
						<Button
							type="button"
							size="sm"
							variant="default"
							onClick={() => onSave()}
							disabled={submitting}
							className="h-8 text-xs min-w-[5.5rem] cursor-pointer shadow-xs"
						>
							{submitting ? (
								<Loader2 className="size-3.5 mr-1.5 animate-spin" />
							) : (
								<Save className="size-3.5 mr-1.5" />
							)}
							{defaultSubmitText}
						</Button>
					</AuthGuard>
				) : (
					<Button
						type="button"
						size="sm"
						variant="default"
						onClick={() => onSave()}
						disabled={submitting}
						className="h-8 text-xs min-w-[5.5rem] cursor-pointer shadow-xs"
					>
						{submitting ? (
							<Loader2 className="size-3.5 mr-1.5 animate-spin" />
						) : (
							<Save className="size-3.5 mr-1.5" />
						)}
						{defaultSubmitText}
					</Button>
				)
			) : null}
		</div>
	);

	const actions = customSlotActions || defaultActions;

	return (
		<DocumentContext.Provider value={contextValue}>
			<div
				className={cn(
					"flex flex-col min-h-full w-full bg-background text-foreground",
					className,
				)}
			>
				{/* 1. 顶栏 DocumentHeader 吸顶 */}
				<DocumentHeader
					onBack={handleBack}
					backText={backText}
					title={
						description ? (
							<div className="flex flex-col min-w-0 justify-center">
								<span className="truncate">{title}</span>
								<span className="text-[11px] font-normal text-muted-foreground truncate">
									{description}
								</span>
							</div>
						) : (
							title
						)
					}
					badges={headerBadges}
					slotMiddle={slotMiddle}
					slotActions={actions}
					className="sticky top-0 z-20"
				/>

				{/* 2. 下方内容区：容器内自然排版与滚动 */}
				<div
					className={cn(
						"flex-1 p-6 space-y-6 max-w-6xl w-full mx-auto",
						contentClassName,
					)}
				>
					{children}
				</div>
			</div>
		</DocumentContext.Provider>
	);
}
