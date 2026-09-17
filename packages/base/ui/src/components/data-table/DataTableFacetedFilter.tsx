"use client";

import type React from "react";
import type { ReactNode } from "react";
import { Check, PlusCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

export interface FacetedOption {
	label: string;
	value: string;
	icon?: React.ComponentType<{ className?: string }>;
	count?: number;
}

export interface DataTableFacetedFilterProps {
	title: string;
	icon?: ReactNode;
	options: readonly FacetedOption[];
	selectedValues?: Set<string> | readonly string[];
	onSelect?: (values: string[]) => void;
	className?: string;
	multiple?: boolean;
}

export function DataTableFacetedFilter({
	title,
	icon,
	options,
	selectedValues: controlledSelected,
	onSelect,
	className,
	multiple = true,
}: DataTableFacetedFilterProps) {
	const selectedSet = new Set(
		Array.isArray(controlledSelected)
			? controlledSelected
			: controlledSelected
				? Array.from(controlledSelected)
				: [],
	);

	const handleToggle = (value: string) => {
		if (!multiple) {
			if (selectedSet.has(value)) {
				onSelect?.([]);
			} else {
				onSelect?.([value]);
			}
			return;
		}

		const next = new Set(selectedSet);
		if (next.has(value)) {
			next.delete(value);
		} else {
			next.add(value);
		}
		onSelect?.(Array.from(next));
	};

	const handleClear = () => {
		onSelect?.([]);
	};

	return (
		<Popover>
			<PopoverTrigger
				render={
					<Button
						variant="outline"
						size="sm"
						className={cn(
							"h-8 border-dashed border-border/80 text-xs font-normal gap-1.5 px-2.5",
							className,
						)}
					/>
				}
			>
				{icon || <PlusCircle className="size-3.5 text-muted-foreground" />}
				<span>{title}</span>
				{selectedSet.size > 0 && (
					<>
						<div className="h-4 w-[1px] bg-border mx-1" />
						<Badge
							variant="secondary"
							className="rounded-sm px-1 font-normal lg:hidden"
						>
							{selectedSet.size}
						</Badge>
						<div className="hidden lg:flex gap-1">
							{selectedSet.size > 2 ? (
								<Badge
									variant="secondary"
									className="rounded-sm px-1 font-normal text-[10px]"
								>
									已选 {selectedSet.size} 项
								</Badge>
							) : (
								options.flatMap((opt) =>
									selectedSet.has(opt.value)
										? [
												<Badge
													variant="secondary"
													key={opt.value}
													className="rounded-sm px-1 font-normal text-[10px]"
												>
													{opt.label}
												</Badge>,
											]
										: [],
								)
							)}
						</div>
					</>
				)}
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-1" align="start">
				<div className="flex flex-col gap-1 p-1">
					{options.map((option) => {
						const isSelected = selectedSet.has(option.value);
						return (
							<div
								key={option.value}
								onClick={() => handleToggle(option.value)}
								className={cn(
									"flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs cursor-pointer select-none transition-colors",
									"hover:bg-accent hover:text-accent-foreground",
									isSelected && "bg-accent/60 font-medium",
								)}
							>
								<div
									className={cn(
										"flex size-4 items-center justify-center rounded-sm border border-primary/40",
										isSelected
											? "bg-primary text-primary-foreground border-primary"
											: "opacity-50 [&_svg]:invisible",
									)}
								>
									<Check className="size-3" />
								</div>
								{option.icon && (
									<option.icon className="size-3.5 text-muted-foreground" />
								)}
								<span className="flex-1 truncate">{option.label}</span>
								{option.count !== undefined && (
									<span className="font-mono text-[10px] text-muted-foreground">
										{option.count}
									</span>
								)}
							</div>
						);
					})}
				</div>
				{selectedSet.size > 0 && (
					<div className="border-t border-border/60 p-1 mt-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleClear}
							className="w-full justify-center text-xs h-7 text-muted-foreground hover:text-foreground"
						>
							重置筛选
						</Button>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}
