"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

export interface TagMultiSelectOption {
	readonly value: string;
	readonly label: string;
}

export interface TagMultiSelectProps {
	readonly options: readonly TagMultiSelectOption[];
	readonly value: readonly string[];
	readonly onChange: (value: string[]) => void;
	/** 最大高度（滚动），默认 max-h-24 */
	readonly maxHeightClass?: string;
	readonly className?: string;
	readonly disabled?: boolean;
}

/**
 * 标签多选（圆角胶囊）：基于 Button 原子组件，禁止业务手写 button 样式。
 */
export function TagMultiSelect({
	options,
	value,
	onChange,
	maxHeightClass = "max-h-24",
	className,
	disabled,
}: TagMultiSelectProps) {
	const selected = React.useMemo(() => new Set(value), [value]);

	const toggle = (val: string) => {
		if (disabled) return;
		onChange(
			selected.has(val) ? value.filter((x) => x !== val) : [...value, val],
		);
	};

	return (
		<div
			className={cn(
				"flex flex-wrap gap-2 overflow-y-auto rounded-lg border border-input bg-muted/20 p-2",
				maxHeightClass,
				className,
			)}
		>
			{options.length === 0 ? (
				<span className="px-1 py-0.5 text-xs text-muted-foreground">
					暂无可选项
				</span>
			) : (
				options.map((opt) => {
					const checked = selected.has(opt.value);
					return (
						<Button
							key={opt.value}
							type="button"
							size="sm"
							variant={checked ? "default" : "outline"}
							disabled={disabled}
							onClick={() => toggle(opt.value)}
							className={cn(
								"h-7 rounded-full px-2.5 text-xs font-medium",
								!checked &&
									"border-input bg-background text-muted-foreground hover:text-foreground",
							)}
						>
							{opt.label}
						</Button>
					);
				})
			)}
		</div>
	);
}
