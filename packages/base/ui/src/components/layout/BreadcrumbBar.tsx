"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { cn } from "../../lib/utils";
import type { NavSection, NavItem } from "./Sidebar";

export interface BreadcrumbBarProps {
	/** 显式传入的面包屑项；未传时可依据 navSections 与 pathname 自动推导 */
	readonly items?: readonly { label: string; href?: string }[];
	/** 导航菜单定义，用于根据 pathname 自动逆向推导面包屑层级 */
	readonly sections?: readonly NavSection[];
	readonly className?: string;
}

interface PathMatch {
	label: string;
	href?: string;
}

/** 递归查找当前 pathname 命中的面包屑链路 */
function findBreadcrumbsFromSections(
	sections: readonly NavSection[],
	pathname: string,
): PathMatch[] {
	for (const section of sections) {
		for (const item of section.items) {
			const match = searchItem(
				item,
				pathname,
				section.title ? [{ label: section.title }] : [],
			);
			if (match) return match;
		}
	}
	return [];
}

function searchItem(
	item: NavItem,
	pathname: string,
	currentPath: PathMatch[],
): PathMatch[] | null {
	const nextSubItems = item.items || item.children;
	const pathWithSelf = [...currentPath, { label: item.label, href: item.href }];

	if (
		item.href &&
		(item.href === pathname || pathname.startsWith(`${item.href}/`))
	) {
		return pathWithSelf;
	}

	if (nextSubItems && nextSubItems.length > 0) {
		for (const sub of nextSubItems) {
			const found = searchItem(sub, pathname, pathWithSelf);
			if (found) return found;
		}
	}

	return null;
}

/**
 * 统一面包屑导航条 (BreadcrumbBar)
 * 基于 shadcn Base UI 原生 Breadcrumb 规范。
 */
export function BreadcrumbBar({
	items: explicitItems,
	sections,
	className,
}: BreadcrumbBarProps) {
	const pathname = usePathname();

	const resolvedItems = useMemo(() => {
		if (explicitItems && explicitItems.length > 0) {
			return explicitItems;
		}
		if (sections && sections.length > 0 && pathname) {
			const autoMatches = findBreadcrumbsFromSections(sections, pathname);
			if (autoMatches.length > 0) return autoMatches;
		}
		// 兜底降级：根据 pathname 分段简单展示
		if (!pathname || pathname === "/") {
			return [{ label: "工作台", href: "/workbench" }];
		}
		const parts = pathname.split("/").filter(Boolean);
		return [
			{ label: "首页", href: "/workbench" },
			...parts.map((p, idx) => ({
				label: p,
				href:
					idx === parts.length - 1
						? undefined
						: `/${parts.slice(0, idx + 1).join("/")}`,
			})),
		];
	}, [explicitItems, sections, pathname]);

	return (
		<Breadcrumb className={cn("text-xs", className)}>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink
						render={
							<Link
								href="/workbench"
								className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
							>
								<Home className="size-3.5" />
								<span className="sr-only">工作台</span>
							</Link>
						}
					/>
				</BreadcrumbItem>
				{resolvedItems.map((item, index) => {
					const isLast = index === resolvedItems.length - 1;
					return (
						<React.Fragment key={`${item.label}-${index}`}>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								{isLast || !item.href ? (
									<BreadcrumbPage className="font-medium text-foreground">
										{item.label}
									</BreadcrumbPage>
								) : (
									<BreadcrumbLink
										render={
											<Link
												href={item.href}
												className="text-muted-foreground transition-colors hover:text-foreground"
											>
												{item.label}
											</Link>
										}
									/>
								)}
							</BreadcrumbItem>
						</React.Fragment>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
