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
		<div className="flex flex-col min-h-screen bg-muted/10">
			{/* 1. 顶部操作栏积木 (内部使用 AuthGuard 声明式管控权限) */}
			<FormHeader
				mode={mode}
				bomId={bomId}
				name={state.name}
				initialPrimaryProductName={initialDetail?.primaryProduct.name}
				initialVersionName={initialDetail?.currentVersion.name}
				isDefault={state.isDefault}
				bomType={state.bomType}
				submitting={state.submitting}
				onSave={state.handleSave}
				onCancel={() => router?.push(backUrl)}
				onEdit={() => router?.push(`/production/bom/${bomId}?mode=edit`)}
			/>

			{/* 2. 主表单多区块积木拼接内容 */}
			<div className="flex-1 max-w-6xl w-full mx-auto p-8 space-y-8 pb-24">
				{/* 区块 1：基本信息与 BOM 类型 */}
				<BasicInfoSection
					isView={isView}
					isEdit={isEdit}
					bomType={state.bomType}
					setBomType={state.setBomType}
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

				{/* 区块 2：原料投入明细与配比清单 */}
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
				/>

				{/* 区块 3：成品主产出、联副产品多选与总出成率折算 */}
				<ProductOutputsSection
					isView={isView}
					productId={state.productId}
					primaryQuantity={state.primaryQuantity}
					setPrimaryQuantity={state.setPrimaryQuantity}
					primaryUnitId={state.primaryUnitId}
					setPrimaryUnitId={state.setPrimaryUnitId}
					byProductIds={state.byProductIds}
					byProductCandidateOptions={state.byProductCandidateOptions}
					handleAddByProduct={state.handleAddByProduct}
					handleRemoveByProduct={state.handleRemoveByProduct}
					totalYieldEnabled={state.totalYieldEnabled}
					setTotalYieldEnabled={state.setTotalYieldEnabled}
					totalYieldRate={state.totalYieldRate}
					setTotalYieldRate={state.setTotalYieldRate}
					formOptions={formOptions}
				/>

				{/* 区块 4：工艺路线工序清单 */}
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
	);
}
