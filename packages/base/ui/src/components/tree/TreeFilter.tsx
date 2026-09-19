"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
	ChevronRight,
	ChevronDown,
	Search,
	FolderTree,
	Layers,
	ChevronsUpDown,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

/**
 * 通用树形/列表节点模型 (SSoT)
 * 支持多层级嵌套，也支持扁平字典列表
 */
export interface TreeNode {
	/** 节点唯一主键标识 */
	id: string;
	/** 节点显示名称 (SSoT) */
	name: string;
	/** 节点编码 (可选，显示在名称旁或副标题) */
	code?: string;
	/** 节点辅助描述说明 (可选) */
	description?: string;
	/** 数量角标或状态标识 (可选) */
	badge?: string | number | React.ReactNode;
	/** 节点个性化图标 (可选，优先级高于全局通用图标) */
	icon?: React.ReactNode;
	/** 是否处于禁用不可选状态 (可选) */
	disabled?: boolean;
	/** 递归子节点列表 (可选) */
	children?: TreeNode[];
	[key: string]: unknown;
}

export type TreeFilterNode = TreeNode;
export type TreeNavNode = TreeNode;

export interface TreeFilterProps<T extends TreeNode = TreeNode> {
	/** 导航面板标题，默认 "层级结构" */
	title?: string;
	/** 顶部左侧图标，默认 FolderTree */
	icon?: React.ReactNode;
	/** 顶部右侧自定义操作槽位 */
	headerExtra?: React.ReactNode;

	/** 是否展示顶部“全部/根级”汇总项，默认 true */
	showAll?: boolean;
	/** 全部项名称，默认 "全部" (切勿硬编码特定业务名词) */
	allLabel?: string;
	/** 全部项自定义图标 */
	allIcon?: React.ReactNode;
	/** 全量汇总数量，若提供且 showAll 为 true 则在全部项展示角标；若 showAll 为 false 则在卡片 Header 展示 */
	totalCount?: number;

	/** 树节点数据列表 (纯数据输入) */
	nodes: readonly T[];
	/** 当前选中的节点 ID (null 表示选中全部) */
	selectedId: string | null;
	/** 选中事件回调 (带回节点 ID 与完整节点数据) */
	onSelect: (id: string | null, node?: T | null) => void;

	/** 级联子级开关配置 (如：“包含下级所有子节点”) */
	cascadeToggle?: {
		checked: boolean;
		onChange: (checked: boolean) => void;
		label?: string;
	};

	/** 是否显示快速过滤搜索框，默认 true */
	showSearch?: boolean;
	/** 搜索占位符，默认 "搜索名称或编码..." */
	searchPlaceholder?: string;
	/** 受控搜索关键字 (可选) */
	searchValue?: string;
	/** 搜索关键字变化回调 (可选) */
	onSearchChange?: (keyword: string) => void;
	/** 自定义过滤匹配器 (可选) */
	filterNode?: (node: T, keyword: string) => boolean;

	/** 编码展示方式：'subtitle' (第二行副标题，适合角色/实体列表) | 'inline' (行内右侧，适合层级树) | 'none' (不展示编码) */
	codePlacement?: "subtitle" | "inline" | "none";
	/** 密度模式：'comfortable' (默认舒适留白，推荐) | 'compact' (紧凑高密度) */
	density?: "comfortable" | "compact";

	/** 是否支持一键展开/收起全部，默认 false */
	showExpandToggle?: boolean;
	/** 初始是否全部展开，默认 true */
	defaultExpandAll?: boolean;
	/** 受控展开 ID 集合 (可选) */
	expandedIds?: Set<string>;
	/** 展开集合变动回调 (可选) */
	onExpandedIdsChange?: (ids: Set<string>) => void;

	/** 自定义节点标题渲染插槽 */
	renderTitle?: (
		node: T,
		depth: number,
		isSelected: boolean,
	) => React.ReactNode;
	/** 自定义节点右侧信息插槽 (在 Badge 之前) */
	renderExtra?: (
		node: T,
		depth: number,
		isSelected: boolean,
	) => React.ReactNode;
	/** 自定义节点角标渲染插槽 */
	renderBadge?: (node: T, isSelected: boolean) => React.ReactNode;
	/** 自定义节点图标渲染插槽 */
	renderIcon?: (node: T, depth: number, isSelected: boolean) => React.ReactNode;
	/** 自定义节点操作动作插槽 */
	renderActions?: (
		node: T,
		depth: number,
		isSelected: boolean,
	) => React.ReactNode;

