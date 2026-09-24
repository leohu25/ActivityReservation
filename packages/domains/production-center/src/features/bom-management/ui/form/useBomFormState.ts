"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { toast, updateTabTitle, useSafeRouter, type FormPageMode } from "@base/ui";
import { useAbility, StandardAction } from "@base/authorization";
import {
	BOM_TYPES,
	QUANTITY_MODES,
	MATERIAL_ROLES,
	OUTPUT_ROLES,
	SUPPLY_POLICIES,
	BomSubject,
	BomField,
	type BomType,
	type MaterialRole,
	type SupplyPolicy,
} from "../../contract";
import type {
	BomDetailDto,
	BomFormOptions,
	CreateBomInput,
	UpdateBomInput,
} from "../../types";
import { createBomAction, updateBomAction } from "../../actions";
import type { FormInputRow, FormByProductRow, FormOperationRow } from "./types";

export interface UseBomFormStateParams {
	readonly mode: FormPageMode;
	readonly bomId?: string;
	readonly initialDetail?: BomDetailDto | null;
	readonly formOptions: BomFormOptions;
	readonly backUrl: string;
}

export function useBomFormState({
	mode,
	bomId,
	initialDetail,
	formOptions,
	backUrl,
}: UseBomFormStateParams) {
	const router = useSafeRouter();
	const isEdit = mode === "edit";

	const [submitting, setSubmitting] = useState<boolean>(false);

	// 表单基础字段状态
	const [bomType, setBomType] = useState<BomType>(
		initialDetail?.currentVersion.bomType || BOM_TYPES.PROCESSING,
	);
	const [productId, setProductId] = useState<string>(
		initialDetail?.primaryProduct.id || "",
	);
	const [code, setCode] = useState<string>(
		initialDetail?.currentVersion.code || `BOM${Date.now().toString().slice(-6)}`,
	);
	const [name, setName] = useState<string>(
		initialDetail?.currentVersion.name || "",
	);
	const [productionLineId, setProductionLineId] = useState<string>(
		initialDetail?.currentVersion.productionLineId || "",
	);
	const [description, setDescription] = useState<string>(
		initialDetail?.currentVersion.description || "",
	);
	const [isRatioMode, setIsRatioMode] = useState<boolean>(
		initialDetail?.currentVersion.quantityMode === QUANTITY_MODES.RATIO,
	);
	const [totalYieldEnabled, setTotalYieldEnabled] = useState<boolean>(
		initialDetail?.currentVersion.totalYieldEnabled || false,
	);
	const [totalYieldRate, setTotalYieldRate] = useState<number>(
		initialDetail?.currentVersion.totalYieldRate
			? Number(initialDetail.currentVersion.totalYieldRate) * 100
			: 100,
	);
	const [isDefault, setIsDefault] = useState<boolean>(
		initialDetail?.isDefault || false,
	);

	// 成品主产出
	const [primaryQuantity, setPrimaryQuantity] = useState<number>(
		Number(
			initialDetail?.currentVersion.outputs.find(
				(o) => o.outputRole === OUTPUT_ROLES.PRIMARY,
			)?.quantity ?? 1,
		),
	);
	const [primaryUnitId, setPrimaryUnitId] = useState<string>(
		initialDetail?.currentVersion.outputs.find(
			(o) => o.outputRole === OUTPUT_ROLES.PRIMARY,
		)?.unitId || "",
	);

	// 联副产品产出明细列表 (支持数量、单位与分摊比例)
	const [byProducts, setByProducts] = useState<FormByProductRow[]>(() => {
		if (initialDetail?.currentVersion.outputs) {
			return initialDetail.currentVersion.outputs
				.filter((o) => o.outputRole === OUTPUT_ROLES.BYPRODUCT)
				.map((o) => ({
					productId: o.productId,
					quantity: Number(o.quantity ?? 1),
					unitId: o.unitId,
					costAllocationRatio: o.costAllocationRatio
						? Number(o.costAllocationRatio) * 100
						: undefined,
				}));
		}
		return [];
	});

	// 动态同步 TabBar 页签标题
	useEffect(() => {
		const tabTitle =
			mode === "create"
				? "新建生产BOM"
				: mode === "edit"
					? `编辑: ${name || initialDetail?.currentVersion.name || "生产BOM"}`
					: `BOM: ${name || initialDetail?.currentVersion.name || "详情"}`;
		updateTabTitle(tabTitle);
	}, [mode, name, initialDetail]);

	// 投入物料清单状态
	const [inputs, setInputs] = useState<FormInputRow[]>(() => {
		if (
			initialDetail?.currentVersion.inputs &&
			initialDetail.currentVersion.inputs.length > 0
		) {
			return initialDetail.currentVersion.inputs.map((inp) => ({
				productId: inp.productId,
				quantity: Number(inp.quantity ?? 1),
				unitId: inp.unitId,
				ratio: Number(inp.ratio ?? 0) * 100,
				materialRole: inp.materialRole,
				cookedYieldRate: Number(inp.cookedYieldRate ?? 1) * 100,
				normalLossRate: Number(inp.normalLossRate ?? 0) * 100,
				supplyPolicy: inp.supplyPolicy,
				childBomId: inp.childBomId,
				childBomName: inp.childBomName,
				childBomVersionId: inp.childBomVersionId,
				childBomVersionNumber: inp.childBomVersionNumber,
				latestChildBomVersionId: inp.latestChildBomVersionId,
				latestChildBomVersionNumber: inp.latestChildBomVersionNumber,
			}));
		}
		return [
			{
				productId: "",
				quantity: 1,
				unitId: formOptions.units[0]?.id || "",
				ratio: 0,
				materialRole: MATERIAL_ROLES.MAIN,
				cookedYieldRate: 100,
				normalLossRate: 0,
				supplyPolicy: SUPPLY_POLICIES.EXTERNAL,
				childBomId: null,
				childBomName: null,
				childBomVersionId: null,
				childBomVersionNumber: null,
				latestChildBomVersionId: null,
				latestChildBomVersionNumber: null,
			},
		];
	});

	// 工序路线状态
	const [operations, setOperations] = useState<FormOperationRow[]>(() => {
		if (
			initialDetail?.currentVersion.operations &&
			initialDetail.currentVersion.operations.length > 0
		) {
			return initialDetail.currentVersion.operations.map((op) => ({
				operationId: op.operationId,
				processingSpecificationId: op.processingSpecificationId || null,
				sequenceNumber: op.sequenceNumber,
				standardLaborHours: Number(op.standardLaborHours ?? 0),
				qualityCheckpoint: op.qualityCheckpoint,
				instructionText: op.instructionText || "",
			}));
		}
		return [];
	});

	// 选择主产出商品时自动联动生产单位与默认名称
	const handleSelectProduct = useCallback(
		(pId: string) => {
			setProductId(pId);
			setByProducts((prev) => prev.filter((item) => item.productId !== pId));
			const prod = formOptions.products.find((p) => p.id === pId);
			if (prod) {
				if (!name) setName(`${prod.name} 生产BOM`);
				// 优先由商品的生产单位带出，若未设置则带出库存基础单位
				setPrimaryUnitId(prod.defaultProductionUnitId || prod.inventoryUnitId);
			}
		},
		[formOptions.products, name],
	);

	// 副产品候选商品列表（排除主产品与已添加的副产品）
	const byProductCandidateOptions = useMemo(() => {
		const existingIds = new Set(byProducts.map((bp) => bp.productId));
		return formOptions.products
			.filter((p) => p.id !== productId && !existingIds.has(p.id))
			.map((p) => ({
				value: p.id,
				label: `${p.name} (${p.code})`,
			}));
	}, [formOptions.products, productId, byProducts]);

	const handleAddByProduct = useCallback(
		(pId: string | null) => {
			if (!pId) return;
			const prod = formOptions.products.find((p) => p.id === pId);
			if (!prod) return;

			setByProducts((prev) => {
				if (prev.some((item) => item.productId === pId)) return prev;
				return [
					...prev,
					{
						productId: pId,
						quantity: 1,
						unitId: prod.defaultProductionUnitId || prod.inventoryUnitId,
						costAllocationRatio: undefined,
					},
				];
			});
		},
		[formOptions.products],
	);

	const handleRemoveByProduct = useCallback((idx: number) => {
		setByProducts((prev) => prev.filter((_, i) => i !== idx));
	}, []);

	const handleUpdateByProduct = useCallback(
		(idx: number, field: keyof FormByProductRow, value: unknown) => {
			setByProducts((prev) => {
				const next = [...prev];
				next[idx] = { ...next[idx], [field]: value };
				return next;
			});
		},
		[],
	);

	// 投入行增删改与商品单位、默认 BOM 级联带出
	const handleAddInput = useCallback(() => {
		setInputs((prev) => [
			...prev,
			{
				productId: "",
				quantity: 1,
				unitId: formOptions.units[0]?.id || "",
				ratio: 0,
				materialRole: MATERIAL_ROLES.MAIN,
				cookedYieldRate: 100,
				normalLossRate: 0,
				supplyPolicy: SUPPLY_POLICIES.EXTERNAL,
				childBomId: null,
				childBomName: null,
				childBomVersionId: null,
				childBomVersionNumber: null,
				latestChildBomVersionId: null,
				latestChildBomVersionNumber: null,
			},
		]);
	}, [formOptions.units]);

	const handleRemoveInput = useCallback((idx: number) => {
		setInputs((prev) => prev.filter((_, i) => i !== idx));
	}, []);

	const handleUpdateInput = useCallback(
		(idx: number, field: string, value: unknown) => {
			setInputs((prev) => {
				const next = [...prev];
				next[idx] = { ...next[idx], [field]: value };
				if (field === "productId") {
					const found = formOptions.products.find((p) => p.id === value);
					if (found) {
						// 投入单位由商品带出
						next[idx].unitId = found.inventoryUnitId;
						// 如果该商品关联有默认 BOM，自动带出子 BOM 及其当前发布版本快照
						if (found.defaultBom) {
							next[idx].supplyPolicy = SUPPLY_POLICIES.MAKE;
							next[idx].childBomId = found.defaultBom.bomId;
							next[idx].childBomName = found.defaultBom.name;
							next[idx].childBomVersionId = found.defaultBom.bomVersionId;
							next[idx].childBomVersionNumber = found.defaultBom.versionNumber;
							next[idx].latestChildBomVersionId = found.defaultBom.bomVersionId;
							next[idx].latestChildBomVersionNumber =
								found.defaultBom.versionNumber;
						} else {
							next[idx].supplyPolicy = SUPPLY_POLICIES.EXTERNAL;
							next[idx].childBomId = null;
							next[idx].childBomName = null;
							next[idx].childBomVersionId = null;
							next[idx].childBomVersionNumber = null;
							next[idx].latestChildBomVersionId = null;
							next[idx].latestChildBomVersionNumber = null;
						}
					}
				}
				return next;
			});
		},
		[formOptions.products],
	);

	// 一键更新所有引用的子 BOM 到最新发布版本快照
	const hasUpdatableChildBoms = useMemo(() => {
		return inputs.some(
			(i) =>
				i.childBomId &&
				i.latestChildBomVersionId &&
				i.childBomVersionId !== i.latestChildBomVersionId,
		);
	}, [inputs]);

	const handleUpdateAllChildBomsToLatest = useCallback(() => {
		let updatedCount = 0;
		setInputs((prev) =>
			prev.map((inp) => {
				if (
					inp.childBomId &&
					inp.latestChildBomVersionId &&
					inp.childBomVersionId !== inp.latestChildBomVersionId
				) {
					updatedCount++;
					return {
						...inp,
						childBomVersionId: inp.latestChildBomVersionId,
						childBomVersionNumber: inp.latestChildBomVersionNumber,
					};
				}
				return inp;
			}),
		);
		if (updatedCount > 0) {
			toast.success(`已将 ${updatedCount} 处子 BOM 引用一键更新至最新版本快照`);
		} else {
			toast.info("所有引用的子 BOM 均已是最新版本");
		}
	}, []);

	// 工序行增删改、工序规格与加工说明带入
	const handleAddOperation = useCallback(() => {
		const firstOp = formOptions.operations[0];
		setOperations((prev) => [
			...prev,
			{
				operationId: firstOp?.id || "",
				processingSpecificationId: null,
				sequenceNumber: (prev.length + 1) * 10,
				standardLaborHours: 0.5,
				qualityCheckpoint: false,
				instructionText: "",
			},
		]);
	}, [formOptions.operations]);

	const handleRemoveOperation = useCallback((idx: number) => {
		setOperations((prev) => prev.filter((_, i) => i !== idx));
	}, []);

	const handleUpdateOperation = useCallback(
		(idx: number, field: string, value: unknown) => {
			setOperations((prev) => {
				const next = [...prev];
				next[idx] = { ...next[idx], [field]: value };
				if (field === "operationId") {
					// 切换工序时重置规格
					next[idx].processingSpecificationId = null;
				} else if (field === "processingSpecificationId") {
					// 切换工序规格时，将加工说明默认带到工艺操作指引说明中，允许后续手动微调修改
					const currentOp = next[idx];
					const opDef = formOptions.operations.find(
						(o) => o.id === currentOp.operationId,
					);
					const specDef = opDef?.specifications.find((s) => s.id === value);
					if (specDef?.description) {
						next[idx].instructionText = specDef.description;
					}
				}
				return next;
			});
		},
		[formOptions.operations],
	);

	// 权限判定
	const ability = useAbility();
	const canReadName = ability.can(StandardAction.READ, BomSubject, BomField.NAME);
	const canReadCode = ability.can(StandardAction.READ, BomSubject, BomField.CODE);

	// 统一提交校验与请求
	const handleSave = async (isDraftAction: boolean = false) => {
		if (!productId) {
			toast.error("请选择 BOM 主产出商品");
			return;
		}
		if (canReadCode && !code.trim()) {
			toast.error("请输入 BOM 编码");
			return;
		}
		if (canReadName && !name.trim()) {
			toast.error("请输入 BOM 名称");
			return;
		}
		if (inputs.length === 0 || inputs.some((i) => !i.productId)) {
			toast.error("投入清单不能为空，且必须为每一行选择物料商品");
			return;
		}

		let finalName = name.trim();
		if (!canReadName || !finalName) {
			const fallbackProdName = formOptions.products.find((p) => p.id === productId)?.name;
			finalName =
				initialDetail?.currentVersion.name ||
				(fallbackProdName ? `${fallbackProdName} 生产BOM` : "生产BOM方案");
		}

		let finalCode = code.trim();
		if (!canReadCode || !finalCode) {
			finalCode =
				initialDetail?.currentVersion.code ||
				`BOM${Date.now().toString().slice(-6)}`;
		}

		setSubmitting(true);
		try {
			const payload: CreateBomInput = {
				bomType,
				code: finalCode,
				name: finalName,
				productId,
				productionLineId: productionLineId || null,
				description: description.trim() || null,
				quantityMode: isRatioMode ? QUANTITY_MODES.RATIO : QUANTITY_MODES.FIXED,
				totalYieldEnabled,
				totalYieldRate: totalYieldEnabled ? totalYieldRate / 100 : null,
				isDefault,
				isDraft: isDraftAction,
				outputs: [
					{
						productId,
						quantity: Number(primaryQuantity || 1),
						unitId: primaryUnitId || formOptions.units[0]?.id || "",
						outputRole: OUTPUT_ROLES.PRIMARY,
						sortOrder: 0,
						remark: "主产品",
					},
					...byProducts.map((bp, idx) => ({
						productId: bp.productId,
						quantity: Number(bp.quantity || 1),
						unitId: bp.unitId,
						outputRole: OUTPUT_ROLES.BYPRODUCT,
						costAllocationRatio: bp.costAllocationRatio
							? bp.costAllocationRatio / 100
							: null,
						sortOrder: idx + 1,
						remark: "联副产品",
					})),
				],
				inputs: inputs.map((inp, idx) => ({
					productId: inp.productId,
					quantity: isRatioMode ? null : Number(inp.quantity),
					unitId: inp.unitId,
					ratio: isRatioMode ? Number(inp.ratio) / 100 : null,
					materialRole: inp.materialRole as MaterialRole,
					cookedYieldRate: Number(inp.cookedYieldRate) / 100,
					normalLossRate: Number(inp.normalLossRate) / 100,
					supplyPolicy: (inp.supplyPolicy as SupplyPolicy) || SUPPLY_POLICIES.EXTERNAL,
					childBomId: inp.childBomId || null,
					childBomVersionId: inp.childBomVersionId || null,
					sortOrder: idx,
				})),
				operations: operations.map((op, idx) => ({
					operationId: op.operationId,
					processingSpecificationId: op.processingSpecificationId || null,
					sequenceNumber: Number(op.sequenceNumber),
					standardLaborHours: Number(op.standardLaborHours),
					qualityCheckpoint: op.qualityCheckpoint,
					instructionText: op.instructionText || null,
					sortOrder: idx,
				})),
			};

			if (isEdit && bomId) {
				const res = await updateBomAction(bomId, payload as UpdateBomInput);
				if (res.success) {
					toast.success(isDraftAction ? "BOM 草稿已成功保存" : "BOM 新版本已发布生效");
					router?.refresh();
					router?.push(backUrl);
				} else {
					toast.error(res.error || "保存失败");
				}
			} else {
				const res = await createBomAction(payload);
				if (res.success) {
					toast.success(isDraftAction ? "BOM 草稿已保存" : "生产 BOM 已发布生效");
					router?.refresh();
					router?.push(backUrl);
				} else {
					toast.error(res.error || "创建失败");
				}
			}
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : "提交异常，请稍后重试");
		} finally {
			setSubmitting(false);
		}
	};

	return {
		submitting,
		bomType,
		setBomType,
		productId,
		code,
		setCode,
		name,
		setName,
		productionLineId,
		setProductionLineId,
		description,
		setDescription,
		isRatioMode,
		setIsRatioMode,
		totalYieldEnabled,
		setTotalYieldEnabled,
		totalYieldRate,
		setTotalYieldRate,
		isDefault,
		setIsDefault,
		primaryQuantity,
		setPrimaryQuantity,
		primaryUnitId,
		setPrimaryUnitId,
		byProducts,
		byProductCandidateOptions,
		handleAddByProduct,
		handleRemoveByProduct,
		handleUpdateByProduct,
		inputs,
		handleAddInput,
		handleRemoveInput,
		handleUpdateInput,
		hasUpdatableChildBoms,
		handleUpdateAllChildBomsToLatest,
		operations,
		handleAddOperation,
		handleRemoveOperation,
		handleUpdateOperation,
		handleSelectProduct,
		handleSave,
	};
}
