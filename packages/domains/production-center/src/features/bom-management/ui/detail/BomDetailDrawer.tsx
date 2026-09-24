"use client";

import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, Tabs, TabsList, TabsTrigger, TabsContent } from "@base/ui";
import type { BomDetailDto } from "../../types";
import { getBomDetailAction } from "../../actions";
import { BomFlowGraph } from "../graph";
import { DetailHeader } from "./DetailHeader";
import { VersionSwitcherBar } from "./VersionSwitcherBar";
import { BomBreadcrumbNav, type BomBreadcrumbNode } from "./BomBreadcrumbNav";
import { InputsTableTab } from "./InputsTableTab";
import { OutputsTableTab } from "./OutputsTableTab";
import { OperationsTableTab } from "./OperationsTableTab";

export interface BomDetailDrawerProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly detail: BomDetailDto | null;
	readonly onEdit?: (detail: BomDetailDto) => void;
	readonly onSelectVersion?: (versionNumber: number) => void;
	readonly onPublishVersion?: (bomId: string, versionNumber: number) => void;
	readonly onNavigateBom?: (bomId: string) => void;
}

/**
 * 生产 BOM 详情抽屉积木装配器：
 * 聚合多级穿透面包屑导航栈、头部元信息、版本切换栏、流程图谱与投入/产出/工序三大表格选项卡
 */
