import { useMemo } from "react";
import { Network } from "lucide-react";
import { Badge, DataTableRowActions, type ColumnDef } from "@base/ui";
import { StandardAction } from "@base/authorization";
import { BomAction, BomField } from "../../contract";
import type { BomListItemDto } from "../../types";

const TYPE_VARIANT_MAP: Record<string, "default" | "secondary" | "outline"> = {
	PROCESSING: "default",
	FORMULA: "secondary",
	PACKAGING: "outline",
};

export interface UseBomColumnsOptions {
	readonly onView: (row: BomListItemDto) => void;
	readonly onEdit: (row: BomListItemDto) => void;
	readonly onViewGraph: (row: BomListItemDto) => void;
	readonly onSetDefault: (row: BomListItemDto) => void;
	readonly onDelete: (id: string) => void;
	readonly onPublish: (row: BomListItemDto) => void;
}

export function useBomColumns({
	onView,
	onEdit,
	onViewGraph,
	onSetDefault,
	onDelete,
	onPublish,
}: UseBomColumnsOptions): ColumnDef<BomListItemDto>[] {
	return useMemo(
		() => [
			{
				id: "index",
				header: "序号",
				width: 60,
				align: "center",
				cell: (_row, idx) => (
					<span className="font-mono text-xs text-muted-foreground">
						{idx + 1}
					</span>
				),
			},
			{
				id: "name",
				field: BomField.NAME,
				header: "BOM名称",
				cell: (row) => (
					<div className="flex items-center gap-1.5">
						{row.isDefault && (
							<Badge
								variant="default"
								size="sm"
								className="bg-blue-600 hover:bg-blue-600 text-[10px] py-0 h-4 px-1.5 shrink-0"
							>
								默认
							</Badge>
						)}
						{row.versionStatus === "DRAFT" && (
							<Badge
								variant="secondary"
								size="sm"
								className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] py-0 h-4 px-1.5 shrink-0"
							>
								草稿 v{row.versionNumber}
							</Badge>
						)}
						<button
							type="button"
							onClick={() => onView(row)}
							className="font-semibold text-blue-600 dark:text-blue-400 hover:underline text-left text-xs truncate max-w-xs cursor-pointer"
						>
							{row.name}
						</button>
					</div>
				),
			},
			{
				id: "code",
				field: BomField.CODE,
				header: "BOM编码",
				width: 140,
				cell: (row) => (
					<span className="font-mono text-xs text-muted-foreground">
						{row.code}
					</span>
				),
			},
			{
				id: "productionLine",
				field: BomField.PRODUCTION_LINE_ID,
				header: "生产产线",
				width: 140,
				cell: (row) => (
					<span className="text-xs text-foreground">
						{row.productionLineName || "-"}
					</span>
				),
			},
			{
				id: "productName",
				field: BomField.PRODUCT_ID,
				header: "商品名称",
				width: 150,
				cell: (row) => (
					<span className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate">
						{row.productName}
					</span>
				),
			},
			{
				id: "productCode",
				header: "商品编码",
				width: 120,
				cell: (row) => (
					<span className="font-mono text-xs text-muted-foreground">
						{row.productCode}
					</span>
				),
			},
			{
				id: "category",
				header: "商品分类",
				width: 130,
				cell: (row) => (
					<span className="text-xs text-muted-foreground">
						{row.productCategoryName || "-"}
					</span>
				),
			},
			{
				id: "bomType",
				field: BomField.BOM_TYPE,
				header: "BOM类型",
				width: 90,
				align: "center",
				cell: (row) => (
					<Badge
						variant={TYPE_VARIANT_MAP[row.bomType] ?? "secondary"}
						size="sm"
					>
						{row.bomTypeLabel}
					</Badge>
				),
			},
			{
				id: "operations",
				header: "工序",
				cell: (row) => (
					<div className="flex flex-wrap gap-1 text-xs">
						{row.operations.length > 0 ? (
							row.operations.map((op, i) => (
								<span
									key={i}
									className="text-muted-foreground hover:text-foreground text-xs"
								>
									{op}
									{i < row.operations.length - 1 ? "，" : ""}
								</span>
							))
						) : (
							<span className="text-muted-foreground">-</span>
						)}
					</div>
				),
			},
			{
				id: "actions",
				header: "操作",
				width: 200,
				align: "right",
				cell: (row) => (
					<DataTableRowActions<BomListItemDto>
						record={row}
						onView={(r) => onView(r)}
						onEdit={(r) => onEdit(r)}
						onDelete={(r) => onDelete(r.id)}
						deleteConfirm={{
							title: `确认删除 BOM 方案 "${row.name}"？`,
							description: "删除后该方案及其所有历史版本将被软删除归档。",
							confirmText: "确认删除",
							cancelText: "取消",
						}}
						extraActions={[
							{
								label: "图谱",
								action: StandardAction.READ,
								icon: <Network className="size-3.5" />,
								onClick: () => onViewGraph(row),
							},
							...(!row.isDefault
								? [
										{
											label: "设为默认",
											action: BomAction.SET_DEFAULT,
											inlineClassName: "text-amber-600 hover:text-amber-800",
											onClick: () => onSetDefault(row),
										},
									]
								: []),
							...(row.versionStatus === "DRAFT"
								? [
										{
											label: "发布",
											action: BomAction.PUBLISH,
											inlineClassName:
												"text-emerald-600 hover:text-emerald-800 font-bold",
											confirm: {
												title: `确认发布 BOM 方案 "${row.name}"？`,
												description:
													"发布后该版本将切换为生效标准，只影响后续未生成的生产计划，已生成的计划不受影响。",
												confirmText: "确认发布",
												cancelText: "取消",
											},
											onClick: () => onPublish(row),
										},
									]
								: []),
						]}
					/>
				),
			},
		],
		[onView, onEdit, onViewGraph, onSetDefault, onDelete, onPublish],
	);
}
