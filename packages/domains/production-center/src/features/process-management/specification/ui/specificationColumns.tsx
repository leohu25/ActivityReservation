"use client";

import { Input, Switch, type DetailTableColumn } from "@base/ui";
import { MasterDataStatus } from "@base/shared";
import type { ProcessingSpecificationInput } from "../types";

export interface CreateSpecificationColumnsOptions {
	readonly isView?: boolean;
}

export function createSpecificationColumns({
	isView = false,
}: CreateSpecificationColumnsOptions = {}): DetailTableColumn<ProcessingSpecificationInput>[] {
	return [
		{
			id: "code",
			header: "规格编码",
			width: 200,
			renderCell: (row, _index, onChange) =>
				isView ? (
					<span className="font-mono text-xs font-semibold">{row.code}</span>
				) : (
					<Input
						value={row.code}
						placeholder="如 CUT_SLICE_3MM"
						onChange={(e) => onChange?.({ code: e.target.value })}
						className="h-8 font-mono text-xs"
					/>
				),
		},
		{
			id: "name",
			header: "规格名称",
			width: 200,
			renderCell: (row, _index, onChange) =>
				isView ? (
					<span className="text-xs font-medium">{row.name}</span>
				) : (
					<Input
						value={row.name}
						placeholder="如 切片3mm"
						onChange={(e) => onChange?.({ name: e.target.value })}
						className="h-8 text-xs font-medium"
					/>
				),
		},
		{
			id: "defaultYieldRate",
			header: "参考出成率 (%)",
			width: 150,
			renderCell: (row, _index, onChange) =>
				isView ? (
					<span className="font-mono text-xs">
						{row.defaultYieldRate !== null && row.defaultYieldRate !== undefined
							? `${(row.defaultYieldRate * (row.defaultYieldRate <= 1 ? 100 : 1)).toFixed(2)}%`
							: "-"}
					</span>
				) : (
					<div className="relative">
						<Input
							type="number"
							step="0.1"
							min="0"
							max="100"
							value={
								row.defaultYieldRate !== null &&
								row.defaultYieldRate !== undefined
									? row.defaultYieldRate <= 1
										? row.defaultYieldRate * 100
										: row.defaultYieldRate
									: ""
							}
							placeholder="如 95"
							onChange={(e) => {
								const val = e.target.value;
								onChange?.({
									defaultYieldRate: val === "" ? null : Number(val),
								});
							}}
							className="h-8 pr-7 font-mono text-xs"
						/>
						<span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
							%
						</span>
					</div>
				),
		},
		{
			id: "description",
			header: "加工说明 / 工艺要求",
			renderCell: (row, _index, onChange) =>
				isView ? (
					<span className="text-xs text-muted-foreground">
						{row.description || "-"}
					</span>
				) : (
					<Input
						value={row.description ?? ""}
						placeholder="选此规格时自动带入BOM工艺指引说明..."
						onChange={(e) => onChange?.({ description: e.target.value })}
						className="h-8 text-xs"
					/>
				),
		},
		{
			id: "status",
			header: "状态",
			width: 90,
			align: "center",
			renderCell: (row, _index, onChange) => {
				const isActive = row.status === MasterDataStatus.ACTIVE;
				return isView ? (
					<span
						className={`inline-block size-2 rounded-full ${
							isActive ? "bg-emerald-500" : "bg-muted-foreground"
						}`}
						title={isActive ? "启用" : "停用"}
					/>
				) : (
					<Switch
						checked={row.status !== MasterDataStatus.DISABLED}
						onCheckedChange={(checked) =>
							onChange?.({
								status: checked
									? MasterDataStatus.ACTIVE
									: MasterDataStatus.DISABLED,
							})
						}
						className="scale-90"
					/>
				);
			},
		},
	];
}