export function BomDetailDrawer({
	open,
	onOpenChange,
	detail,
	onEdit,
	onSelectVersion,
	onPublishVersion,
	onNavigateBom,
}: BomDetailDrawerProps) {
	const [activeTab, setActiveTab] = useState("graph");

	// 历史导航栈与零白屏缓存：支持无限层级下钻与任意跨层跳转
	const [stack, setStack] = useState<readonly BomBreadcrumbNode[]>([]);
	const [activeDetail, setActiveDetail] = useState<BomDetailDto | null>(detail);
	const [detailCache, setDetailCache] = useState<Record<string, BomDetailDto>>({});

	// 当外部根 detail 变化或抽屉打开状态变化时，同步初始化导航栈
	useEffect(() => {
		if (open && detail) {
			setActiveDetail(detail);
			setStack([
				{
					id: detail.id,
					name: detail.currentVersion.name,
					versionText: `V${detail.currentVersion.versionNumber}`,
					isRoot: true,
				},
			]);
			setDetailCache({ [detail.id]: detail });
		} else if (!open) {
			// 抽屉关闭时平滑重置
			setStack([]);
			setActiveDetail(null);
			setDetailCache({});
		}
	}, [open, detail]);

	// 穿透下钻至子 BOM：自动压栈、按需缓存并秒级切入
	const handleNavigateBomInternal = useCallback(
		async (childBomId: string) => {
			// 通知外部可选回调
			onNavigateBom?.(childBomId);

			const cached = detailCache[childBomId];
			if (cached) {
				setActiveDetail(cached);
				setStack((prev) => [
					...prev,
					{
						id: cached.id,
						name: cached.currentVersion.name,
						versionText: `V${cached.currentVersion.versionNumber}`,
					},
				]);
				return;
			}

			try {
				const res = await getBomDetailAction(childBomId);
				if (res.success && res.data) {
					const nextDetail = res.data;
					setDetailCache((prev) => ({ ...prev, [childBomId]: nextDetail }));
					setActiveDetail(nextDetail);
					setStack((prev) => [
						...prev,
						{
							id: nextDetail.id,
							name: nextDetail.currentVersion.name,
							versionText: `V${nextDetail.currentVersion.versionNumber}`,
						},
					]);
				}
			} catch (err) {
				console.error("穿透下钻子 BOM 失败:", err);
			}
		},
		[detailCache, onNavigateBom],
	);

	// 点击面包屑中第 targetIndex 项：跨层级任意回溯并截断多余历史
	const handleSelectNode = useCallback(
		async (targetIndex: number) => {
			if (targetIndex >= stack.length - 1 || targetIndex < 0) return;
			const targetNode = stack[targetIndex];
			const nextStack = stack.slice(0, targetIndex + 1);
			setStack(nextStack);

			const cached = detailCache[targetNode.id];
			if (cached) {
				setActiveDetail(cached);
			} else {
				try {
					const res = await getBomDetailAction(targetNode.id);
					if (res.success && res.data) {
						setActiveDetail(res.data);
						setDetailCache((prev) => ({ ...prev, [targetNode.id]: res.data }));
					}
				} catch (err) {
					console.error("加载目标 BOM 失败:", err);
				}
			}
		},
		[stack, detailCache],
	);

	// 快捷返回上一级
	const handleBack = useCallback(() => {
		if (stack.length <= 1) return;
		handleSelectNode(stack.length - 2);
	}, [stack.length, handleSelectNode]);

	// 当前层级切换版本
	const handleSelectVersionInternal = useCallback(
		async (versionNumber: number) => {
			if (!activeDetail) return;
			// 如果处于根节点且外部有回调，通知外部
			if (stack.length === 1) {
				onSelectVersion?.(versionNumber);
			}

			try {
				const res = await getBomDetailAction(activeDetail.id, versionNumber);
				if (res.success && res.data) {
					const updated = res.data;
					setActiveDetail(updated);
					setDetailCache((prev) => ({ ...prev, [activeDetail.id]: updated }));
					setStack((prev) =>
						prev.map((item, idx) =>
							idx === prev.length - 1
								? { ...item, versionText: `V${versionNumber}` }
								: item,
						),
					);
				}
			} catch (err) {
				console.error("切换版本失败:", err);
			}
		},
		[activeDetail, stack.length, onSelectVersion],
	);

	if (!open || !activeDetail) return null;

	const { currentVersion, versionHistory } = activeDetail;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-[85vw] !max-w-[1400px] overflow-y-auto p-6 flex flex-col gap-0">
				{/* 0. 多级穿透面包屑导航栏：支持无限多级下钻与任意跨层跳转 */}
				<BomBreadcrumbNav
					stack={stack}
					onBack={handleBack}
					onSelectNode={handleSelectNode}
				/>

				{/* 1. 头部元信息积木 (内部使用 AuthGuard 声明式权限控制) */}
				<DetailHeader
					detail={activeDetail}
					onEdit={onEdit}
					onPublishVersion={onPublishVersion}
				/>

				{/* 2. 仅保留两大核心视图：Tab 1 流程图谱，Tab 2 配方与工艺全貌，并与版本切换在同一行 */}
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className="flex-1 flex flex-col mt-2"
				>
					{/* 同一行并排：左侧为核心两个 Tab，右侧为当前版本切换器 */}
					<div className="flex items-center justify-between gap-4 py-1.5 border-b mb-3">
						<TabsList className="grid grid-cols-2 w-72 h-8">
							<TabsTrigger value="graph" className="text-xs">
								版本流程图谱
							</TabsTrigger>
							<TabsTrigger value="overview" className="text-xs">
								配方与工艺全貌
							</TabsTrigger>
						</TabsList>

						<VersionSwitcherBar
							currentVersionNumber={currentVersion.versionNumber}
							description={currentVersion.description}
							versionHistory={versionHistory}
							onSelectVersion={handleSelectVersionInternal}
						/>
					</div>

					{/* 2.1 Tab 1：版本流程图谱 */}
					<TabsContent value="graph" className="mt-0 flex-1 flex flex-col">
						<BomFlowGraph
							detail={activeDetail}
							onNavigateBom={handleNavigateBomInternal}
						/>
					</TabsContent>

					{/* 2.2 Tab 2：配方与工艺全貌 (合屏一览：产出、投入与工艺路线) */}
					<TabsContent value="overview" className="mt-2 space-y-4">
						{/* 产出清单 */}
						<div className="space-y-2">
							<div className="flex items-center justify-between border-b pb-1">
								<h3 className="text-xs font-bold text-foreground">
									一、产出清单 (成品主产出与副产品)
								</h3>
								<span className="text-[11px] text-muted-foreground">
									共 {currentVersion.outputs.length} 项产出
								</span>
							</div>
							<OutputsTableTab outputs={currentVersion.outputs} />
						</div>

						{/* 原料投入清单 */}
						<div className="space-y-2">
							<div className="flex items-center justify-between border-b pb-1">
								<h3 className="text-xs font-bold text-foreground">
									二、原料投入清单
								</h3>
								<span className="text-[11px] text-muted-foreground">
									共 {currentVersion.inputs.length} 项物料
								</span>
							</div>
							<InputsTableTab inputs={currentVersion.inputs} />
						</div>

						{/* 工艺路线 */}
						<div className="space-y-2">
							<div className="flex items-center justify-between border-b pb-1">
								<h3 className="text-xs font-bold text-foreground">
									三、工序工艺路线
								</h3>
								<span className="text-[11px] text-muted-foreground">
									共 {currentVersion.operations.length} 道工序
								</span>
							</div>
							<OperationsTableTab operations={currentVersion.operations} />
						</div>
					</TabsContent>
				</Tabs>
			</SheetContent>
		</Sheet>
	);
}
