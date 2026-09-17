"use client";

import React, { useState, useMemo, type ReactNode } from "react";
import { FolderTree, Search, ArrowUp, ArrowDown } from "lucide-react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "../ui/card";
import { Button } from "../ui/button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "../ui/input-group";
import { HierarchyTree, type HierarchyNodeData } from "./HierarchyTree";
import { ActionButton, type ActionConfirmConfig } from "../auth/ActionButton";
import { useUiAbility } from "../auth/ui-ability-context";
import { cn } from "../../lib/utils";

export interface DataTreeNodeAction<TNode> {
	key?: string;
	action: string;
	label: ReactNode | ((node: TNode) => ReactNode);
	icon?: ReactNode;
	variant?:
		| "default"
		| "outline"
		| "ghost"
		| "destructive"
		| "secondary"
		| "link";
	size?: "default" | "sm" | "lg" | "icon";
	disabled?: boolean | ((node: TNode) => boolean);
	onClick: (node: TNode) => void | Promise<void>;
	confirm?: ActionConfirmConfig | ((node: TNode) => ActionConfirmConfig);
	hidden?: (node: TNode) => boolean;
	title?: string;
	className?: string;
}

export interface DataTreeProps<TNode extends HierarchyNodeData> {
	/** 业务主体 Subject (如 CustomerCategorySubject)，用于统一权限裁决 */
	subject: string;
	title: string;
	description?: string;
	data: readonly TNode[];

	// 顶部全局新建（内部由 ActionButton action="create" 自动判定显隐）
	onCreateRoot?: () => void;
	createRootText?: string;

	// 节点操作栏配置（Action Schema 模式，组件根据权限自动过滤渲染）
	nodeActions?: readonly DataTreeNodeAction<TNode>[];

	// 节点内容与徽标扩展插槽
	renderExtra?: (node: TNode, depth: number) => ReactNode;

	// 排序能力：受控上下移按钮回调（受限于 "update" 权限）
	enableOrdering?: boolean;
	onMoveUp?: (node: TNode) => void | Promise<void>;
	onMoveDown?: (node: TNode) => void | Promise<void>;

	// 搜索与过滤配置
	showSearch?: boolean;
	searchPlaceholder?: string;
	searchValue?: string;
	onSearchChange?: (keyword: string) => void;
	emptyText?: string;
	className?: string;
}

/**
 * 模板级树形维护工作台 (DataTree)
 * - 与 DataTable、FormModal 形成标准工业级三层模板矩阵
 * - 纯依赖 UiAbilityLike 抽象权限上下文，实现 Action Schema 驱动的权限闭环
 * - 统一收敛：顶部新增根节点、节点内动作栏、同级排序上下移、二次确认防误删
 */
