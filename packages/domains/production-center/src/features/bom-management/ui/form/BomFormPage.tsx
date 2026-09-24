"use client";

import { Edit, Save, Check } from "lucide-react";
import {
	AuthGuard,
	Button,
	Badge,
	ConfirmDialog,
	DocumentShell,
	Tabs,
	TabsList,
	TabsTrigger,
	useSafeRouter,
} from "@base/ui";
import { StandardAction, useAbility } from "@base/authorization";
import {
	BOM_TYPES,
	BomSubject,
	BomAction,
	BomField,
	type BomType,
} from "../../contract";
import type { BomFormPageProps } from "./types";
import { useBomFormState } from "./useBomFormState";
import { BasicInfoSection } from "./BasicInfoSection";
import { MaterialInputsSection } from "./MaterialInputsSection";
import { ProductOutputsSection } from "./ProductOutputsSection";
import { OperationRoutesSection } from "./OperationRoutesSection";

export type { BomFormPageProps };

/**
 * 生产 BOM 录入/编辑页面顶层积木装配器：
 * 采用企业级标准 <DocumentShell> 外壳承载，内部自由拼装四大业务积木
 */
export function BomFormPage({
	mode = "create",
	bomId,
	initialDetail,
	formOptions,
	backUrl = "/production/bom",
}: BomFormPageProps) {
	const router = useSafeRouter();
	const isView = mode === "view";
	const isEdit = mode === "edit";
	const isCreate = mode === "create";

	// 纯逻辑表单状态驱动 Hook
	const state = useBomFormState({
		mode,
		bomId,
		initialDetail,
		formOptions,
		backUrl,
	});

	const ability = useAbility();
	const canReadName = ability.can(StandardAction.READ, BomSubject, BomField.NAME);
	const displayName = canReadName
		? state.name || initialDetail?.primaryProduct.name || initialDetail?.currentVersion.name
		: initialDetail?.primaryProduct.name;

	const titleText = isView
		? `BOM 方案详情: ${displayName || ""}`
		: isEdit
			? `编辑生产 BOM: ${displayName || ""}`
			: "新建生产 BOM";

	// 中部单据类型分段切换器插槽
	const slotMiddle =
		isCreate ? (
			<Tabs
				value={state.bomType}
				onValueChange={(val) => val && state.setBomType(val as BomType)}
			>
				<TabsList className="h-7.5 p-0.5 bg-muted/70 border border-border/70 rounded-md">
					<TabsTrigger
						value={BOM_TYPES.PROCESSING}
						className="h-6.5 px-2.5 text-xs rounded-xs font-medium transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer data-active:font-bold data-active:text-blue-600 dark:data-active:text-blue-400"
					>
						单品BOM
					</TabsTrigger>
					<TabsTrigger
						value={BOM_TYPES.FORMULA}
						className="h-6.5 px-2.5 text-xs rounded-xs font-medium transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer data-active:font-bold data-active:text-blue-600 dark:data-active:text-blue-400"
					>
						组合BOM
					</TabsTrigger>
					<TabsTrigger
						value={BOM_TYPES.PACKAGING}
						className="h-6.5 px-2.5 text-xs rounded-xs font-medium transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer data-active:font-bold data-active:text-blue-600 dark:data-active:text-blue-400"
					>
						包装BOM
					</TabsTrigger>
				</TabsList>
			</Tabs>
		) : (
			<Badge
				variant="outline"
				size="sm"
				className="text-xs py-0 h-5 px-2 font-normal"
			>
				{state.bomType === "PROCESSING"
					? "单品加工"
					: state.bomType === "FORMULA"
						? "组合配方"
						: "包装装配"}
			</Badge>
		);

	// 顶部操作动作区插槽 (统一 AuthGuard 保护)
	const slotActions = isView ? (
		<AuthGuard action={StandardAction.UPDATE} subject={BomSubject}>
			<Button
				type="button"
				size="sm"
				onClick={() => router?.push(`/production/bom/${bomId}?mode=edit`)}
				className="h-8 text-xs gap-1.5 px-3 transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer"
			>
				<Edit className="size-3.5" /> 编辑方案
			</Button>
		</AuthGuard>
	) : (
		<div className="flex items-center gap-2">
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() => router?.push(backUrl)}
				disabled={state.submitting}
				className="h-8 text-xs px-3 transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer"
			>
				取消
			</Button>
			<AuthGuard
				action={isEdit ? StandardAction.UPDATE : StandardAction.CREATE}
				subject={BomSubject}
			>
				<Button
					type="button"
					variant="secondary"
					size="sm"
					onClick={() => state.handleSave(true)}
					disabled={state.submitting}
					className="h-8 text-xs gap-1.5 px-3 min-w-[76px] transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer"
				>
					<Save className="size-3.5 text-muted-foreground" />
					{state.submitting ? "保存中..." : "保存草稿"}
				</Button>
			</AuthGuard>
			<AuthGuard action={BomAction.PUBLISH} subject={BomSubject}>
				<ConfirmDialog
					trigger={
						<Button
							type="button"
							size="sm"
							disabled={state.submitting}
							className="h-8 text-xs gap-1.5 px-3.5 min-w-[84px] bg-blue-600 hover:bg-blue-700 text-white transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
						>
							<Check className="size-3.5" />
							{state.submitting
								? "处理中..."
								: isEdit
									? "发布新版本"
									: "立即发布"}
						</Button>
					}
					title={
						isEdit
							? "确认发布生产 BOM 新版本？"
							: "确认立即发布生产 BOM 方案？"
					}
					description={
						isEdit
							? "编辑发布生产BOM后只影响后续未生成的生产计划与工单，历史及已生成的计划不受影响。"
							: "发布后该方案将作为生效标准，供后续创建生产计划与工单时引用。"
					}
					confirmText="确认发布"
					cancelText="返回修改"
					onConfirm={() => state.handleSave(false)}
				/>
			</AuthGuard>
		</div>
	);

	return (
		<DocumentShell
			mode={mode}
			subject={BomSubject}
			title={titleText}
			tabTitle={displayName ? `BOM: ${displayName}` : undefined}
			badge={
				state.isDefault ? (
					<Badge
						variant="default"
						size="sm"
						className="bg-blue-600 hover:bg-blue-600 text-xs py-0 h-5 px-2"
					>
						默认BOM
					</Badge>
				) : undefined
			}
			slotMiddle={slotMiddle}
			slotActions={slotActions}
			backUrl={backUrl}
			submitting={state.submitting}
			className="bg-background"
			contentClassName="space-y-4 max-w-6xl w-full mx-auto pb-16"
		>
			{/* 区块 1：基本信息积木 */}
			<BasicInfoSection
				isView={isView}
				isEdit={isEdit}
				productId={state.productId}
				handleSelectProduct={state.handleSelectProduct}
				productionLineId={state.productionLineId}
				setProductionLineId={state.setProductionLineId}
				name={state.name}
				setName={state.setName}
				code={state.code}
				setCode={state.setCode}
				description={state.description}
				setDescription={state.setDescription}
				initialDetail={initialDetail}
				formOptions={formOptions}
			/>

			{/* 区块 2：成品主产出、联副产品明细与总出成率折算 */}
			<ProductOutputsSection
				isView={isView}
				productId={state.productId}
				primaryQuantity={state.primaryQuantity}
				setPrimaryQuantity={state.setPrimaryQuantity}
				primaryUnitId={state.primaryUnitId}
				setPrimaryUnitId={state.setPrimaryUnitId}
				byProducts={state.byProducts}
				byProductCandidateOptions={state.byProductCandidateOptions}
				handleAddByProduct={state.handleAddByProduct}
				handleRemoveByProduct={state.handleRemoveByProduct}
				handleUpdateByProduct={state.handleUpdateByProduct}
				totalYieldEnabled={state.totalYieldEnabled}
				setTotalYieldEnabled={state.setTotalYieldEnabled}
				totalYieldRate={state.totalYieldRate}
				setTotalYieldRate={state.setTotalYieldRate}
				formOptions={formOptions}
			/>

			{/* 区块 3：原料投入明细与配比清单 (含子 BOM 版本快照与一键更新) */}
			<MaterialInputsSection
				isView={isView}
				bomType={state.bomType}
				isRatioMode={state.isRatioMode}
				setIsRatioMode={state.setIsRatioMode}
				inputs={state.inputs}
				formOptions={formOptions}
				handleAddInput={state.handleAddInput}
				handleRemoveInput={state.handleRemoveInput}
				handleUpdateInput={state.handleUpdateInput}
				hasUpdatableChildBoms={state.hasUpdatableChildBoms}
				handleUpdateAllChildBomsToLatest={
					state.handleUpdateAllChildBomsToLatest
				}
			/>

			{/* 区块 4：工艺路线工序清单 (含工序规格与说明联动) */}
			<OperationRoutesSection
				isView={isView}
				operations={state.operations}
				formOptions={formOptions}
				handleAddOperation={state.handleAddOperation}
				handleRemoveOperation={state.handleRemoveOperation}
				handleUpdateOperation={state.handleUpdateOperation}
			/>
		</DocumentShell>
	);
}
