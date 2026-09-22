"use client";

import type React from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	X,
	RotateCw,
	ArrowRightToLine,
	ArrowLeftToLine,
	CircleOff,
	ChevronLeft,
	ChevronRight,
	ChevronDown,
	LayoutDashboard,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useSafeRouter } from "../../lib/use-safe-router";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "../ui/context-menu";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import type { NavSection, NavItem } from "./Sidebar";

export interface TabItem {
	readonly title: string;
	readonly path: string;
	readonly closable?: boolean;
}

export interface TabUpdateEventDetail {
	readonly path?: string;
	readonly title: string;
}

export interface TabCloseEventDetail {
	readonly path?: string;
	readonly redirectTo?: string;
}

/** 供客户端页面主动通知 TabBar 更新指定/当前页签标题 */
export function updateTabTitle(title: string, path?: string): void {
	if (typeof window === "undefined") return;
	window.dispatchEvent(
		new CustomEvent<TabUpdateEventDetail>("cr:tab:update", {
			detail: { path, title },
		}),
	);
}

/** 供客户端页面主动通知 TabBar 关闭指定/当前页签，并可选跳至目标路由 */
export function closeCurrentTab(options?: {
	path?: string;
	redirectTo?: string;
}): void {
	if (typeof window === "undefined") return;
	const currentPath =
		options?.path ||
		window.location.pathname;
	window.dispatchEvent(
		new CustomEvent<TabCloseEventDetail>("cr:tab:close", {
			detail: {
				path: currentPath,
				redirectTo: options?.redirectTo,
			},
		}),
	);
}

export interface TabBarProps {
	/** 默认固定展示的首页标签，传 null 表示无常驻固定首页标签 */
	readonly homeTab?: TabItem | null;
	/** 用于根据 pathname 自动匹配标签名称的导航配置 */
	readonly sections?: readonly NavSection[];
	readonly className?: string;
}

const STORAGE_KEY = "cr_dashboard_opened_tabs";

function findTitleByPath(
	sections: readonly NavSection[],
	path: string,
): string | null {
	for (const s of sections) {
		for (const item of s.items) {
			const match = searchTitle(item, path);
			if (match) return match;
		}
	}
	return null;
}

function searchTitle(item: NavItem, path: string): string | null {
	// 严格精确匹配：只有当 item.href 与 path 完全一致时，才采用菜单 label 作为标签名
	// 若 path 是深层子路由（如 /customer/customers/cmup9evyk），绝不贪婪截断为父级菜单名，交由页面内部动态设置或兜底标题
	if (item.href && item.href === path) {
		return item.label;
	}
	const subs = item.items || item.children;
	if (subs) {
		for (const sub of subs) {
			const found = searchTitle(sub, path);
			if (found) return found;
		}
	}
	return null;
}

const DEFAULT_HOME_TAB: TabItem = {
	title: "工作台",
	path: "/workbench",
	closable: false,
};

/**
 * ERP 现代化多标签页管理导航栏 (TabBar)
 * 具备以下特性：
 * 1. 紧凑精细的视觉美化与清晰状态；
 * 2. 彻底隐藏丑陋的系统原生横向滚动条；
 * 3. 自动检测溢出与平滑自动移位：切换路由或点击两侧标签时自动将对应标签居中平滑卷入视口；
 * 4. 滚轮支持横向无感滚动；
 * 5. 溢出时提供微型左右翻页箭头按钮；
 * 6. 完整的右键菜单与更多操作下拉：支持重新加载、关闭当前、关闭其他、关闭右侧、关闭左侧、关闭全部。
 */
