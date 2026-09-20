"use client";

import React, { type ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, ChevronDown } from "lucide-react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "../ui/collapsible";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "../ui/hover-card";
import {
	Sidebar as SidebarRoot,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	useSidebar,
} from "../ui/sidebar";
import { cn } from "../../lib/utils";
import { ThemeToggle } from "../ThemeToggle";
import { DynamicNavIcon } from "../icon";

/** 单个导航项模型（支持普通叶子链接、外链或带子项的折叠分组） */
export interface NavItem {
	readonly id: string;
	readonly label: string;
	readonly icon?: ReactNode | string;
	readonly href?: string;
	readonly category?: string;
	readonly badge?: string;
	/** 链接打开方式，例如 '_blank' 在新标签页打开 */
	readonly target?: "_blank" | "_self" | string;
	/** 是否为外部链接 */
	readonly isExternal?: boolean;
	readonly requiredAction?: string;
	readonly requiredSubject?: string;
	readonly items?: readonly NavItem[];
	readonly children?: readonly NavItem[];
}

function isLinkExternal(item: {
	readonly href?: string;
	readonly target?: string;
	readonly isExternal?: boolean;
}): boolean {
	if (item.target === "_blank" || item.isExternal) return true;
	if (item.href && /^https?:\/\//i.test(item.href)) return true;
	return false;
}

function renderNavIcon(
	icon: ReactNode | string | undefined,
	fallbackType: "group" | "page" | "external" = "page",
): ReactNode {
	if (!icon) {
		return <DynamicNavIcon fallbackType={fallbackType} />;
	}
	if (typeof icon === "string") {
		return <DynamicNavIcon name={icon} fallbackType={fallbackType} />;
	}
	return icon;
}

/** 导航分组区块模型 (如业务中心、系统管理) */
export interface NavSection {
	readonly id: string;
	readonly title?: string;
	readonly items: readonly NavItem[];
}

export interface SidebarProps {
	readonly sections?: readonly NavSection[];
	readonly navItems?: readonly NavItem[];
	/** 可选：仅在非 Next.js 路由测试环境或需要强制受控路由时指定，生产中默认自动读取 usePathname() */
	readonly currentPath?: string;
	readonly can?: (action: string, subject: string) => boolean;
	/** 允许的服务端序列化权限规则数组或白名单 key 集合 */
	readonly allowedPermissions?: readonly string[];
}

function isItemVisible(
	item: NavItem,
	can?: (action: string, subject: string) => boolean,
	allowedPermissionsSet?: Set<string>,
): boolean {
	if (item.requiredAction && item.requiredSubject) {
		if (can && !can(item.requiredAction, item.requiredSubject)) {
			return false;
		}
		if (
			allowedPermissionsSet &&
			!allowedPermissionsSet.has(
				`${item.requiredAction}:${item.requiredSubject}`,
			)
		) {
			return false;
		}
	}

	const subItems = item.items ?? item.children;
	if (subItems && subItems.length > 0) {
		return subItems.some((child) =>
			isItemVisible(child, can, allowedPermissionsSet),
		);
	}

	return true;
}

function filterVisibleItems(
	items: readonly NavItem[],
	can?: (action: string, subject: string) => boolean,
	allowedPermissionsSet?: Set<string>,
): NavItem[] {
	const result: NavItem[] = [];

	for (const item of items) {
		if (!isItemVisible(item, can, allowedPermissionsSet)) {
			continue;
		}

		const subItems = item.items ?? item.children;
		if (subItems && subItems.length > 0) {
			const visibleSubItems = filterVisibleItems(
				subItems,
				can,
				allowedPermissionsSet,
			);
			result.push({
				...item,
				items: visibleSubItems,
				children: visibleSubItems,
			});
		} else {
			result.push(item);
		}
	}

	return result;
}

function isPathActive(currentPath: string, targetHref?: string): boolean {
	if (!targetHref) {
		return false;
	}
	if (targetHref === "/") {
		return currentPath === "/";
	}
	return currentPath === targetHref || currentPath.startsWith(targetHref + "/");
}

function hasActiveChild(item: NavItem, currentPath: string): boolean {
	const subItems = item.items ?? item.children;
	if (!subItems || subItems.length === 0) {
		return false;
	}
	return subItems.some((child) => isPathActive(currentPath, child.href));
}

/**
 * 悬浮层子菜单链接
 * 禁用 SidebarMenuSubButton（自带 group-data-[collapsible=icon]:hidden，折叠态会把内容藏掉）。
 */
function FlyoutMenuLinks({
	subItems,
	currentPath,
}: {
	subItems: readonly NavItem[];
	currentPath: string;
}) {
	return (
		<>
			{subItems.map((child) => {
				const active = isPathActive(currentPath, child.href);
				const external = isLinkExternal(child);
				return external ? (
					<a
						key={child.id}
						href={child.href ?? "#"}
						target="_blank"
						rel="noopener noreferrer"
						className={cn(
							"flex h-8 min-w-0 items-center gap-2 rounded-md px-2 text-sm transition-colors",
							"hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground",
						)}
					>
						{renderNavIcon(child.icon, "external")}
						<span className="truncate">{child.label}</span>
						{child.badge ? (
							<span className="ml-auto text-[10px] font-normal text-muted-foreground">
								{child.badge}
							</span>
						) : null}
					</a>
				) : (
					<Link
						key={child.id}
						href={child.href ?? "#"}
						className={cn(
							"flex h-8 min-w-0 items-center gap-2 rounded-md px-2 text-sm transition-colors",
							"hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
							active
								? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
								: "text-sidebar-foreground",
						)}
					>
						{renderNavIcon(child.icon, "page")}
						<span className="truncate">{child.label}</span>
						{child.badge ? (
							<span className="ml-auto text-[10px] font-normal text-muted-foreground">
								{child.badge}
							</span>
						) : null}
					</Link>
				);
			})}
		</>
	);
}

/** 分组导航项：展开态 Collapsible；折叠态 HoverCard 悬浮菜单 */
function NavGroupItem({
	item,
	currentPath,
	open,
	onOpenChange,
}: {
	item: NavItem;
	currentPath: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { state } = useSidebar();
	const childActive = hasActiveChild(item, currentPath);
	const subItems = item.items ?? item.children ?? [];

	if (state === "collapsed") {
		return (
			<SidebarMenuItem>
				<HoverCard>
					<HoverCardTrigger
						delay={50}
						closeDelay={150}
						render={<SidebarMenuButton isActive={childActive} />}
					>
						{renderNavIcon(item.icon, "group")}
						<span className="group-data-[collapsible=icon]:hidden">
							{item.label}
						</span>
					</HoverCardTrigger>
					<HoverCardContent
						side="right"
						align="start"
						sideOffset={10}
						className="max-h-[min(28rem,calc(100svh-2rem))] w-56 overflow-y-auto rounded-lg border border-sidebar-border bg-popover p-2 shadow-lg"
					>
						<div className="mb-1 px-2 py-1.5 text-xs font-semibold text-muted-foreground">
							{item.label}
						</div>
						<div className="flex min-w-0 flex-col gap-0.5">
							<FlyoutMenuLinks subItems={subItems} currentPath={currentPath} />
						</div>
					</HoverCardContent>
				</HoverCard>
				{item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
			</SidebarMenuItem>
		);
	}

	return (
		<Collapsible
			open={open}
			onOpenChange={onOpenChange}
			className="group/collapsible"
		>
			<SidebarMenuItem>
				<CollapsibleTrigger
					render={
						<SidebarMenuButton isActive={childActive} tooltip={item.label} />
					}
				>
					{renderNavIcon(item.icon, "group")}
					<span>{item.label}</span>
					<ChevronDown className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-180" />
				</CollapsibleTrigger>
				{item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
				<CollapsibleContent>
					<SidebarMenuSub>
						{subItems.map((child) => {
							const external = isLinkExternal(child);
							return (
								<SidebarMenuSubItem key={child.id}>
									<SidebarMenuSubButton
										render={
											external ? (
												<a
													href={child.href ?? "#"}
													target="_blank"
													rel="noopener noreferrer"
												/>
											) : (
												<Link href={child.href ?? "#"} />
											)
										}
										isActive={isPathActive(currentPath, child.href)}
									>
										{renderNavIcon(child.icon, external ? "external" : "page")}
										<span className="truncate">{child.label}</span>
										{child.badge ? (
											<span className="ml-auto text-[10px] font-normal text-muted-foreground">
												{child.badge}
											</span>
										) : null}
									</SidebarMenuSubButton>
								</SidebarMenuSubItem>
							);
						})}
					</SidebarMenuSub>
				</CollapsibleContent>
			</SidebarMenuItem>
		</Collapsible>
	);
}

/**
 * ERP 统一后台左侧导航
 * 基于官方 shadcn Sidebar / SidebarMenu / Collapsible / HoverCard 组合。
 */
export function Sidebar({
	sections,
	navItems,
	currentPath: propCurrentPath,
	can,
	allowedPermissions,
}: SidebarProps) {
	const { state } = useSidebar();
	const isCollapsed = state === "collapsed";
	const allowedPermissionsSet = allowedPermissions
		? new Set(allowedPermissions)
		: undefined;

	const routerPath = usePathname();
	const currentPath = propCurrentPath ?? routerPath ?? "";

	const effectiveSections: readonly NavSection[] =
		sections ?? (navItems ? [{ id: "custom", items: navItems }] : []);

	const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(
		{},
	);

	useEffect(() => {
		if (!currentPath) return;
		setOpenGroups((prev) => {
			const next = { ...prev };
			for (const section of effectiveSections) {
				for (const item of section.items) {
					if (hasActiveChild(item, currentPath)) {
						next[item.id] = true;
					}
				}
			}
			return next;
		});
	}, [currentPath, effectiveSections]);

	const renderNavItem = (item: NavItem) => {
		const subItems = item.items ?? item.children;
		const isGroup = Boolean(subItems && subItems.length > 0);

		if (isGroup) {
			return (
				<NavGroupItem
					key={item.id}
					item={item}
					currentPath={currentPath}
					open={openGroups[item.id] ?? hasActiveChild(item, currentPath)}
					onOpenChange={(next) =>
						setOpenGroups((prev) => ({
							...prev,
							[item.id]: next,
						}))
					}
				/>
			);
		}

		const isActive = isPathActive(currentPath, item.href);
		const external = isLinkExternal(item);

		return (
			<SidebarMenuItem key={item.id}>
				<SidebarMenuButton
					render={
						external ? (
							<a
								href={item.href ?? "#"}
								target="_blank"
								rel="noopener noreferrer"
							/>
						) : (
							<Link href={item.href ?? "#"} />
						)
					}
					isActive={isActive}
					tooltip={item.label}
				>
					{renderNavIcon(item.icon, external ? "external" : "page")}
					<span>{item.label}</span>
				</SidebarMenuButton>
				{item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
			</SidebarMenuItem>
		);
	};

	// 折叠态：摊平为单条连续菜单，避免多个 SidebarGroup 的 p-2 叠出不均间距
	const flattenedItems = isCollapsed
		? effectiveSections.flatMap((section) =>
				filterVisibleItems(section.items, can, allowedPermissionsSet),
			)
		: [];

	return (
		<SidebarRoot
			collapsible="icon"
			className="top-12 h-[calc(100svh-3rem)] border-r"
		>
			<SidebarHeader className="h-9 justify-center p-0 px-2.5 border-b border-sidebar-border/70">
				<div className="flex items-center gap-1.5 px-0.5 text-xs font-bold tracking-wider text-muted-foreground uppercase group-data-[collapsible=icon]:hidden">
					<Layers className="size-3.5 shrink-0" />
					<span>核心功能导航</span>
				</div>
				<div className="hidden size-full items-center justify-center group-data-[collapsible=icon]:flex">
					<Layers className="size-4 text-muted-foreground" />
				</div>
			</SidebarHeader>

			<SidebarContent>
				{isCollapsed ? (
					<SidebarGroup className="group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-1">
						<SidebarMenu className="group-data-[collapsible=icon]:gap-0.5">
							{flattenedItems.map(renderNavItem)}
						</SidebarMenu>
					</SidebarGroup>
				) : (
					effectiveSections.map((section) => {
						const visibleItems = filterVisibleItems(
							section.items,
							can,
							allowedPermissionsSet,
						);
						if (visibleItems.length === 0) {
							return null;
						}

						return (
							<SidebarGroup key={section.id}>
								{section.title ? (
									<SidebarGroupLabel className="text-[11px] font-bold tracking-wider uppercase">
										{section.title}
									</SidebarGroupLabel>
								) : null}
								<SidebarGroupContent>
									<SidebarMenu>{visibleItems.map(renderNavItem)}</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						);
					})
				)}
			</SidebarContent>

			<SidebarFooter className="border-t border-sidebar-border/60">
				<div className="flex items-center justify-between gap-2 px-1 py-1 group-data-[collapsible=icon]:hidden">
					<span className="text-xs font-medium text-muted-foreground">
						外观
					</span>
					<ThemeToggle />
				</div>
			</SidebarFooter>
		</SidebarRoot>
	);
}
