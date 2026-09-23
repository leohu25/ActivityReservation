import type * as React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

export interface DocumentHeaderProps {
	/** 返回上一级路由/页面回调 */
	readonly onBack?: () => void;
	/** 返回按钮文本，默认 '返回' */
	readonly backText?: string;
	/** 单据主标题 */
	readonly title: React.ReactNode;
	/** 紧随主标题的状态徽章插槽 (如：默认BOM、已发布、草稿等) */
	readonly badges?: React.ReactNode;
	/** 标题后方的中间扩展插槽：新增时用于注入单据类型切换器，编辑/详情时用于回显类型或元信息 */
	readonly slotMiddle?: React.ReactNode;
	/** 右侧操作动作插槽 (如：取消、保存草稿、发布、编辑等操作按钮组) */
	readonly slotActions?: React.ReactNode;
	readonly className?: string;
}

/**
 * 通用单据页顶栏导航组件 (DocumentHeader)
 * 沉淀自企业级复杂单据工作台规范，具备通栏顶格吸附、紧凑高度规范 (48px) 与高度可扩展的语义化插槽。
 */
export function DocumentHeader({
	onBack,
	backText = "返回",
	title,
	badges,
	slotMiddle,
	slotActions,
	className,
}: DocumentHeaderProps) {
	return (
		<div
			className={cn(
				"h-12 shrink-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/80 px-4 flex items-center justify-between shadow-2xs select-none",
				className,
			)}
		>
			{/* 左侧：返回按钮 + 垂直分割线 + 单据标题 + 状态徽章 + 中间注入插槽 */}
			<div className="flex items-center gap-3 min-w-0">
				{onBack && (
					<>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={onBack}
							className="h-7.5 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0 transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer"
						>
							<ArrowLeft className="size-3.5" /> {backText}
						</Button>
						<div className="h-4 w-px bg-border shrink-0" />
					</>
				)}

				<div className="flex items-center gap-2.5 min-w-0">
					<div className="text-sm font-bold text-foreground truncate">
						{title}
					</div>
					{badges && (
						<div className="flex items-center gap-1.5 shrink-0">{badges}</div>
					)}
				</div>

				{/* 预留插槽：支持类型分段切换或回显预览 */}
				{slotMiddle && (
					<div className="flex items-center gap-2 pl-1 shrink-0">
						{slotMiddle}
					</div>
				)}
			</div>

			{/* 右侧：单据操作按钮区插槽 */}
			{slotActions && (
				<div className="flex items-center gap-2 shrink-0">{slotActions}</div>
			)}
		</div>
	);
}
