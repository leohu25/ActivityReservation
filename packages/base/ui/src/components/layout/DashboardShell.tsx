"use client";

import * as React from "react";
import { SidebarProvider, SidebarInset } from "../ui/sidebar";
import { TabBar, type TabItem } from "./TabBar";
import { BreadcrumbBar } from "./BreadcrumbBar";
import type { NavSection } from "./Sidebar";

export interface DashboardShellProps {
	readonly children: React.ReactNode;
	readonly header: React.ReactNode;
	readonly sidebar: React.ReactNode;
	/** 默认固定展示的首页标签，传 null 表示无常驻固定首页标签 */
	readonly homeTab?: TabItem | null;
	/** 授权导航菜单，用于 TabBar 与 BreadcrumbBar 自动提取页面名称与拓扑链路 */
	readonly navSections?: readonly NavSection[];
	/** 是否隐藏顶部多标签页，默认 false */
	readonly hideTabBar?: boolean;
	/** 是否隐藏面包屑，默认 true (采用现代 ERP 页签二选一范式) */
	readonly hideBreadcrumbs?: boolean;
}

/**
 * ERP 统一后台主容器 Shell
 * 基于官方 shadcn SidebarProvider + SidebarInset 组合，
 * 内置多标签页切换栏 (TabBar) 与动态层级面包屑导航 (BreadcrumbBar)。
 */
export function DashboardShell({
	children,
	header,
	sidebar,
	homeTab,
	navSections = [],
	hideTabBar = false,
	hideBreadcrumbs = true,
}: DashboardShellProps) {
	// 若 header 自身尚未注入 centerSlot 且未隐藏 TabBar，则作为兜底自动挂载
	const renderedHeader =
		React.isValidElement(header) &&
		!hideTabBar &&
		(header.props as { centerSlot?: React.ReactNode }).centerSlot === undefined
			? React.cloneElement(
					header as React.ReactElement<{ centerSlot?: React.ReactNode }>,
					{
						centerSlot: (
							<TabBar homeTab={homeTab} sections={navSections} embedded={true} />
						),
					},
				)
			: header;

	return (
		<SidebarProvider
			style={{ "--sidebar-width": "13.5rem" } as React.CSSProperties}
			className="h-svh overflow-hidden"
		>
			<div className="flex h-svh w-full flex-col bg-background font-sans text-foreground overflow-hidden">
				{renderedHeader}
				<div className="flex min-h-0 flex-1 overflow-hidden">
					{sidebar}
					<SidebarInset key="sidebar-inset" className="min-w-0 flex-1 flex flex-col overflow-hidden bg-background">
						<div className="min-w-0 flex-1 overflow-y-auto p-2 md:p-2.5 flex flex-col gap-2">
							{!hideBreadcrumbs ? (
								<div key="breadcrumb-bar" className="pb-1">
									<BreadcrumbBar sections={navSections} />
								</div>
							) : null}
							<div key="page-content" className="min-w-0 flex-1">{children}</div>
						</div>
					</SidebarInset>
				</div>
			</div>
		</SidebarProvider>
	);
}
