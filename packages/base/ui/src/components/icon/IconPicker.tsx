"use client";

import React, { useState, useMemo } from "react";
import { Search, Check } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";
import {
	ENTERPRISE_ICONS,
	ICON_CATEGORIES,
	type IconCategory,
	type IconItem,
} from "./icon-catalog";
import { DynamicNavIcon } from "./DynamicNavIcon";

export interface IconPickerProps {
	readonly value?: string | null;
	readonly onChange: (iconName: string) => void;
	readonly fallbackType?: "group" | "page" | "external";
	readonly disabled?: boolean;
	readonly className?: string;
}

/**
 * 企业级紧凑高密度图标选择器 (Icon Picker)
 * 包含中英文拼音即时搜索、业务分类快速筛选与高密度网格点选
 */
export function IconPicker({
	value,
	onChange,
	fallbackType = "page",
	disabled = false,
	className,
}: IconPickerProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<
		IconCategory | "all"
	>("all");

	const currentIconItem = useMemo(() => {
		return ENTERPRISE_ICONS.find((i) => i.name === value);
	}, [value]);

	const filteredIcons = useMemo(() => {
		const q = search.trim().toLowerCase();
		return ENTERPRISE_ICONS.filter((item) => {
			// 分类筛选
			if (selectedCategory !== "all" && item.category !== selectedCategory) {
				return false;
			}
			// 搜索关键词筛选
			if (!q) return true;
			return (
				item.name.toLowerCase().includes(q) ||
				item.label.toLowerCase().includes(q) ||
				item.keywords.some((k) => k.toLowerCase().includes(q))
			);
		});
	}, [search, selectedCategory]);

	const handleSelect = (iconItem: IconItem) => {
		onChange(iconItem.name);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button
						variant="outline"
						size="sm"
						disabled={disabled}
						className={cn(
							"h-8 px-2.5 justify-start text-xs font-normal gap-2 border-border/80 hover:bg-muted/30",
							className,
						)}
					/>
				}
			>
				<div className="flex size-5 items-center justify-center rounded bg-primary/10 text-primary shrink-0">
					<DynamicNavIcon
						name={value}
						className="size-3.5"
						fallbackType={fallbackType}
					/>
				</div>
				<span className="truncate flex-1 text-left">
					{currentIconItem
						? `${currentIconItem.label} (${currentIconItem.name})`
						: value || "选择图标..."}
				</span>
			</PopoverTrigger>

			<PopoverContent
				align="start"
				sideOffset={6}
				className="w-[340px] p-2.5 shadow-xl border-border bg-popover z-50"
			>
				{/* 顶部搜索框 */}
				<div className="relative mb-2">
					<Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
					<Input
						value={search}
						placeholder="搜索图标 (如: 设置, 客户, 物料, 报表...)"
						className="h-8 pl-8 text-xs"
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>

				{/* 分类快捷标签 */}
				<div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-border/60 scrollbar-none">
					<button
						type="button"
						onClick={() => setSelectedCategory("all")}
						className={cn(
							"px-2 py-0.5 rounded text-[11px] font-medium transition-colors shrink-0",
							selectedCategory === "all"
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:bg-muted",
						)}
					>
						全部 ({ENTERPRISE_ICONS.length})
					</button>
					{ICON_CATEGORIES.map((cat) => (
						<button
							key={cat.id}
							type="button"
							onClick={() => setSelectedCategory(cat.id)}
							className={cn(
								"px-2 py-0.5 rounded text-[11px] font-medium transition-colors shrink-0",
								selectedCategory === cat.id
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:bg-muted",
							)}
						>
							{cat.label}
						</button>
					))}
				</div>

				{/* 图标高密度网格 */}
				<div className="mt-2 max-h-[220px] overflow-y-auto grid grid-cols-6 gap-1 p-0.5">
					{filteredIcons.length === 0 ? (
						<div className="col-span-6 py-6 text-center text-xs text-muted-foreground">
							未找到匹配图标
						</div>
					) : (
						filteredIcons.map((item) => {
							const isSelected = item.name === value;
							const IconComp = item.component;
							return (
								<button
									key={item.name}
									type="button"
									title={`${item.label} (${item.name})`}
									onClick={() => handleSelect(item)}
									className={cn(
										"flex flex-col items-center justify-center p-1.5 rounded-md border transition-all relative group",
										isSelected
											? "border-primary bg-primary/10 text-primary shadow-xs"
											: "border-transparent text-foreground hover:bg-muted hover:border-border/60",
									)}
								>
									<IconComp className="size-4" />
									<span className="text-[9px] truncate w-full text-center mt-1 text-muted-foreground group-hover:text-foreground">
										{item.label}
									</span>
									{isSelected && (
										<div className="absolute top-0.5 right-0.5 size-2.5 rounded-full bg-primary flex items-center justify-center text-white">
											<Check className="size-2 stroke-[3]" />
										</div>
									)}
								</button>
							);
						})
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
