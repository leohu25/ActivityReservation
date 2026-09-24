"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
	/** 是否开启纵向滚动，默认 true */
	readonly scrollable?: boolean;
	/** 是否保留外层呼吸内衬，默认 true (p-2 md:p-2.5) */
	readonly padded?: boolean;
	/** 最大内容宽度约束 (例如 'max-w-6xl w-full mx-auto') */
	readonly contentClassName?: string;
	readonly children: React.ReactNode;
}

/**
 * 标准业务页面容器 (PageContainer)
 * 采用容器职责倒置 (Container Inversion) 架构规范：
 * - 为标准列表 (DataTable)、看板 (Workbench) 及普通页面提供内敛的边距 (p-2 md:p-2.5) 与内容滚动视口；
 * - 彻底与全屏顶格吸附的 DocumentShell / FormPage 解耦，互不干扰。
 */
export function PageContainer({
	scrollable = true,
	padded = true,
	contentClassName,
	className,
	children,
	...props
}: PageContainerProps) {
	return (
		<div
			className={cn(
				"min-w-0 flex-1 flex flex-col",
				scrollable ? "overflow-y-auto" : "overflow-hidden",
				padded ? "p-2 md:p-2.5 gap-2" : "",
				className,
			)}
			{...props}
		>
			{contentClassName ? (
				<div className={cn("min-w-0 flex-1 flex flex-col", contentClassName)}>
					{children}
				</div>
			) : (
				children
			)}
		</div>
	);
}