	/** 自定义外部类名 */
	className?: string;
	/** 列表最大滚动高度类名，默认 "max-h-[640px]" */
	maxHeight?: string;
	/** 空结果提示，默认 "暂无数据" 或 "未找到匹配项" */
	emptyText?: string;
}

export type TreeNavProps<T extends TreeNode = TreeNode> = TreeFilterProps<T>;

/** 默认的节点模糊匹配规则：匹配名称、编码或描述 */
function defaultNodeMatcher<T extends TreeNode>(node: T, kw: string): boolean {
	const lower = kw.toLowerCase().trim();
	if (node.name && node.name.toLowerCase().includes(lower)) return true;
	if (node.code && node.code.toLowerCase().includes(lower)) return true;
	if (
		typeof node.description === "string" &&
		node.description.toLowerCase().includes(lower)
	)
		return true;
	return false;
}

/** 递归收集整棵树的所有节点 ID */
function collectAllNodeIds<T extends TreeNode>(nodes: readonly T[]): Set<string> {
	const ids = new Set<string>();
	function walk(list: readonly TreeNode[]) {
		for (const n of list) {
			ids.add(n.id);
			if (n.children && n.children.length > 0) {
				walk(n.children);
			}
		}
	}
	walk(nodes);
	return ids;
}

/**
 * 递归深度过滤树：
 * 1. 只要节点本身或其任一后代匹配关键字，该节点即保留在可见树中
 * 2. 自动收集所有匹配节点的祖先 ID，以便搜索时自动展开整条路径
 */
function filterTreeWithAncestors<T extends TreeNode>(
	nodes: readonly T[],
	keyword: string,
	matcher: (node: T, kw: string) => boolean,
): { visibleNodes: T[]; matchedAncestorIds: Set<string> } {
	const matchedAncestorIds = new Set<string>();

	function walk(node: T): { kept: T | null; matchesAny: boolean } {
		const matchesSelf = matcher(node, keyword);
		const children = (node.children as readonly T[] | undefined) || [];
		const keptChildren: T[] = [];
		let childMatched = false;

		for (const child of children) {
			const res = walk(child);
			if (res.kept) {
				keptChildren.push(res.kept);
			}
			if (res.matchesAny) {
				childMatched = true;
			}
		}

		const matchesAny = matchesSelf || childMatched;
		if (matchesAny) {
			if (childMatched) {
				matchedAncestorIds.add(node.id);
			}
			return {
				kept: {
					...node,
					children:
						keptChildren.length > 0
							? (keptChildren as TreeNode[])
							: undefined,
				},
				matchesAny: true,
			};
		}

		return { kept: null, matchesAny: false };
	}

	const visibleNodes: T[] = [];
	for (const n of nodes) {
		const res = walk(n);
		if (res.kept) {
			visibleNodes.push(res.kept);
		}
	}

	return { visibleNodes, matchedAncestorIds };
}

/**
 * 通用主流树形筛选与导航组件 (TreeFilter / TreeNav)
 * - 专为现代化企业 B 端“左树右表”及“左侧导航目录”标准范式打造 (业界主流命名 TreeFilter)
 * - 基于 shadcn Card / Input / Checkbox / Badge 原生工业级原语驱动
 * - 全链路泛型 `<T extends TreeNode>` 与 TypeScript 强类型约束，零 any
 * - 核心特性：
 *   1. 深度递归搜索：命中孙节点自动保全整条祖先链路并深度自动展开
 *   2. 舒适留白体验：默认 comfortable 舒适间距，支持 subtitle 双行优雅呈现
 *   3. 高对比度徽标：选中时绝不反色遮蔽文字，ReactNode 徽标绝不发生二次包裹
 *   4. 模式自适应：支持带“全部”根项的过滤树 (showAll=true)，亦支持单选实体导航 (showAll=false)
 */
