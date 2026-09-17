"use client";

import type React from "react";
import { useState } from "react";
import { Search } from "lucide-react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "./ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { Badge } from "./ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "./ui/empty";
import { Separator } from "./ui/separator";
import { cn } from "../lib/utils";

/** 字典项条目契约 */
export interface DictionaryItem {
	readonly key: string;
	readonly code: string;
	readonly name: string;
	readonly typeTag?: string;
	readonly parentInfo?: string | null;
	readonly description?: string | null;
	readonly status: "ACTIVE" | "DISABLED" | string;
	readonly actions?: React.ReactNode;
}

export interface DictionarySectionCardProps {
	readonly title: string;
	readonly description?: string;
	readonly icon?: React.ReactNode;
	readonly actionButton?: React.ReactNode;
	readonly searchPlaceholder?: string;
	readonly items: DictionaryItem[];
	readonly emptyText?: string;
	readonly className?: string;
}

/**
 * 企业级字典与分类管理卡片
 * 基于 shadcn Card / InputGroup / Badge / Empty / Separator 组合。
 */
export function DictionarySectionCard({
	title,
	description,
	icon,
	actionButton,
	searchPlaceholder = "快速搜索编码、名称...",
	items,
	emptyText = "暂无相关字典记录",
	className,
}: DictionarySectionCardProps) {
	const [keyword, setKeyword] = useState("");

	const filteredItems = items.filter((item) => {
		if (!keyword) return true;
		const kw = keyword.toLowerCase();
		return (
			item.code.toLowerCase().includes(kw) ||
			item.name.toLowerCase().includes(kw) ||
			(item.description && item.description.toLowerCase().includes(kw))
		);
	});

	return (
		<Card
			className={cn("flex flex-col gap-0 border bg-card shadow-xs", className)}
		>
			<CardHeader className="gap-3 border-b pb-3">
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-2.5">
						{icon ? (
							<div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
								{icon}
							</div>
						) : null}
						<div className="min-w-0">
							<CardTitle className="text-base font-bold text-foreground">
								{title}
							</CardTitle>
							{description ? (
								<CardDescription className="mt-0.5 text-xs text-muted-foreground">
									{description}
								</CardDescription>
							) : null}
						</div>
					</div>
					{actionButton}
				</div>

				<InputGroup>
					<InputGroupAddon align="inline-start">
						<Search />
					</InputGroupAddon>
					<InputGroupInput
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						placeholder={searchPlaceholder}
						className="h-8 text-xs"
					/>
				</InputGroup>
			</CardHeader>

			<CardContent className="flex-1 p-4">
				<div className="flex max-h-[520px] flex-col gap-2 overflow-y-auto pr-1">
					{filteredItems.length === 0 ? (
						<Empty className="min-h-[200px] border-dashed">
							<EmptyHeader>
								<EmptyTitle className="text-sm">{emptyText}</EmptyTitle>
								<EmptyDescription className="text-xs">
									可调整搜索关键字或新建记录
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : (
						filteredItems.map((item) => {
							const isActive = item.status === "ACTIVE";
							return (
								<div
									key={item.key}
									className="group flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/60"
								>
									<div className="flex min-w-0 flex-1 flex-col gap-1">
										<div className="flex flex-wrap items-center gap-2">
											<span className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
												{item.code}
											</span>
											<span className="truncate text-sm font-medium text-foreground">
												{item.name}
											</span>
											{item.typeTag ? (
												<Badge
													variant="outline"
													className="h-4 px-1.5 py-0 text-[10px]"
												>
													{item.typeTag}
												</Badge>
											) : null}
											{item.parentInfo ? (
												<span className="font-mono text-xs text-muted-foreground">
													{item.parentInfo}
												</span>
											) : null}
										</div>
										{item.description ? (
											<p className="line-clamp-1 text-xs text-muted-foreground">
												{item.description}
											</p>
										) : null}
									</div>

									<div className="flex shrink-0 items-center gap-2">
										<Badge
											variant={isActive ? "default" : "secondary"}
											className="h-4 px-1.5 py-0 text-[10px]"
										>
											{isActive ? "启用" : "停用"}
										</Badge>
										{item.actions}
									</div>
								</div>
							);
						})
					)}
				</div>
			</CardContent>
		</Card>
	);
}
