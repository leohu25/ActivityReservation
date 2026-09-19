"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";
import {
	Combobox as BaseCombobox,
	ComboboxInput,
	ComboboxContent,
	ComboboxList,
	ComboboxItem,
	ComboboxEmpty,
} from "../ui/combobox";

export interface ComboboxOption {
	readonly value: string;
	readonly label: string;
	readonly description?: string;
	readonly disabled?: boolean;
}

export interface ComboboxProps {
	readonly value?: string | null;
	readonly onChange?: (value: string) => void;
	readonly options: readonly ComboboxOption[];
	readonly placeholder?: string;
	readonly searchPlaceholder?: string;
	readonly emptyText?: string;
	readonly disabled?: boolean;
	readonly clearable?: boolean;
	readonly className?: string;
	readonly popoverClassName?: string;
	readonly popoverWidth?: number | string;

	// --- 远程搜索与滚动加载扩展能力 ---
	/** 当前是否正在加载数据（远程搜索或分页加载中） */
	readonly loading?: boolean;
	/** 搜索输入框文字变更事件（由调用方防抖触发后端远程检索） */
	readonly onSearchChange?: (keyword: string) => void;
	/** 下拉列表滚动触底事件（由调用方配合实现分页加载下一页） */
	readonly onLoadMore?: () => void;
	/** 是否还有更多分页数据可加载 */
	readonly hasMore?: boolean;
}

/**
 * 通用业务 Combobox：内部基于 shadcn 官方 Base UI Combobox 原子封装，
 * 保持业务层稳定一致的 { value, onChange, options } 契约。
 * 
 * 两种推荐模式：
 * 1. 本地内存过滤（少量枚举/字典）：直接传入完整 options，由 Base UI 内存模糊匹配；
 * 2. 远程检索与触底分页（海量主数据）：传入 onSearchChange 触发后端搜索，结合 onLoadMore 触底追加。
 */
export function Combobox({
	value,
	onChange,
	options,
	placeholder = "请选择...",
	emptyText = "暂无匹配项",
	disabled = false,
	clearable = false,
	className,
	popoverClassName,
	popoverWidth,
	loading = false,
	onSearchChange,
	onLoadMore,
	hasMore = false,
}: ComboboxProps) {
	const selectedOption = React.useMemo(() => {
		if (!value) return null;
		return options.find((opt) => opt.value === value) ?? null;
	}, [options, value]);

	const hasOptions = options.length > 0;
	const effectivePlaceholder = hasOptions ? placeholder : "暂无可选数据";

	// 远程搜索模式下关闭 Base UI 内部的本地过滤，由后端过滤结果直接驱动显示
	const isRemoteSearch = Boolean(onSearchChange);

	// 滚动触底检测
	const handleScroll = React.useCallback(
		(e: React.UIEvent<HTMLDivElement>) => {
			if (!onLoadMore || loading || !hasMore) return;
			const target = e.currentTarget;
			if (target.scrollTop + target.clientHeight >= target.scrollHeight - 20) {
				onLoadMore();
			}
		},
		[hasMore, loading, onLoadMore],
	);

	return (
		<div
			className={cn("w-full", className)}
			style={popoverWidth ? { width: popoverWidth } : undefined}
		>
			<BaseCombobox
				items={options as ComboboxOption[]}
				value={selectedOption}
				disabled={disabled || (!hasOptions && !loading && !isRemoteSearch)}
				itemToStringLabel={(item) => item?.label ?? ""}
				itemToStringValue={(item) => item?.value ?? ""}
				filter={isRemoteSearch ? null : undefined}
				onInputValueChange={
					onSearchChange
						? (query) => {
								onSearchChange(query);
							}
						: undefined
				}
				onValueChange={(nextOption) => {
					if (!nextOption) {
						onChange?.("");
						return;
					}
					onChange?.(nextOption.value);
				}}
			>
				<ComboboxInput
					disabled={disabled}
					placeholder={effectivePlaceholder}
					showClear={clearable && Boolean(selectedOption)}
					showTrigger={true}
					className={cn(
						"w-full text-xs",
						!selectedOption && "text-muted-foreground",
					)}
				/>
				<ComboboxContent className={cn("min-w-[220px]", popoverClassName)}>
					<ComboboxEmpty className="py-3 text-xs text-muted-foreground">
						{loading ? "正在搜索..." : hasOptions ? emptyText : "暂无可选数据"}
					</ComboboxEmpty>
					<ComboboxList onScroll={handleScroll}>
						{(option: ComboboxOption) => (
							<ComboboxItem
								key={option.value}
								value={option}
								disabled={option.disabled}
								className="text-xs"
							>
								<div className="flex flex-col min-w-0 flex-1">
									<span className="truncate font-medium">{option.label}</span>
									{option.description ? (
										<span className="text-[10px] text-muted-foreground truncate">
											{option.description}
										</span>
									) : null}
								</div>
							</ComboboxItem>
						)}
					</ComboboxList>
					{loading ? (
						<div className="flex items-center justify-center py-2 text-xs text-muted-foreground border-t gap-1.5">
							<Loader2 className="size-3 animate-spin" />
							<span>加载中...</span>
						</div>
					) : hasMore && onLoadMore ? (
						<div className="text-center py-1.5 text-[10px] text-muted-foreground border-t">
							滚动以加载更多
						</div>
					) : null}
				</ComboboxContent>
			</BaseCombobox>
		</div>
	);
}
