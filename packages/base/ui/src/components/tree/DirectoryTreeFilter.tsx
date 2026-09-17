"use client";

import type React from "react";
import { useState } from "react";
import { ChevronRight, ChevronDown, Search, FolderTree } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";

export interface DirectoryTreeNode {
	id: string;
	name: string;
	code?: string;
	badge?: string | number;
	children?: DirectoryTreeNode[];
	[key: string]: unknown;
}

export interface DirectoryTreeFilterProps<T extends DirectoryTreeNode> {
	title?: string;
	allLabel?: string;
	totalCount?: number;
	nodes: readonly T[];
	selectedId: string | null;
	onSelect: (id: string | null) => void;
	/** 级联子级开关配置 */
	cascadeToggle?: {
		checked: boolean;
		onChange: (checked: boolean) => void;
		label?: string;
	};
	searchPlaceholder?: string;
	showSearch?: boolean;
	className?: string;
	icon?: React.ReactNode;
}

/**
 * 通用左侧树形导航与数据过滤面板 (DirectoryTreeFilter)
 * - 专为现代 B 端“左树右表”布局打造
 * - 基于 shadcn Card / Input / Checkbox / Badge 原生语义化驱动
 * - 支持全局“全部”项、递归缩进、折叠展开、关键字模糊搜索、实时高亮选中与级联开关
 */
export function DirectoryTreeFilter<T extends DirectoryTreeNode>({
	title = "组织与类目架构",
	allLabel = "全公司所有部门",
	totalCount,
	nodes,
	selectedId,
	onSelect,
	cascadeToggle,
	searchPlaceholder = "搜索名称或编码...",
	showSearch = true,
	className,
	icon = <FolderTree className="size-4 text-primary" />,
}: DirectoryTreeFilterProps<T>) {
	const [keyword, setKeyword] = useState("");
	const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
		// 默认展开所有顶级节点
		return new Set(nodes.map((n) => n.id));
	});

	const toggleExpand = (id: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const renderNode = (node: T, depth = 0): React.ReactNode => {
		const isSelected = selectedId === node.id;
		const hasChildren = Boolean(node.children && node.children.length > 0);
		const isExpanded = expandedIds.has(node.id);

		// 关键词过滤匹配
		const isMatch =
			!keyword ||
			node.name.toLowerCase().includes(keyword.toLowerCase()) ||
			(node.code && node.code.toLowerCase().includes(keyword.toLowerCase()));

		return (
			<div key={node.id} className="space-y-0.5">
				{isMatch && (
					<div
						style={{ paddingLeft: `${depth * 14 + 10}px` }}
						className={cn(
							"flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer select-none",
							isSelected
								? "bg-primary/10 text-primary font-bold shadow-2xs"
								: "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
						)}
						onClick={() => onSelect(node.id)}
					>
						<div className="flex items-center gap-1.5 truncate">
							{hasChildren ? (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										toggleExpand(node.id);
									}}
									className="size-4 flex items-center justify-center text-muted-foreground hover:text-foreground rounded"
								>
									{isExpanded ? (
										<ChevronDown className="size-3 text-primary" />
									) : (
										<ChevronRight className="size-3" />
									)}
								</button>
							) : (
								<span className="size-4 flex items-center justify-center text-muted-foreground/40 text-[10px]">
									•
								</span>
							)}
							<span className="truncate">{node.name}</span>
						</div>

						{node.badge !== undefined && node.badge !== null && (
							<Badge
								variant={isSelected ? "default" : "secondary"}
								className="text-[10px] px-1.5 py-0 h-4 font-mono ml-1 shrink-0"
							>
								{node.badge}
							</Badge>
						)}
					</div>
				)}

				{hasChildren &&
					isExpanded &&
					node.children!.map((child) => renderNode(child as T, depth + 1))}
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
			<CardHeader className="p-3.5 border-b border-border/80 bg-muted/20 space-y-2 flex flex-col">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						{icon}
						<CardTitle className="text-xs font-bold text-foreground">
							{title}
						</CardTitle>
					</div>
					{totalCount !== undefined && (
						<Badge
							variant="outline"
							className="text-[10px] px-1.5 py-0 h-4 font-mono"
						>
							共 {totalCount}
						</Badge>
					)}
				</div>

				{showSearch && (
					<div className="relative w-full">
						<Search className="absolute left-2.5 top-2.5 size-3 text-muted-foreground" />
						<Input
							value={keyword}
							onChange={(e) => setKeyword(e.target.value)}
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
							onCheckedChange={(c) => cascadeToggle.onChange(c === true)}
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

			<CardContent className="p-2 flex-1 overflow-y-auto max-h-[640px]">
				{/* 全部根项 */}
				<div
					className={cn(
						"flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer mb-1 select-none",
						selectedId === null
							? "bg-primary/10 text-primary font-bold shadow-2xs"
							: "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
					)}
					onClick={() => onSelect(null)}
				>
					<div className="flex items-center gap-1.5 truncate">
						<span className="size-4 flex items-center justify-center text-[10px]">
							★
						</span>
						<span className="truncate">{allLabel}</span>
					</div>
					{totalCount !== undefined && (
						<Badge
							variant={selectedId === null ? "default" : "secondary"}
							className="text-[10px] px-1.5 py-0 h-4 font-mono ml-1 shrink-0"
						>
							{totalCount}
						</Badge>
					)}
				</div>

				<div className="space-y-0.5">
					{nodes.map((node) => renderNode(node, 0))}
				</div>
			</CardContent>
		</Card>
	);
}
