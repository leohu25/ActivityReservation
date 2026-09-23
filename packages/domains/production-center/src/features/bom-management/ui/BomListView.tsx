"use client";

import React, { useMemo, useCallback, useState } from "react";
import {
	DataTable,
	DataTableInputGroup,
	Badge,
	Combobox,
	ConfirmDialog,
	toast,
	useListSearch,
	useSafeRouter,
	type ColumnDef,
} from "@base/ui";
import { exportContractCsv } from "@base/shared";
import { useAbility } from "@base/authorization";
import {
	BOM_TYPES,
	BOM_TYPE_OPTIONS,
	BomSubject,
	bomSearchParams,
	type BomType,
} from "../contract";
import type {
	BomDetailDto,
	BomFormOptions,
	BomListItemDto,
} from "../types";
import {
	deleteBomAction,
	setDefaultBomAction,
	getBomDetailAction,
	publishBomVersionAction,
} from "../actions";
import { BomDetailDrawer } from "./BomDetailDrawer";

export interface BomListViewProps {
	readonly data: readonly BomListItemDto[];
	readonly total: number;
	readonly formOptions: BomFormOptions;
}

const TYPE_VARIANT_MAP: Record<string, "default" | "secondary" | "outline"> = {
	PROCESSING: "default",
	FORMULA: "secondary",
	PACKAGING: "outline",
};