export function DataTree<TNode extends HierarchyNodeData>({
	subject,
	title,
	description,
	data,
	onCreateRoot,
	createRootText = "新增一级根分类",
	nodeActions = [],
	renderExtra,
	enableOrdering = false,
	onMoveUp,
	onMoveDown,
	showSearch = true,
	searchPlaceholder = "搜索分类名称或编码...",
	searchValue: controlledKeyword,
	onSearchChange,
	emptyText = "暂无层级数据，点击上方按钮创建第一条根记录",
	className,
}: DataTreeProps<TNode>) {
	const ability = useUiAbility();
	const [internalKeyword, setInternalKeyword] = useState("");
	const keyword =
		controlledKeyword === undefined ? internalKeyword : controlledKeyword;

	const handleKeywordChange = (val: string) => {
		if (controlledKeyword === undefined) {
			setInternalKeyword(val);
		}
		onSearchChange?.(val);
	};

	// 递归过滤数据（基于名称或编码）
	const filteredData = useMemo(() => {
		if (!keyword.trim()) return data;
		const kw = keyword.toLowerCase().trim();

		function filterNode(node: TNode): TNode | null {
			const matchSelf =
				(node.name && node.name.toLowerCase().includes(kw)) ||
				(node.code && node.code.toLowerCase().includes(kw));

			const children = (node.children as TNode[] | undefined) || [];
			const filteredChildren: TNode[] = [];
			for (const child of children) {
				const filteredChild = filterNode(child);
				if (filteredChild) {
					filteredChildren.push(filteredChild);
				}
			}

			if (matchSelf || filteredChildren.length > 0) {
				return {
					...node,
					children: filteredChildren.length > 0 ? filteredChildren : undefined,
				};
			}
			return null;
		}

		return data
			.map((item) => filterNode(item))
			.filter((item): item is TNode => item !== null);
	}, [data, keyword]);

	// 判断是否拥有同级排序权限（受控于 update 权限）
	const canUpdate = ability ? ability.can("update", subject) : false;

	return (
		<Card
			className={cn(
				"flex flex-col border border-border/80 bg-card shadow-xs",
				className,
			)}
		>
			<CardHeader className="gap-3 border-b border-border/80 pb-3">
				<div className="flex items-center gap-2.5">
					<div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
						<FolderTree className="size-4 text-primary" />
					</div>
					<div className="min-w-0">
						<CardTitle className="text-base font-bold text-foreground">
							{title}
						</CardTitle>
						{description && (
							<CardDescription className="text-xs text-muted-foreground">
								{description}
							</CardDescription>
						)}
					</div>
				</div>

				{showSearch && (
					<InputGroup>
						<InputGroupAddon align="inline-start">
							<Search className="size-3.5 text-muted-foreground" />
						</InputGroupAddon>
						<InputGroupInput
							value={keyword}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								handleKeywordChange(e.target.value)
							}
							placeholder={searchPlaceholder}
							className="h-8 text-xs"
						/>
					</InputGroup>
				)}
			</CardHeader>

			<CardContent className="flex-1 p-4">
				<div className="max-h-[580px] overflow-y-auto pr-1">
					<HierarchyTree<TNode>
						data={filteredData}
						createRootText={createRootText}
						emptyText={emptyText}
						onCreateRoot={
							onCreateRoot && (!ability || ability.can("create", subject))
								? onCreateRoot
								: undefined
						}
						renderExtra={renderExtra}
						renderActions={(node) => {
							return (
								<div className="flex items-center gap-1">
									{/* 1. 同级排序控制 (受控于 update 权限) */}
									{enableOrdering && canUpdate && (
										<div className="inline-flex items-center gap-0.5 mr-1 border-r border-border/60 pr-1">
											{onMoveUp && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => onMoveUp(node)}
													className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
													title="同级上移"
												>
													<ArrowUp className="size-3" />
												</Button>
											)}
											{onMoveDown && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => onMoveDown(node)}
													className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
													title="同级下移"
												>
													<ArrowDown className="size-3" />
												</Button>
											)}
										</div>
									)}

									{/* 2. 节点操作集 (由 Action Schema 过滤驱动) */}
									{nodeActions
										.filter((act) => {
											if (act.hidden?.(node)) return false;
											if (!ability) return false;
											return ability.can(act.action, subject);
										})
										.map((act, index) => {
											const key = act.key
												? `${act.key}-${index}`
												: `${act.action}-${index}`;
											const resolvedLabel =
												typeof act.label === "function"
													? act.label(node)
													: act.label;
											const resolvedDisabled =
												typeof act.disabled === "function"
													? act.disabled(node)
													: act.disabled;
											const resolvedConfirm =
												typeof act.confirm === "function"
													? act.confirm(node)
													: act.confirm;

											return (
												<ActionButton
													key={key}
													action={act.action}
													subject={subject}
													variant={act.variant || "ghost"}
													size={act.size || "sm"}
													disabled={resolvedDisabled}
													confirm={resolvedConfirm}
													onClick={() => act.onClick(node)}
													title={act.title}
													className={act.className || "h-7 px-2 text-xs"}
												>
													{act.icon && (
														<span className="mr-1 inline-flex">{act.icon}</span>
													)}
													{resolvedLabel}
												</ActionButton>
											);
										})}
								</div>
							);
						}}
					/>
				</div>
			</CardContent>
		</Card>
	);
}
