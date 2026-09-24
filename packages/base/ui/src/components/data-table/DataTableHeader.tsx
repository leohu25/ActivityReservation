"use client";

import React, { type ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface DataTableHeaderProps {
	/** 页面主标题 */
	title: string;
	/** 说明辅文 */
	description?: string;
	/** 标题栏扩展插槽（如：左侧标题与操作按钮之间的分类 Tabs、标签筛选等） */
	slotExtra?: ReactNode;
	/** 右侧操作按钮组插槽 */
	actions?: ReactNode;
	className?: string;
}

/**
 * 一体化工作台标题栏
 * 左侧：纯净标题 + 描述辅文 + 自定义扩展插槽；右侧：全局操作按钮组。
 * 遵循极简高密度工业风，去除冗余视觉噪音。
 */
export function DataTableHeader({
	title,
	description,
	slotExtra,
	actions,
	className,
}: DataTableHeaderProps) {
	return (
		<div
			className={cn(
				"flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border/40 pb-2.5",
				className,
			)}
		>
			<div className="flex min-w-0 items-center gap-4 flex-wrap">
				<h2 className="truncate text-base font-semibold tracking-tight text-foreground shrink-0">
					{title}
				</h2>
				{description ? (
					<p className="text-xs text-muted-foreground">{description}</p>
				) : null}
				{slotExtra ? (
					<div className="flex items-center min-w-0 shrink-0">
						{slotExtra}
					</div>
				) : null}
			</div>
			{actions ? (
				<div className="flex shrink-0 flex-wrap items-center gap-2">
					{actions}
				</div>
			) : null}
		</div>
	);
}