export function BomListView({ data, total, formOptions }: BomListViewProps) {
	const ability = useAbility();
	const list = useListSearch(bomSearchParams);
	const router = useSafeRouter();

	// 流程图谱抽屉状态
	const [detailDrawerOpen, setDetailDrawerOpen] = useState<boolean>(false);
	const [activeDetail, setActiveDetail] = useState<BomDetailDto | null>(null);

	// 当前选中的 Tab 类型 ("ALL" | "PROCESSING" | "FORMULA" | "PACKAGING")
	const activeTypeTab = (list.params.bomType as string) || "ALL";

	// 切换 Tab 类型
	const handleTabChange = useCallback(
		(type: string) => {
			list.patch({
				bomType: type === "ALL" ? "" : type,
			});
		},
		[list],
	);

	// 打开新建页面 (全屏 FormPage 独立路由)
	const handleCreate = useCallback(() => {
		router?.push("/production/bom/new");
	}, [router]);

	// 打开全屏查看 (只读态)
	const handleView = useCallback(
		(item: BomListItemDto) => {
			router?.push(`/production/bom/${item.id}?mode=view`);
		},
		[router],
	);

	// 打开全屏编辑 (编辑态)
	const handleEdit = useCallback(
		(item: BomListItemDto) => {
			router?.push(`/production/bom/${item.id}?mode=edit`);
		},
		[router],
	);

	// 打开流程图谱抽屉并异步获取真实 BOM 详情（投入、产出、工序）
	const handleViewGraph = useCallback(async (item: BomListItemDto) => {
		// 先以骨架占位展开抽屉
		const skeletonDetail: BomDetailDto = {
			id: item.id,
			lifecycleStatus: "ACTIVE",
			isDefault: item.isDefault,
			primaryProduct: {
				id: item.productId,
				code: item.productCode,
				name: item.productName,
				categoryName: item.productCategoryName,
			},
			currentVersion: {
				id: item.versionId,
				bomId: item.id,
				versionNumber: item.versionNumber,
				versionStatus: item.versionStatus,
				code: item.code,
				name: item.name,
				bomType: item.bomType,
				productionLineId: item.productionLineId,
				productionLineName: item.productionLineName,
				quantityMode: "FIXED",
				totalYieldEnabled: false,
				inputs: [],
				outputs: [
					{
						productId: item.productId,
						productName: item.productName,
						productCode: item.productCode,
						quantity: 1,
						unitId: "",
						outputRole: "PRIMARY",
						sortOrder: 0,
					},
				],
				operations: item.operations.map((opName, idx) => ({
					operationId: `op-${idx}`,
					operationName: opName,
					sequenceNumber: (idx + 1) * 10,
					qualityCheckpoint: false,
					sortOrder: idx,
				})),
			},
			versionHistory: [
				{
					id: item.versionId,
					versionNumber: item.versionNumber,
					versionStatus: item.versionStatus,
					code: item.code,
					name: item.name,
				},
			],
		};
		setActiveDetail(skeletonDetail);
		setDetailDrawerOpen(true);

		try {
			// 传入 undefined 即默认拉取当前最新/发布版本，并获取服务器实时的完整 versionHistory 列表
			const res = await getBomDetailAction(item.id);
			if (res.success && res.data) {
				setActiveDetail(res.data);
			}
		} catch (err: unknown) {
			console.error("加载 BOM 详情失败:", err);
		}
	}, []);

	// 在抽屉内切换版本时重新拉取对应版本详情
	const handleSelectVersion = useCallback(async (versionNumber: number) => {
		if (!activeDetail) return;
		try {
			const res = await getBomDetailAction(activeDetail.id, versionNumber);
			if (res.success && res.data) {
				setActiveDetail(res.data);
			}
		} catch (err: unknown) {
			console.error("切换 BOM 版本失败:", err);
		}
	}, [activeDetail]);

	// 一键发布草稿版本
	const handlePublish = useCallback(
		async (item: BomListItemDto) => {
			try {
				const res = await publishBomVersionAction(item.id, item.versionNumber);
				if (res.success) {
					toast.success(`已成功发布 BOM [${item.name}] 版本 ${item.versionNumber}`);
				} else {
					toast.error(res.error || "发布失败");
				}
			} catch (err: unknown) {
				toast.error(err instanceof Error ? err.message : "发布异常");
			}
		},
		[],
	);

	// 设置默认方案
	const handleSetDefault = useCallback(
		async (item: BomListItemDto) => {
			try {
				const res = await setDefaultBomAction(item.productId, item.id);
				if (res.success) {
					toast.success(`已成功将 [${item.name}] 设为商品默认BOM`);
				} else {
					toast.error(res.error || "设置默认BOM失败");
				}
			} catch (err: unknown) {
				toast.error(err instanceof Error ? err.message : "操作异常");
			}
		},
		[],
	);

	// 删除 BOM
	const handleDelete = useCallback(
		async (id: string) => {
			try {
				const res = await deleteBomAction(id);
				if (res.success) {
					toast.success("BOM 方案已成功删除");
				} else {
					toast.error(res.error || "删除失败");
				}
			} catch (err: unknown) {
				toast.error(err instanceof Error ? err.message : "操作异常");
			}
		},
		[],
	);

	// 导出 CSV
	const handleExport = useCallback(() => {
		exportContractCsv(data as any, [], {
			subject: BomSubject,
			ability,
			filename: `生产BOM清单_${new Date().toISOString().slice(0, 10)}.csv`,
		});
	}, [data, ability]);

	// 表格列定义 (严格对齐观麦原型)
	const columns: ColumnDef<BomListItemDto>[] = useMemo(
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
							onClick={() => handleView(row)}
							className="font-semibold text-blue-600 dark:text-blue-400 hover:underline text-left text-xs truncate max-w-xs"
						>
							{row.name}
						</button>
					</div>
				),
			},
			{
				id: "code",
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
				width: 220,
				align: "right",
				cell: (row) => (
					<div className="flex items-center justify-end gap-1.5 text-xs">
						{row.versionStatus === "DRAFT" && (
							<ConfirmDialog
								trigger={
									<button
										type="button"
										className="text-emerald-600 hover:text-emerald-800 font-bold hover:underline px-1"
									>
										发布
									</button>
								}
								title={`确认发布 BOM 方案 "${row.name}"？`}
								description="发布后该版本将切换为生效标准，只影响后续未生成的生产计划，已生成的计划不受影响。"
								confirmText="确认发布"
								cancelText="取消"
								onConfirm={() => handlePublish(row)}
							/>
						)}
						<button
							type="button"
							onClick={() => handleView(row)}
							className="text-blue-600 hover:text-blue-800 font-medium hover:underline px-1"
						>
							详情
						</button>
						<button
							type="button"
							onClick={() => handleEdit(row)}
							className="text-blue-600 hover:text-blue-800 font-medium hover:underline px-1"
						>
							编辑
						</button>
						<button
							type="button"
							onClick={() => handleViewGraph(row)}
							className="text-muted-foreground hover:text-foreground font-medium hover:underline px-1"
						>
							图谱
						</button>
						{!row.isDefault && (
							<button
								type="button"
								onClick={() => handleSetDefault(row)}
								className="text-amber-600 hover:text-amber-800 font-medium hover:underline px-1"
							>
								设为默认
							</button>
						)}
						<ConfirmDialog
							trigger={
								<button
									type="button"
									className="text-destructive hover:text-destructive/80 font-medium hover:underline px-1"
								>
									删除
								</button>
							}
							title={`确认删除 BOM 方案 "${row.name}"？`}
							description="删除后该方案及其所有历史版本将被软删除归档。"
							confirmText="确认删除"
							cancelText="取消"
							onConfirm={() => handleDelete(row.id)}
						/>
					</div>
				),
			},
		],
		[handleView, handleEdit, handleViewGraph, handleSetDefault, handleDelete, handlePublish],
	);

	return (
		<div className="space-y-4">
			{/* 1. 顶部类型切换标签栏 (观麦高保真交互: 全部 | 单品 | 组合 | 包装) */}
			<div className="flex items-center border-b border-border bg-background px-2 pt-2 gap-6">
				{BOM_TYPE_OPTIONS.map((tab) => {
					const isActive = activeTypeTab === tab.value;
					return (
						<button
							key={tab.value}
							type="button"
							onClick={() => handleTabChange(tab.value)}
							className={`relative pb-2.5 text-sm font-semibold transition-colors ${
								isActive
									? "text-blue-600 font-bold"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							{tab.label}
							{isActive && (
								<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
							)}
						</button>
					);
				})}
			</div>

			{/* 2. 主列表 DataTable */}
			<DataTable<BomListItemDto>
				data={data as BomListItemDto[]}
				columns={columns}
				rowKey={(r) => r.id}
				subject={BomSubject}
				title="生产BOM管理"
				description="维护单品加工、组合配方与包装装配三大类生产 BOM 方案、原料投入与工艺工序路线。"
				total={total}
				{...list.dataTableProps}
				onExport={handleExport}
				onCreate={handleCreate}
				createText="新建生产BOM"
				keywordPlaceholder="请输入BOM名称/BOM编码/商品名称..."
				filterExtra={
					<DataTableInputGroup label="商品分类" className="w-48">
						<Combobox
							value={String(list.params.categoryId || "")}
							options={formOptions.categories.map((c) => ({
								value: c.id,
								label: `${c.name} (${c.code})`,
							}))}
							placeholder="全部分类"
							clearable={true}
							onChange={(val) => list.patch({ categoryId: val || "" })}
						/>
					</DataTableInputGroup>
				}
			/>

			{/* 3. 查看流程图谱抽屉 */}
			<BomDetailDrawer
				open={detailDrawerOpen}
				onOpenChange={setDetailDrawerOpen}
				detail={activeDetail}
				onEdit={(detail) => {
					setDetailDrawerOpen(false);
					router?.push(`/production/bom/${detail.id}?mode=edit`);
				}}
				onSelectVersion={handleSelectVersion}
				onPublishVersion={async (bomId, versionNum) => {
					try {
						const res = await publishBomVersionAction(bomId, versionNum);
						if (res.success) {
							toast.success(`已成功发布版本 ${versionNum}`);
							// 刷新抽屉详情
							handleSelectVersion(versionNum);
						} else {
							toast.error(res.error || "发布失败");
						}
					} catch (err: unknown) {
						toast.error(err instanceof Error ? err.message : "发布异常");
					}
				}}
			/>
		</div>
	);
}