export function TabBar({
	homeTab = DEFAULT_HOME_TAB,
	sections = [],
	className,
}: TabBarProps) {
	const rawPathname = usePathname();
	const pathname = rawPathname ?? "";
	const router = useSafeRouter();

	const initialTabs = homeTab ? [homeTab] : [];
	const [tabs, setTabs] = useState<TabItem[]>(initialTabs);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);
	const [isOverflowing, setIsOverflowing] = useState(false);

	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const tabElementsRef = useRef<Map<string, HTMLElement>>(new Map());

	// 持久化保存
	const persistTabs = useCallback((newTabs: TabItem[]) => {
		try {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newTabs));
		} catch {
			// ignore
		}
	}, []);

	// 关闭单个标签（安全纯函数状态计算 + 微任务异步导航，彻底杜绝 setState-in-render 冲突）
	const closeTab = useCallback(
		(targetPath: string, redirectTo?: string) => {
			let nextRoute: string | null = null;
			const cleanTarget = (targetPath || pathname).split("?")[0].split("#")[0];

			setTabs((prev) => {
				const index = prev.findIndex((t) => {
					const cleanTab = t.path.split("?")[0].split("#")[0];
					return cleanTab === cleanTarget;
				});
				if (index === -1) return prev;
				const target = prev[index];
				if (target && !target.closable) return prev;

				const next = prev.filter((_, i) => i !== index);
				persistTabs(next);

				// 如果关闭的是当前激活标签，则导航至目标路由或相邻标签
				const cleanCurrent = pathname.split("?")[0].split("#")[0];
				if (cleanCurrent === cleanTarget) {
					if (redirectTo) {
						nextRoute = redirectTo;
					} else {
						const fallbackTab = homeTab ?? next[0];
						const nextActive = next[index] ?? next[index - 1] ?? fallbackTab;
						if (nextActive) {
							nextRoute = nextActive.path;
						}
					}
				}
				return next;
			});

			if (nextRoute) {
				const dest = nextRoute;
				queueMicrotask(() => {
					router?.push(dest);
					router?.refresh();
				});
			}
		},
		[pathname, router, homeTab, persistTabs],
	);

	// 关闭其他标签
	const closeOtherTabs = useCallback(
		(targetPath: string) => {
			let shouldNavigate = false;

			setTabs((prev) => {
				const target = prev.find((t) => t.path === targetPath);
				if (!target) return prev;

				const next = homeTab
					? (target.path === homeTab.path ? [homeTab] : [homeTab, target])
					: [target];
				persistTabs(next);

				if (pathname !== targetPath && (!homeTab || pathname !== homeTab.path)) {
					shouldNavigate = true;
				}
				return next;
			});

			if (shouldNavigate) {
				queueMicrotask(() => {
					router?.push(targetPath);
				});
			}
		},
		[pathname, router, homeTab, persistTabs],
	);

	// 关闭右侧标签
	const closeRightTabs = useCallback(
		(targetPath: string) => {
			let shouldNavigate = false;

			setTabs((prev) => {
				const index = prev.findIndex((t) => t.path === targetPath);
				if (index === -1) return prev;

				const next = prev.slice(0, index + 1);
				persistTabs(next);

				const currentStillExists = next.some((t) => t.path === pathname);
				if (!currentStillExists) {
					shouldNavigate = true;
				}
				return next;
			});

			if (shouldNavigate) {
				queueMicrotask(() => {
					router?.push(targetPath);
				});
			}
		},
		[pathname, router, persistTabs],
	);

	// 关闭左侧标签
	const closeLeftTabs = useCallback(
		(targetPath: string) => {
			let shouldNavigate = false;

			setTabs((prev) => {
				const index = prev.findIndex((t) => t.path === targetPath);
				if (index === -1) return prev;

				const rightPart = prev.slice(index);
				const next = homeTab
					? (rightPart.some((t) => t.path === homeTab.path)
						? rightPart
						: [homeTab, ...rightPart.filter((t) => t.path !== homeTab.path)])
					: rightPart;

				persistTabs(next);

				const currentStillExists = next.some((t) => t.path === pathname);
				if (!currentStillExists) {
					shouldNavigate = true;
				}
				return next;
			});

			if (shouldNavigate) {
				queueMicrotask(() => {
					router?.push(targetPath);
				});
			}
		},
		[pathname, router, homeTab, persistTabs],
	);

	// 关闭所有标签 (仅保留 homeTab 或当前活动页)
	const closeAllTabs = useCallback(() => {
		let nextRoute: string | null = null;

		if (homeTab) {
			const next = [homeTab];
			setTabs(next);
			persistTabs(next);
			if (pathname !== homeTab.path) {
				nextRoute = homeTab.path;
			}
		} else {
			setTabs((prev) => {
				const current = prev.find((t) => t.path === pathname) ?? prev[0];
				const next = current ? [current] : [];
				persistTabs(next);
				return next;
			});
		}

		if (nextRoute) {
			const dest = nextRoute;
			queueMicrotask(() => {
				router?.push(dest);
			});
		}
	}, [homeTab, pathname, router, persistTabs]);

	// 刷新当前页面
	const refreshTab = useCallback(
		(targetPath?: string) => {
			if (targetPath && targetPath !== pathname) {
				router?.push(targetPath);
			}
			router?.refresh();
		},
		[pathname, router],
	);

	// 初始化从 sessionStorage 读取历史标签页
	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			const saved = sessionStorage.getItem(STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved) as TabItem[];
				if (Array.isArray(parsed) && parsed.length > 0) {
					if (homeTab) {
						// 确保包含 homeTab 且排在首位
						const hasHome = parsed.some((t) => t.path === homeTab.path);
						const normalized = hasHome
							? parsed
							: [homeTab, ...parsed.filter((t) => t.path !== homeTab.path)];
						setTabs(normalized);
						return;
					} else {
						// 若无固定 homeTab，直接恢复已保存的有效标签
						setTabs(parsed);
						return;
					}
				}
			}
		} catch {
			// ignore
		}
	}, [homeTab]);

	// 路由变化时自动记录/同步标签
	useEffect(() => {
		if (!pathname || pathname === "/login") return;

		setTabs((prev) => {
			const exists = prev.some((t) => t.path === pathname);
			if (exists) return prev;

			let title = findTitleByPath(sections, pathname);
			if (!title) {
				if (pathname.endsWith("/new")) {
					const parentPath = pathname.replace(/\/new$/, "");
					const parentTitle = findTitleByPath(sections, parentPath);
					title = parentTitle
						? `新建${parentTitle.replace(/管理|档案$/, "")}`
						: "新建单据";
				} else {
					title = pathname.split("/").pop() || "新标签";
				}
			}
			const closable = homeTab ? pathname !== homeTab.path : true;
			const next = [
				...prev,
				{ title, path: pathname, closable },
			];
			persistTabs(next);
			return next;
		});
	}, [pathname, sections, homeTab, persistTabs]);

	// 支持业务页面主动触发标题更新与安全关闭页签
	useEffect(() => {
		if (typeof window === "undefined") return;

		const handleUpdateTab = (event: Event) => {
			const customEvent = event as CustomEvent<TabUpdateEventDetail>;
			if (!customEvent.detail || !customEvent.detail.title) return;
			const targetPath = customEvent.detail.path || pathname;

			setTabs((prev) => {
				const next = prev.map((t) =>
					t.path === targetPath ? { ...t, title: customEvent.detail.title } : t,
				);
				persistTabs(next);
				return next;
			});
		};

		const handleCloseTab = (event: Event) => {
			const customEvent = event as CustomEvent<TabCloseEventDetail>;
			const targetPath = customEvent.detail?.path || pathname;
			const redirectTo = customEvent.detail?.redirectTo;
			closeTab(targetPath, redirectTo);
		};

		window.addEventListener("cr:tab:update", handleUpdateTab);
		window.addEventListener("cr:tab:close", handleCloseTab);
		return () => {
			window.removeEventListener("cr:tab:update", handleUpdateTab);
			window.removeEventListener("cr:tab:close", handleCloseTab);
		};
	}, [pathname, persistTabs, closeTab]);

	// 检测横向滚动状态与是否溢出
	const checkScroll = useCallback(() => {
		const el = scrollContainerRef.current;
		if (!el) return;
		const overflowing = el.scrollWidth > el.clientWidth + 4;
		setIsOverflowing(overflowing);
		setCanScrollLeft(el.scrollLeft > 4);
		setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
	}, []);

	useEffect(() => {
		checkScroll();
		const el = scrollContainerRef.current;
		if (!el) return;

		const observer = new ResizeObserver(() => {
			checkScroll();
		});
		observer.observe(el);

		window.addEventListener("resize", checkScroll);
		return () => {
			observer.disconnect();
			window.removeEventListener("resize", checkScroll);
		};
	}, [checkScroll, tabs]);

	// 平滑将指定标签滚动到视口内部
	const scrollTabIntoView = useCallback((tabEl: HTMLElement) => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const containerRect = container.getBoundingClientRect();
		const tabRect = tabEl.getBoundingClientRect();

		if (tabRect.left < containerRect.left) {
			container.scrollBy({
				left: tabRect.left - containerRect.left - 16,
				behavior: "smooth",
			});
		} else if (tabRect.right > containerRect.right) {
			container.scrollBy({
				left: tabRect.right - containerRect.right + 16,
				behavior: "smooth",
			});
		}
	}, []);

	// 激活标签切换时自动滑动到位
	useEffect(() => {
		if (!pathname) return;
		const activeEl = tabElementsRef.current.get(pathname);
		if (activeEl) {
			const timer = setTimeout(() => {
				scrollTabIntoView(activeEl);
			}, 50);
			return () => clearTimeout(timer);
		}
	}, [pathname, tabs, scrollTabIntoView]);

	// 鼠标滚轮横向滚动支持
	const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
		const container = scrollContainerRef.current;
		if (!container || !isOverflowing) return;
		if (e.deltaY !== 0 || e.deltaX !== 0) {
			const delta =
				Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
			container.scrollLeft += delta;
			checkScroll();
		}
	};

	const handleScrollBy = (offset: number) => {
		scrollContainerRef.current?.scrollBy({ left: offset, behavior: "smooth" });
	};

	const currentTabIndex = tabs.findIndex((t) => t.path === pathname);
	const currentTab = tabs[currentTabIndex];

	return (
		<div
			className={cn(
				"relative flex h-9 w-full items-center border-b border-border/70 bg-muted/25 px-1.5 select-none shrink-0 gap-1",
				className,
			)}
		>
			{/* 溢出时左平移按钮 */}
			{isOverflowing ? (
				<button
					type="button"
					onClick={() => handleScrollBy(-180)}
					disabled={!canScrollLeft}
					className="flex size-7 items-center justify-center rounded-sm text-muted-foreground/70 hover:bg-muted hover:text-foreground disabled:opacity-20 disabled:pointer-events-none transition-colors shrink-0"
					title="向左滚动标签"
					aria-label="向左滚动标签"
				>
					<ChevronLeft className="size-3.5" />
				</button>
			) : null}

			{/* 页签滚动主视口 (完全隐藏原生滚动条，支持滚轮与触摸滑动) */}
			<div
				ref={scrollContainerRef}
				onWheel={handleWheel}
				onScroll={checkScroll}
				className="flex items-center gap-1 min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth py-0.5"
			>
				{tabs.map((tab, idx) => {
					const isActive = pathname === tab.path;
					const isHome = Boolean(homeTab && tab.path === homeTab.path);
					const isLast = idx === tabs.length - 1;
					const isFirstClosable = homeTab
						? idx <= 1 && tabs[0]?.path === homeTab.path
						: idx === 0;

					return (
						<ContextMenu key={tab.path}>
							<ContextMenuTrigger className="inline-flex shrink-0">
								<Link
									ref={(el) => {
										if (el) {
											tabElementsRef.current.set(tab.path, el);
										} else {
											tabElementsRef.current.delete(tab.path);
										}
									}}
									href={tab.path}
									onAuxClick={(e) => {
										if (e.button === 1 && tab.closable) {
											e.preventDefault();
											closeTab(tab.path);
										}
									}}
									className={cn(
										"group relative flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all select-none",
										isActive
											? "bg-background text-foreground shadow-xs border border-border font-semibold"
											: "bg-background/50 text-muted-foreground border border-border/60 shadow-2xs hover:bg-background/80 hover:text-foreground hover:border-border",
									)}
								>
									{isHome ? (
										<LayoutDashboard className="size-3.5 shrink-0 opacity-70" />
									) : (
										<span
											className={cn(
												"size-1.5 rounded-full shrink-0 transition-opacity",
												isActive
													? "bg-primary opacity-100"
													: "bg-muted-foreground/40 opacity-0 group-hover:opacity-100",
											)}
										/>
									)}
									<span className="truncate max-w-[130px]">{tab.title}</span>

									{tab.closable ? (
										<button
											type="button"
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												closeTab(tab.path);
											}}
											className={cn(
												"size-3.5 rounded-xs p-0 transition-all flex items-center justify-center",
												isActive
													? "text-muted-foreground/80 hover:bg-muted hover:text-foreground"
													: "text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:bg-muted hover:text-foreground",
											)}
											aria-label={`关闭 ${tab.title}`}
											title="关闭 (中键或右键亦可)"
										>
											<X className="size-3" />
										</button>
									) : null}
								</Link>
							</ContextMenuTrigger>

							<ContextMenuContent className="w-40 text-xs">
								<ContextMenuItem
									onClick={() => refreshTab(tab.path)}
									className="gap-2 cursor-pointer"
								>
									<RotateCw className="size-3.5" />
									<span>重新加载</span>
								</ContextMenuItem>

								<ContextMenuSeparator />

								<ContextMenuItem
									disabled={!tab.closable}
									onClick={() => closeTab(tab.path)}
									className="gap-2 cursor-pointer"
								>
									<X className="size-3.5" />
									<span>关闭标签页</span>
								</ContextMenuItem>

								<ContextMenuItem
									disabled={
										tabs.length <= 1 ||
										(tabs.length === 2 &&
											tabs.some(
												(t) => Boolean(homeTab && t.path === homeTab.path) && t.path !== tab.path,
											))
									}
									onClick={() => closeOtherTabs(tab.path)}
									className="gap-2 cursor-pointer"
								>
									<CircleOff className="size-3.5" />
									<span>关闭其他标签页</span>
								</ContextMenuItem>

								<ContextMenuItem
									disabled={isLast}
									onClick={() => closeRightTabs(tab.path)}
									className="gap-2 cursor-pointer"
								>
									<ArrowRightToLine className="size-3.5" />
									<span>关闭右侧标签页</span>
								</ContextMenuItem>

								<ContextMenuItem
									disabled={isFirstClosable}
									onClick={() => closeLeftTabs(tab.path)}
									className="gap-2 cursor-pointer"
								>
									<ArrowLeftToLine className="size-3.5" />
									<span>关闭左侧标签页</span>
								</ContextMenuItem>

								<ContextMenuSeparator />

								<ContextMenuItem
									disabled={tabs.length <= 1}
									onClick={closeAllTabs}
									className="gap-2 cursor-pointer text-destructive focus:text-destructive"
								>
									<CircleOff className="size-3.5" />
									<span>关闭全部标签页</span>
								</ContextMenuItem>
							</ContextMenuContent>
						</ContextMenu>
					);
				})}
			</div>

			{/* 溢出时右平移按钮 */}
			{isOverflowing ? (
				<button
					type="button"
					onClick={() => handleScrollBy(180)}
					disabled={!canScrollRight}
					className="flex size-7 items-center justify-center rounded-sm text-muted-foreground/70 hover:bg-muted hover:text-foreground disabled:opacity-20 disabled:pointer-events-none transition-colors shrink-0"
					title="向右滚动标签"
					aria-label="向右滚动标签"
				>
					<ChevronRight className="size-3.5" />
				</button>
			) : null}

			{/* 右侧全局快捷操作下拉菜单 */}
			<DropdownMenu>
				<DropdownMenuTrigger
					className="flex size-7 items-center justify-center rounded-sm text-muted-foreground/70 hover:bg-muted hover:text-foreground cursor-pointer transition-colors shrink-0"
					title="页签操作菜单"
					aria-label="页签操作菜单"
				>
					<ChevronDown className="size-3.5" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-40 text-xs">
					<DropdownMenuItem
						onClick={() => refreshTab(pathname)}
						className="gap-2 cursor-pointer"
					>
						<RotateCw className="size-3.5" />
						<span>重新加载当前页</span>
					</DropdownMenuItem>

					<DropdownMenuSeparator />

					<DropdownMenuItem
						disabled={!currentTab?.closable}
						onClick={() => currentTab && closeTab(currentTab.path)}
						className="gap-2 cursor-pointer"
					>
						<X className="size-3.5" />
						<span>关闭当前标签</span>
					</DropdownMenuItem>

					<DropdownMenuItem
						disabled={tabs.length <= 1}
						onClick={() => currentTab && closeOtherTabs(currentTab.path)}
						className="gap-2 cursor-pointer"
					>
						<CircleOff className="size-3.5" />
						<span>关闭其他标签</span>
					</DropdownMenuItem>

					<DropdownMenuItem
						disabled={currentTabIndex === tabs.length - 1}
						onClick={() => currentTab && closeRightTabs(currentTab.path)}
						className="gap-2 cursor-pointer"
					>
						<ArrowRightToLine className="size-3.5" />
						<span>关闭右侧标签</span>
					</DropdownMenuItem>

					<DropdownMenuItem
						disabled={
							homeTab
								? currentTabIndex <= 1 && tabs[0]?.path === homeTab.path
								: currentTabIndex <= 0
						}
						onClick={() => currentTab && closeLeftTabs(currentTab.path)}
						className="gap-2 cursor-pointer"
					>
						<ArrowLeftToLine className="size-3.5" />
						<span>关闭左侧标签</span>
					</DropdownMenuItem>

					<DropdownMenuSeparator />

					<DropdownMenuItem
						disabled={tabs.length <= 1}
						onClick={closeAllTabs}
						className="gap-2 cursor-pointer text-destructive focus:text-destructive"
					>
						<CircleOff className="size-3.5" />
						<span>关闭全部标签</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
