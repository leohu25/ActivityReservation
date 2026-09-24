"use client";

import React, { type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
	Table,
	TableHeader,
	TableBody,
	TableRow,
	TableHead,
	TableCell,
} from "../ui/table";
import { Button } from "../ui/button";
import { EmptyState } from "../feedback/EmptyState";
import { cn } from "../../lib/utils";

export interface DetailTableColumn<T> {
	readonly id: string;
	readonly header: ReactNode;
	readonly width?: number | string;
	readonly align?: "left" | "center" | "right";
	readonly className?: string;
	readonly renderCell: (
		row: T,
		index: number,
		onChange?: (updater: Partial<T> | ((prev: T) => T)) => void,
		error?: string,
	) => ReactNode;
}

export type DetailTableMode = "edit" | "view";

export interface DetailTableProps<T> {
	readonly columns: readonly DetailTableColumn<T>[];
	readonly data: readonly T[];
	readonly onChange?: (data: T[]) => void;
	readonly onAddRow?: () => T;
	readonly addText?: string;
	readonly minRows?: number;
	readonly readOnly?: boolean;
	readonly mode?: DetailTableMode;
	readonly emptyText?: string;
	readonly title?: string;
	readonly description?: string;
	readonly summary?: ReactNode;
	/** 针对单元格的校验错误字典，结构为：{ [`${rowIndex}.${fieldId}`]: "错误原因" } */
	readonly cellErrors?: Record<string, string>;
	readonly className?: string;
}

/**
 * 统一明细表组件 (DetailTable)
 * - 升级自原 EditableDetailTable，同时原生支持编辑（edit）与只读查看（view）双模式
 * - 纯基于 shadcn Table 系列组件与工业风 Card 构建
 * - view 模式下自动隐藏增删行操作并禁用单元格修改回调
 */
export function DetailTable<T>({
	columns,
	data,
	onChange,
	onAddRow,
	addText = "添加明细",
	minRows = 1,
	readOnly = false,
	mode = "edit",
	emptyText = "暂无明细数据",
	title,
	description,
	summary,
	cellErrors = {},
	className,
}: DetailTableProps<T>) {
	const isView = readOnly || mode === "view";

	const handleAdd = () => {
		if (isView || !onAddRow || !onChange) return;
		const newRow = onAddRow();
		onChange([...data, newRow]);
	};

	const handleRemove = (index: number) => {
		if (isView || !onChange) return;
		if (data.length <= minRows) {
			return;
		}
		onChange(data.filter((_, i) => i !== index));
	};

	const handleRowChange = (
		index: number,
		updater: Partial<T> | ((prev: T) => T),
	) => {
		if (isView || !onChange) return;
		const next = [...data];
		const prevRow = next[index];
		if (!prevRow) return;
		if (typeof updater === "function") {
			next[index] = (updater as (prev: T) => T)(prevRow);
		} else {
			next[index] = { ...prevRow, ...updater };
		}
		onChange(next);
	};

	return (
		<div className={cn("space-y-2", className)}>
			<div className="overflow-hidden rounded-xl border border-border/80 bg-card p-0 shadow-xs flex flex-col">
				{(title || description || (!isView && onAddRow && onChange)) && (
					<div className="flex flex-row items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/20">
						<div className="flex flex-col gap-0.5">
							{title && (
								<div className="text-xs font-semibold tracking-tight text-foreground">
									{title}
								</div>
							)}
							{description && (
								<p className="text-[11px] text-muted-foreground">
									{description}
								</p>
							)}
						</div>
						{!isView && onAddRow && onChange && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleAdd}
								className="h-7 text-xs shadow-xs shrink-0"
							>
								<Plus className="size-3 mr-1" />
								{addText}
							</Button>
						)}
					</div>
				)}
				<div className="relative w-full overflow-x-auto">
					<Table className="w-full text-xs">
						<TableHeader className="bg-muted/50 font-medium">
							<TableRow className="border-b border-border hover:bg-transparent">
								{columns.map((col) => (
									<TableHead
										key={col.id}
										style={col.width ? { width: col.width } : undefined}
										className={cn(
											"text-xs font-semibold text-muted-foreground h-9 px-3 whitespace-nowrap",
											col.align === "center" && "text-center",
											col.align === "right" && "text-right",
											col.className,
										)}
									>
										{col.header}
									</TableHead>
								))}
								{!isView && onChange && (
									<TableHead className="w-[50px] px-2 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">
										操作
									</TableHead>
								)}
							</TableRow>
						</TableHeader>
						<TableBody className="divide-y divide-border/60">
							{data.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={columns.length + (!isView && onChange ? 1 : 0)}
										className="p-6 text-center"
									>
										<EmptyState
											title={emptyText}
											description="当前无任何明细品项数据"
										/>
									</TableCell>
								</TableRow>
							) : (
								data.map((row, idx) => (
									<TableRow
										key={idx}
										className="hover:bg-muted/30 transition-colors"
									>
										{columns.map((col) => {
											const error = cellErrors[`${idx}.${col.id}`];
											return (
												<TableCell
													key={col.id}
													className={cn(
														"px-2.5 py-1.5 align-middle text-xs transition-colors",
														col.align === "center" && "text-center",
														col.align === "right" && "text-right",
														error && "bg-destructive/5 text-destructive",
													)}
												>
													<div className="flex flex-col gap-0.5">
														{col.renderCell(
															row,
															idx,
															isView
																? undefined
																: (updater) => handleRowChange(idx, updater),
															error,
														)}
														{error ? (
															<span className="text-[10px] text-destructive font-medium tracking-tight">
																{error}
															</span>
														) : null}
													</div>
												</TableCell>
											);
										})}
										{!isView && onChange && (
											<TableCell className="px-2 py-2 text-center align-middle">
												<Button
													type="button"
													variant="ghost"
													size="sm"
													disabled={data.length <= minRows}
													onClick={() => handleRemove(idx)}
													className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive disabled:opacity-30"
												>
													<Trash2 className="size-3.5" />
												</Button>
											</TableCell>
										)}
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
				{summary && (
					<div className="p-3 border-t border-border/60 bg-muted/20">
						{summary}
					</div>
				)}
			</div>
		</div>
	);
}
