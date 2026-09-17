"use client";

import React, { type ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface DataTableToolbarProps {
	children: ReactNode;
	/** 对齐方式：end（默认，操作组靠右）| start | between */
	align?: "start" | "end" | "between";
	className?: string;
}

/**
 * 全局操作按钮组容器
 * 统一按钮间距与高度节奏，主操作与次级操作可自由混排。
 */
export function DataTableToolbar({
	children,
	align = "end",
	className,
}: DataTableToolbarProps) {
	return (
		<div
			className={cn(
				"flex flex-wrap items-center gap-2",
				align === "end" && "justify-end",
				align === "start" && "justify-start",
				align === "between" && "justify-between",
				className,
			)}
		>
			{children}
		</div>
	);
}

export const TableToolbar = DataTableToolbar;
export type TableToolbarProps = DataTableToolbarProps;
