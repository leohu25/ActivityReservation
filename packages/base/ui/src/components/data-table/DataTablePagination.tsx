"use client";

import type React from "react";
import { useMemo } from "react";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "../ui/pagination";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { useDataTableContext } from "./DataTableContext";
import { cn } from "../../lib/utils";

export interface DataTablePaginationProps {
	pageSizeOptions?: readonly number[];
	/** 是否显示「显示第 X-Y 条」范围文案，默认 true */
	showRange?: boolean;
	/** 数字页码窗口大小（当前页左右各展示多少页），默认 1 */
	siblingCount?: number;
	className?: string;
}

/** 生成紧凑页码序列：[1, '…', 4, 5, 6, '…', 20] */
function buildPageItems(
	current: number,
	total: number,
	siblingCount: number,
): Array<number | "ellipsis"> {
	const pages = new Set<number>();
	pages.add(1);
	pages.add(total);
	pages.add(current);
	for (let i = 1; i <= siblingCount; i += 1) {
		if (current - i >= 1) pages.add(current - i);
		if (current + i <= total) pages.add(current + i);
	}
	const sorted = Array.from(pages).sort((a, b) => a - b);
	const items: Array<number | "ellipsis"> = [];
	let prev = 0;
	for (const p of sorted) {
		if (prev && p - prev > 1) {
			items.push("ellipsis");
		}
		items.push(p);
		prev = p;
	}
	return items;
}

/**
 * 紧凑分页条：组合官方 shadcn Pagination 原语 + Select。
 * 保留工业风「共 N 条 / 范围 / 条/页」信息密度。
 */
export function DataTablePagination({
	pageSizeOptions = [10, 20, 50, 100],
	showRange = true,
	siblingCount = 1,
	className,
}: DataTablePaginationProps) {
	const {
		page = 1,
		pageSize = 10,
		total = 0,
		onPageChange,
	} = useDataTableContext();

	const totalPages = useMemo(
		() => Math.max(1, Math.ceil(total / pageSize)),
		[total, pageSize],
	);
	const canPreviousPage = page > 1;
	const canNextPage = page < totalPages;

	const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
	const rangeEnd = Math.min(page * pageSize, total);

	const pageItems = useMemo(
		() => buildPageItems(page, totalPages, siblingCount),
		[page, totalPages, siblingCount],
	);

	const handlePageChange = (newPage: number) => {
		if (newPage < 1 || newPage > totalPages) return;
		onPageChange?.(newPage, pageSize);
	};

	const handlePageSizeChange = (newSizeStr: string) => {
		const newSize = Number(newSizeStr);
		onPageChange?.(1, newSize);
	};

	const go = (newPage: number) => (e: React.MouseEvent) => {
		e.preventDefault();
		handlePageChange(newPage);
	};

	return (
		<div
			className={cn(
				"flex flex-wrap items-center justify-between gap-3 px-1 py-1 text-xs text-muted-foreground",
				className,
			)}
		>
			<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
				<span>
					共{" "}
					<span className="font-semibold text-foreground font-mono">
						{total}
					</span>{" "}
					条
				</span>
				{showRange && total > 0 ? (
					<span className="text-muted-foreground/80">
						显示第{" "}
						<span className="font-mono tabular-nums text-foreground">
							{rangeStart}-{rangeEnd}
						</span>{" "}
						条
					</span>
				) : null}
			</div>

			<div className="flex items-center gap-3">
				<div className="flex items-center gap-1.5">
					<Select
						value={String(pageSize)}
						onValueChange={(value) => {
							if (value !== null) handlePageSizeChange(value);
						}}
					>
						<SelectTrigger className="h-7 min-w-[72px] w-auto px-2.5 gap-1 text-xs [&_svg]:size-3.5">
							<SelectValue placeholder={String(pageSize)} />
						</SelectTrigger>
						<SelectContent side="top">
							<SelectGroup>
								{pageSizeOptions.map((size) => (
									<SelectItem
										key={size}
										value={String(size)}
										className="text-xs"
									>
										{size}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
					<span className="text-xs">条/页</span>
				</div>

				<Pagination className="mx-0 w-auto justify-end">
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								href="#"
								text="上一页"
								aria-disabled={!canPreviousPage}
								className={cn(
									"h-7 gap-0 px-2 text-xs",
									!canPreviousPage && "pointer-events-none opacity-50",
								)}
								onClick={go(page - 1)}
							/>
						</PaginationItem>

						{pageItems.map((item, idx) =>
							item === "ellipsis" ? (
								<PaginationItem key={`e-${idx}`}>
									<span className="inline-flex size-7 items-center justify-center text-muted-foreground">
										…
									</span>
								</PaginationItem>
							) : (
								<PaginationItem key={item}>
									<PaginationLink
										href="#"
										isActive={item === page}
										size="icon"
										className="size-7 font-mono text-xs"
										onClick={go(item)}
									>
										{item}
									</PaginationLink>
								</PaginationItem>
							),
						)}

						<PaginationItem>
							<PaginationNext
								href="#"
								text="下一页"
								aria-disabled={!canNextPage}
								className={cn(
									"h-7 gap-0 px-2 text-xs",
									!canNextPage && "pointer-events-none opacity-50",
								)}
								onClick={go(page + 1)}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			</div>
		</div>
	);
}

export const TablePagination = DataTablePagination;
export type TablePaginationProps = DataTablePaginationProps;
