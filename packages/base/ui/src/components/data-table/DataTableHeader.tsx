"use client";

import React, { type ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface DataTableHeaderProps {
	/** 页面主标题 */
	title: string;
	/** 说明辅文 */
	description?: string;
	/** 右侧操作按钮组插槽 */
	actions?: ReactNode;
	className?: string;
}

/**
 * 一体化工作台标题栏
 * 左侧：纯净标题 + 描述辅文；右侧：全局操作按钮组。
 * 遵循极简高密度工业风，去除冗余视觉噪音。
 */
export function DataTableHeader({
	title,
	description,
	actions,
	className,
}: DataTableHeaderProps) {
	return (
		<div
			className={cn(
				"flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border/40 pb-3",
				className,
			)}
		>
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<h2 className="truncate text-base font-semibold tracking-tight text-foreground">
					{title}
				</h2>
				{description ? (
					<p className="text-xs text-muted-foreground">{description}</p>
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
