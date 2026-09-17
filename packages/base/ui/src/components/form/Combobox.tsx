"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
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
}

/**
 * 通用业务 Combobox：内部基于 shadcn 官方 Base UI Combobox 原子封装，
 * 保持业务层稳定一致的 { value, onChange, options } 契约。
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
}: ComboboxProps) {
	const selectedOption = React.useMemo(
		() => options.find((opt) => opt.value === value) ?? null,
		[options, value],
	);

	const hasOptions = options.length > 0;
	const effectivePlaceholder = hasOptions ? placeholder : "暂无可选分类";

	return (
		<div
			className={cn("w-full", className)}
			style={popoverWidth ? { width: popoverWidth } : undefined}
		>
			<BaseCombobox
				items={options as ComboboxOption[]}
				value={selectedOption}
				disabled={disabled || !hasOptions}
				itemToStringValue={(item) => item?.label ?? ""}
				onValueChange={(nextOption) => {
					if (!nextOption) {
						onChange?.("");
						return;
					}
					onChange?.(nextOption.value);
				}}
			>
				<ComboboxInput
					disabled={disabled || !hasOptions}
					placeholder={effectivePlaceholder}
					showClear={clearable}
					showTrigger={true}
					className={cn(
						"w-full text-xs",
						!selectedOption && "text-muted-foreground",
					)}
				/>
				<ComboboxContent className={cn("min-w-[220px]", popoverClassName)}>
					<ComboboxEmpty className="py-3 text-xs text-muted-foreground">
						{hasOptions ? emptyText : "暂无可选数据"}
					</ComboboxEmpty>
					<ComboboxList>
						{options.map((option) => (
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
						))}
					</ComboboxList>
				</ComboboxContent>
			</BaseCombobox>
		</div>
	);
}
