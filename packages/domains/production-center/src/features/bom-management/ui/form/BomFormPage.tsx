"use client";

import { useSafeRouter } from "@base/ui";
import type { BomFormPageProps } from "./types";
import { useBomFormState } from "./useBomFormState";
import { FormHeader } from "./FormHeader";
import { BasicInfoSection } from "./BasicInfoSection";
import { MaterialInputsSection } from "./MaterialInputsSection";
import { ProductOutputsSection } from "./ProductOutputsSection";
import { OperationRoutesSection } from "./OperationRoutesSection";

export type { BomFormPageProps };

/**
 * 生产 BOM 录入/编辑页面顶层积木装配器：
 * 采用积木化架构拼装基本信息、原料投入、主副产出与工艺路线四大业务区块
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

	// 纯逻辑表单状态驱动 Hook
	const state = useBomFormState({
		mode,
		bomId,
		initialDetail,
		formOptions,
		backUrl,
	});

	return (
		<div className="flex flex-col h-[calc(100svh-3rem)] -m-2 md:-m-2.5 overflow-hidden bg-background">
			{/* 1. 顶部操作栏积木：顶格吸附系统顶栏正下方，严丝合缝零缝隙 */}
			<FormHeader
				mode={mode}
				bomId={bomId}
				name={state.name}
				initialPrimaryProductName={initialDetail?.primaryProduct.name}
				initialVersionName={initialDetail?.currentVersion.name}
				isDefault={state.isDefault}
				bomType={state.bomType}
				setBomType={state.setBomType}
				submitting={state.submitting}
				onSave={state.handleSave}
				onCancel={() => router?.push(backUrl)}
				onEdit={() => router?.push(`/production/bom/${bomId}?mode=edit`)}
			/>

			{/* 2. 主表单多区块独立滚动视口：滚动完全收敛在操作栏下方，彻底杜绝向上穿透与透光缝隙 */}
			<div className="flex-1 overflow-y-auto px-5 py-3.5 pb-16">
				<div className="max-w-6xl w-full mx-auto space-y-3.5">
					{/* 区块 1：基本信息 */}
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
				</div>
			</div>
		</div>
	);
}
