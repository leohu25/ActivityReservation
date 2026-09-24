"use client";

import { Badge, DataTableRowActions, type ColumnDef } from "@base/ui";
import { StandardAction } from "@base/authorization";
import { MasterDataStatus } from "@base/shared";
import { Sliders } from "lucide-react";
import {
	OperationField,
	ProcessAction,
} from "../contract";
import type { OperationListItem } from "../types";

export interface CreateOperationColumnsOptions {
	onView: (record: OperationListItem) => void;
	onEdit: (record: OperationListItem) => void;
	onDelete: (id: string) => void;
	onToggleStatus: (id: string, currentStatus: string) => void;
}

export function createOperationColumns({
	onView,
	onEdit,
	onDelete,
	onToggleStatus,
}: CreateOperationColumnsOptions): ColumnDef<OperationListItem>[] {
	return [
		{
			id: OperationField.CODE,
			field: OperationField.CODE,
			header: "工序编码",
			width: 140,
			cell: (row) => (
				<button
					type="button"
					onClick={() => onView(row)}
					className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer text-left"
				>
					{row.code}
				</button>
			),
		},
		{
			id: OperationField.NAME,
			field: OperationField.NAME,
			header: "工序名称",
			width: 160,
			cell: (row) => (
				<div className="flex flex-col">
					<span className="font-medium text-xs text-foreground">
						{row.name}
					</span>
					{row.sopText && (
						<span
							className="text-[11px] text-muted-foreground truncate max-w-[200px]"
							title={row.sopText}
						>
							{row.sopText}
						</span>
					)}
				</div>
			),
		},
		{
			id: OperationField.OPERATION_CATEGORY_DICT_ITEM_ID,
			field: OperationField.OPERATION_CATEGORY_DICT_ITEM_ID,
			header: "工序分类",
			width: 120,
			cell: (row) => (
				<Badge variant="outline" className="text-[11px] font-normal">
					{row.categoryName}
				</Badge>
			),
		},
		{
			id: "specifications",
			header: "工艺规格明细",
			width: 130,
			cell: (row) => (
				<div className="flex items-center gap-1.5">
					<Sliders className="size-3 text-muted-foreground" />
					<Badge
						variant={row.specificationsCount > 0 ? "secondary" : "outline"}
						className={`text-[11px] font-mono ${
							row.specificationsCount > 0
								? "bg-primary/10 text-primary hover:bg-primary/15"
								: "text-muted-foreground"
						}`}
					>
						{row.specificationsCount > 0
							? `${row.specificationsCount} 项规格`
							: "暂无规格"}
					</Badge>
				</div>
			),
		},
		{
			id: OperationField.DEFAULT_YIELD_RATE,
			field: OperationField.DEFAULT_YIELD_RATE,
			header: "参考出成率",
			width: 110,
			cell: (row) => (
				<span className="font-mono text-xs">
					{row.defaultYieldRate !== null && row.defaultYieldRate !== undefined
						? `${(row.defaultYieldRate * 100).toFixed(2)}%`
						: "-"}
				</span>
			),
		},
		{
			id: "duration",
			header: "准备 / 清理耗时",
			width: 130,
			cell: (row) => (
				<span className="font-mono text-xs text-muted-foreground">
					{row.defaultSetupMinutes} / {row.defaultCleanupMinutes} 分钟
				</span>
			),
		},
		{
			id: OperationField.MINIMUM_BATCH_QUANTITY,
			field: OperationField.MINIMUM_BATCH_QUANTITY,
			header: "最小批量",
			width: 120,
			cell: (row) => (
				<span className="font-mono text-xs">
					{row.minimumBatchQuantity !== null &&
					row.minimumBatchQuantity !== undefined
						? `${row.minimumBatchQuantity} ${row.minimumBatchUnitName || ""}`
						: "-"}
				</span>
			),
		},
		{
			id: OperationField.STATUS,
			field: OperationField.STATUS,
			header: "状态",
			width: 90,
			cell: (row) => {
				const isActive = row.status === MasterDataStatus.ACTIVE;
				return (
					<Badge
						variant="outline"
						className={`text-[11px] ${
							isActive
								? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
								: "border-muted-foreground/30 bg-muted/40 text-muted-foreground"
						}`}
					>
						{isActive ? "正常启用" : "已停用"}
					</Badge>
				);
			},
		},
		{
			id: "updatedAt",
			header: "更新时间",
			width: 140,
			cell: (row) => (
				<span className="font-mono text-[11px] text-muted-foreground">
					{new Date(row.updatedAt).toLocaleString("zh-CN", {
						month: "2-digit",
						day: "2-digit",
						hour: "2-digit",
						minute: "2-digit",
					})}
				</span>
			),
		},
		{
			id: "actions",
			header: "操作",
			width: 160,
			align: "right",
			cell: (row) => (
				<DataTableRowActions<OperationListItem>
					record={row}
					onView={(r) => onView(r)}
					onEdit={(r) => onEdit(r)}
					onDelete={(r) => onDelete(r.id)}
					deleteConfirm={{
						title: `确认删除工序 "${row.name}"？`,
						description:
							"删除后该工序及其下挂的工艺规格将无法在生产BOM中选用。若已被BOM引用则无法删除。",
						confirmText: "确认删除",
						cancelText: "取消",
					}}
					extraActions={[
						{
							label:
								row.status === MasterDataStatus.ACTIVE ? "停用" : "启用",
							action: ProcessAction.TOGGLE_STATUS,
							inlineClassName:
								row.status === MasterDataStatus.ACTIVE
									? "text-amber-600 hover:text-amber-700"
									: "text-emerald-600 hover:text-emerald-700",
							onClick: () => onToggleStatus(row.id, row.status),
						},
					]}
				/>
			),
		},
	];
}
