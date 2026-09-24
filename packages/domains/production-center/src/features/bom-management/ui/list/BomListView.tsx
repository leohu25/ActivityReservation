"use client";

import { useCallback, useState } from "react";
import {
	DataTable,
	DataTableInputGroup,
	Combobox,
	toast,
	useListSearch,
	useSafeRouter,
} from "@base/ui";
import { exportContractCsv } from "@base/shared";
import { useAbility } from "@base/authorization";
import {
	BOM_TYPE_OPTIONS,
	BomSubject,
	bomSearchParams,
} from "../../contract";
import type {
	BomDetailDto,
	BomFormOptions,
	BomListItemDto,
} from "../../types";
import {
	deleteBomAction,
	setDefaultBomAction,
	getBomDetailAction,
	publishBomVersionAction,
} from "../../actions";
import { BomDetailDrawer } from "../detail";
import { useBomColumns } from "./columns";

export interface BomListViewProps {
	readonly data: readonly BomListItemDto[];
	readonly total: number;
	readonly formOptions: BomFormOptions;
}

/**
 * 生产 BOM 方案列表主视图积木
 */
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
			const res = await getBomDetailAction(item.id);
			if (res.success && res.data) {
				setActiveDetail(res.data);
			}
		} catch (err: unknown) {
			console.error("加载 BOM 详情失败:", err);
		}
	}, []);

	// 在抽屉内切换版本时重新拉取对应版本详情
	const handleSelectVersion = useCallback(
		async (versionNumber: number) => {
			if (!activeDetail) return;
			try {
				const res = await getBomDetailAction(activeDetail.id, versionNumber);
				if (res.success && res.data) {
					setActiveDetail(res.data);
				}
			} catch (err: unknown) {
				toast.error("版本切换加载失败");
			}
		},
		[activeDetail],
	);

	// 设置默认 BOM
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

	// 快速发布草稿版本
	const handlePublish = useCallback(
		async (item: BomListItemDto) => {
			try {
				const res = await publishBomVersionAction(item.id, item.versionNumber);
				if (res.success) {
					toast.success(`已成功发布版本 v${item.versionNumber}`);
					if (activeDetail?.id === item.id) {
						handleSelectVersion(item.versionNumber);
					}
				} else {
					toast.error(res.error || "发布失败");
				}
			} catch (err: unknown) {
				toast.error(err instanceof Error ? err.message : "操作异常");
			}
		},
		[activeDetail, handleSelectVersion],
	);

	// 导出 CSV
	const handleExport = useCallback(() => {
		// SAFETY: BomListItemDto 兼容 CSV 导出纯对象键值记录
		exportContractCsv(data as unknown as readonly Record<string, unknown>[], [], {
			subject: BomSubject,
			ability,
			filename: `生产BOM清单_${new Date().toISOString().slice(0, 10)}.csv`,
		});
	}, [data, ability]);

	// 表格列定义
	const columns = useBomColumns({
		onView: handleView,
		onEdit: handleEdit,
		onViewGraph: handleViewGraph,
		onSetDefault: handleSetDefault,
		onDelete: handleDelete,
		onPublish: handlePublish,
	});

	// 1. 标题右侧分类 Tab 栏插槽：高对比度主色胶囊，选中态醒目突出
	const typeTabsSlot = (
		<div className="flex items-center gap-1 bg-muted/80 p-0.5 rounded-lg border border-border/80">
			{BOM_TYPE_OPTIONS.map((tab) => {
				const isActive = activeTypeTab === tab.value;
				return (
					<button
						key={tab.value}
						type="button"
						onClick={() => handleTabChange(tab.value)}
						className={`px-3 py-1 text-xs rounded-md font-semibold transition-all cursor-pointer ${
							isActive
								? "bg-primary text-primary-foreground shadow-xs"
								: "text-muted-foreground hover:text-foreground hover:bg-background/60"
						}`}
					>
						{tab.label}
					</button>
				);
			})}
		</div>
	);

	return (
		<>
			{/* 主列表 DataTable：左侧[标题 + 分类Tab]，右侧[刷新/列设置/新建BOM]，彻底消灭冗余空白与副标题 */}
			<DataTable<BomListItemDto>
				data={data as BomListItemDto[]}
				columns={columns}
				rowKey={(r) => r.id}
				subject={BomSubject}
				title="生产BOM管理"
				headerExtra={typeTabsSlot}
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
				onNavigateBom={(_targetBomId) => {
					// 抽屉内部自闭环维护多级导航栈与无损回溯，外部无需覆写根状态
				}}
				onPublishVersion={async (bomId, versionNum) => {
					try {
						const res = await publishBomVersionAction(bomId, versionNum);
						if (res.success) {
							toast.success(`已成功发布版本 ${versionNum}`);
							handleSelectVersion(versionNum);
						} else {
							toast.error(res.error || "发布失败");
						}
					} catch (err: unknown) {
						toast.error(err instanceof Error ? err.message : "发布异常");
					}
				}}
			/>
		</>
	);
}