export function TreeFilter<T extends TreeNode = TreeNode>({
	title = "层级结构",
	icon = <FolderTree className="size-4 text-primary" />,
	headerExtra,
	showAll = true,
	allLabel = "全部",
	allIcon,
	totalCount,
	nodes,
	selectedId,
	onSelect,
	cascadeToggle,
	showSearch = true,
	searchPlaceholder = "搜索名称或编码...",
	searchValue: controlledKeyword,
	onSearchChange,
	filterNode,
	codePlacement: userCodePlacement,
	density = "comfortable",
	showExpandToggle = false,
	defaultExpandAll = true,
	expandedIds: controlledExpandedIds,
	onExpandedIdsChange,
	renderTitle,
	renderExtra,
	renderBadge,
	renderIcon,
	renderActions,
	className,
	maxHeight = "max-h-[640px]",
	emptyText,
}: TreeFilterProps<T>) {
	// 1. 搜索状态处理 (受控与非受控兼容)
	const [internalKeyword, setInternalKeyword] = useState("");
	const keyword =
		controlledKeyword !== undefined ? controlledKeyword : internalKeyword;

	const handleSearchChange = (val: string) => {
		if (controlledKeyword === undefined) {
			setInternalKeyword(val);
		}
		onSearchChange?.(val);
	};

	// 2. 展开/折叠状态处理 (受控与非受控兼容)
	const allNodeIds = useMemo(() => collectAllNodeIds(nodes), [nodes]);
	const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(
		() => {
			if (defaultExpandAll) {
				return allNodeIds;
			}
			return new Set(nodes.map((n) => n.id));
		},
	);

	const activeExpandedIds =
		controlledExpandedIds !== undefined
			? controlledExpandedIds
			: internalExpandedIds;

	const setExpandedIds = useCallback(
		(nextOrUpdater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
			if (typeof nextOrUpdater === "function") {
				const next = nextOrUpdater(activeExpandedIds);
				if (controlledExpandedIds === undefined) {
					setInternalExpandedIds(next);
				}
				onExpandedIdsChange?.(next);
			} else {
				if (controlledExpandedIds === undefined) {
					setInternalExpandedIds(nextOrUpdater);
				}
				onExpandedIdsChange?.(nextOrUpdater);
			}
		},
		[activeExpandedIds, controlledExpandedIds, onExpandedIdsChange],
	);

	const toggleExpand = useCallback(
		(id: string) => {
			setExpandedIds((prev) => {
				const next = new Set(prev);
				if (next.has(id)) next.delete(id);
				else next.add(id);
				return next;
			});
		},
		[setExpandedIds],
	);

	const toggleExpandAll = useCallback(() => {
		if (activeExpandedIds.size > 0) {
			setExpandedIds(new Set<string>());
		} else {
			setExpandedIds(new Set(allNodeIds));
		}
	}, [activeExpandedIds.size, allNodeIds, setExpandedIds]);

	// 3. 递归过滤与搜索祖先自动展开逻辑
	const matcher = filterNode ?? defaultNodeMatcher;
	const isSearching = Boolean(keyword.trim());

	const { visibleNodes, matchedAncestorIds } = useMemo(() => {
		if (!isSearching) {
			return { visibleNodes: nodes as T[], matchedAncestorIds: new Set<string>() };
		}
		return filterTreeWithAncestors(nodes, keyword.trim(), matcher);
	}, [nodes, keyword, isSearching, matcher]);

	// 搜索激活期间，有效展开集融合 matchedAncestorIds
	const effectiveExpandedIds = useMemo(() => {
		if (!isSearching) return activeExpandedIds;
		const combined = new Set(activeExpandedIds);
		for (const id of matchedAncestorIds) {
			combined.add(id);
		}
		return combined;
	}, [activeExpandedIds, matchedAncestorIds, isSearching]);

	// 判断当前数据集是否具备层级分支
	const hasAnyHierarchy = useMemo(() => {
		return nodes.some((n) => n.children && n.children.length > 0);
	}, [nodes]);

	// 若用户未指定 codePlacement：层级树默认 inline，扁平列表默认 subtitle
	const resolvedCodePlacement =
		userCodePlacement ?? (hasAnyHierarchy ? "inline" : "subtitle");

	// 4. 递归渲染节点
	const renderNode = (node: T, depth = 0): React.ReactNode => {
		const isSelected = selectedId === node.id;
		const hasChildren = Boolean(node.children && node.children.length > 0);
		const isExpanded = effectiveExpandedIds.has(node.id);
		const isDisabled = Boolean(node.disabled);
		const isTwoLine =
			resolvedCodePlacement === "subtitle" && Boolean(node.code);

		return (
			<div key={node.id} className="space-y-1">
				<div
					style={{ paddingLeft: `${depth * 14 + 10}px` }}
					className={cn(
						"group flex items-center justify-between rounded-lg transition-all select-none border",
						density === "compact"
							? "px-2 py-1.5 min-h-[32px] text-xs"
							: isTwoLine
								? "px-3 py-2 min-h-[46px] text-xs"
								: "px-2.5 py-2 min-h-[38px] text-xs",
						isDisabled
							? "opacity-50 border-transparent cursor-not-allowed"
							: isSelected
								? "border-primary/30 bg-primary/10 text-primary font-semibold shadow-2xs dark:bg-primary/15"
								: "border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground",
					)}
				>
					{/* 折叠/展开按键 或 层级缩进指示器 */}
					{hasChildren ? (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								toggleExpand(node.id);
							}}
							className="size-5 shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground rounded hover:bg-muted/60 transition-colors mr-1"
							aria-label={isExpanded ? "收起" : "展开"}
						>
							{isExpanded ? (
								<ChevronDown className="size-3.5 text-primary" />
							) : (
								<ChevronRight className="size-3.5" />
							)}
						</button>
					) : depth > 0 ? (
						<span className="size-4 shrink-0 flex items-center justify-center text-muted-foreground/40 text-[10px] mr-1">
							•
						</span>
					) : null}

					{/* 节点主要选择按钮 */}
					<button
						type="button"
						disabled={isDisabled}
						onClick={() => {
							if (!isDisabled) {
								onSelect(node.id, node);
							}
						}}
						className={cn(
							"flex items-center gap-2 min-w-0 flex-1 pr-1.5 truncate text-left bg-transparent border-0 p-0 focus:outline-none",
							isDisabled
								? "cursor-not-allowed"
								: "cursor-pointer",
							isSelected
								? "text-primary"
								: "text-inherit",
						)}
					>
						{/* 自定义图标或节点图标 */}
						{renderIcon ? (
							renderIcon(node, depth, isSelected)
						) : node.icon ? (
							<span className="size-4 shrink-0 flex items-center justify-center text-muted-foreground">
								{node.icon}
							</span>
						) : null}

						{/* 自定义标题或默认格式 */}
						{renderTitle ? (
							renderTitle(node, depth, isSelected)
						) : isTwoLine ? (
							<div className="flex flex-col min-w-0 flex-1 truncate text-left">
								<span
									className={cn(
										"truncate leading-snug",
										isSelected
											? "font-semibold text-primary"
											: "text-foreground font-medium",
									)}
								>
									{node.name}
								</span>
								<span
									className={cn(
										"font-mono text-[11px] truncate leading-tight mt-0.5",
										isSelected
											? "text-primary/75"
											: "text-muted-foreground/75",
									)}
								>
									{node.code}
								</span>
							</div>
						) : (
							<div className="flex items-center gap-2 min-w-0 truncate">
								<span
									className={cn(
										"truncate",
										isSelected
											? "font-semibold text-primary"
											: "font-medium",
									)}
								>
									{node.name}
								</span>
								{node.code &&
									resolvedCodePlacement === "inline" && (
										<span className="font-mono text-[10px] text-muted-foreground/70 shrink-0">
											{node.code}
										</span>
									)}
							</div>
						)}
					</button>

					{/* 右侧：Extra 插槽 + Badge + Actions */}
					<div className="flex items-center gap-1.5 shrink-0 ml-1">
						{renderExtra && renderExtra(node, depth, isSelected)}

						{/* 徽标处理：杜绝二次套壳，杜绝选中时反色文字变黑 */}
						{renderBadge ? (
							renderBadge(node, isSelected)
						) : React.isValidElement(node.badge) ? (
							node.badge
						) : node.badge !== undefined && node.badge !== null ? (
							<Badge
								variant="outline"
								size="sm"
								className={cn(
									"text-[10px] px-1.5 py-0 h-4.5 font-mono shrink-0 transition-colors",
									isSelected
										? "border-primary/40 bg-background/90 text-primary font-semibold dark:bg-background/40"
										: "border-border/80 bg-muted/60 text-muted-foreground",
								)}
							>
								{node.badge}
							</Badge>
						) : null}

						{renderActions && renderActions(node, depth, isSelected)}
					</div>
				</div>

				{/* 递归渲染子级 */}
				{hasChildren &&
					isExpanded &&
					(node.children as T[]).map((child) =>
						renderNode(child, depth + 1),
					)}
			</div>
		);
	};

	return (
		<Card
			className={cn(
				"rounded-xl border border-border/80 bg-card shadow-xs flex flex-col overflow-hidden py-0 gap-0",
				className,
			)}
		>
			<CardHeader className="p-3.5 border-b border-border/80 bg-muted/20 space-y-2.5 flex flex-col">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 min-w-0">
						{icon}
						<CardTitle className="text-xs font-bold text-foreground truncate">
							{title}
						</CardTitle>
					</div>

					<div className="flex items-center gap-1 shrink-0">
						{showExpandToggle && nodes.length > 0 && (
							<Button
								variant="ghost"
								size="sm"
								className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
								onClick={toggleExpandAll}
								title={
									activeExpandedIds.size > 0
										? "全部折叠"
										: "全部展开"
								}
							>
								<ChevronsUpDown className="size-3 mr-0.5" />
								{activeExpandedIds.size > 0 ? "折叠" : "展开"}
							</Button>
						)}

						{headerExtra}

						{/* 若未展示 All 行，且配置了 totalCount，在标题栏展示总数角标 */}
						{!showAll && totalCount !== undefined && (
							<Badge
								variant="outline"
								className="text-[10px] px-1.5 py-0 h-4.5 font-mono"
							>
								{totalCount}
							</Badge>
						)}
					</div>
				</div>

				{showSearch && (
					<div className="relative w-full">
						<Search className="absolute left-2.5 top-2.5 size-3 text-muted-foreground pointer-events-none" />
						<Input
							value={keyword}
							onChange={(e) => handleSearchChange(e.target.value)}
							placeholder={searchPlaceholder}
							className="pl-7 text-xs h-8 bg-card shadow-none border-input"
						/>
					</div>
				)}

				{cascadeToggle && (
					<div className="flex items-center gap-2 pt-0.5">
						<Checkbox
							id="cascade-toggle"
							checked={cascadeToggle.checked}
							onCheckedChange={(c) =>
								cascadeToggle.onChange(c === true)
							}
							className="size-3.5"
						/>
						<label
							htmlFor="cascade-toggle"
							className="text-[11px] text-muted-foreground cursor-pointer select-none"
						>
							{cascadeToggle.label ?? "包含下级所有子节点"}
						</label>
					</div>
				)}
			</CardHeader>

			<CardContent className={cn("p-2.5 flex-1 overflow-y-auto", maxHeight)}>
				{/* 顶部全部项 (仅当 showAll 为 true 时展示) */}
				{showAll && (
					<button
						type="button"
						onClick={() => onSelect(null, null)}
						className={cn(
							"w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer mb-1.5 select-none text-left bg-transparent border border-transparent focus:outline-none min-h-[36px]",
							selectedId === null
								? "border-primary/30 bg-primary/10 text-primary font-semibold shadow-2xs"
								: "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
						)}
					>
						<div className="flex items-center gap-2 truncate">
							{allIcon ?? (
								<Layers className="size-3.5 text-muted-foreground shrink-0" />
							)}
							<span className="truncate">{allLabel}</span>
						</div>
						{totalCount !== undefined && (
							<Badge
								variant={
									selectedId === null ? "default" : "secondary"
								}
								className="text-[10px] px-1.5 py-0 h-4 font-mono ml-1 shrink-0"
							>
								{totalCount}
							</Badge>
						)}
					</button>
				)}

				{/* 节点列表或空状态 */}
				{visibleNodes.length === 0 ? (
					<div className="py-8 text-center text-xs text-muted-foreground">
						{isSearching
							? "未找到匹配项"
							: (emptyText ?? "暂无数据")}
					</div>
				) : (
					<div className="space-y-1">
						{visibleNodes.map((node) => renderNode(node, 0))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

/** 语义化主流别名：TreeNav 与 TreeFilter 完全等价 */
export const TreeNav = TreeFilter;
