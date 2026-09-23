import { useState, useMemo, useCallback, useEffect } from "react";
import { toast, updateTabTitle, useSafeRouter, type FormPageMode } from "@base/ui";
import { useAbility } from "@base/authorization";
import {
	BOM_TYPES,
	QUANTITY_MODES,
	MATERIAL_ROLES,
	OUTPUT_ROLES,
	BomSubject,
	BomField,
	type BomType,
	type MaterialRole,
} from "../../contract";
import type {
	BomDetailDto,
	BomFormOptions,
	CreateBomInput,
	UpdateBomInput,
} from "../../types";
import { createBomAction, updateBomAction } from "../../actions";
import type { FormInputRow, FormOperationRow } from "./types";

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

	// 联副产品产出
	const [byProductIds, setByProductIds] = useState<string[]>(() => {
		if (initialDetail?.currentVersion.outputs) {
			return initialDetail.currentVersion.outputs
				.filter((o) => o.outputRole === OUTPUT_ROLES.BYPRODUCT)
				.map((o) => o.productId);
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
				sequenceNumber: op.sequenceNumber,
				standardLaborHours: Number(op.standardLaborHours ?? 0),
				qualityCheckpoint: op.qualityCheckpoint,
				instructionText: op.instructionText || "",
			}));
		}
		return [];
	});

	// 选择主产出商品时自动联动
	const handleSelectProduct = useCallback(
		(pId: string) => {
			setProductId(pId);
			setByProductIds((prev) => prev.filter((id) => id !== pId));
			const prod = formOptions.products.find((p) => p.id === pId);
			if (prod) {
				if (!name) setName(`${prod.name} 生产BOM`);
				setPrimaryUnitId(prod.inventoryUnitId);
			}
		},
		[formOptions.products, name],
	);

	// 副产品候选列表（排除主产品与已添加的副产品）
	const byProductCandidateOptions = useMemo(() => {
		return formOptions.products
			.filter((p) => p.id !== productId && !byProductIds.includes(p.id))
			.map((p) => ({
				value: p.id,
				label: `${p.name} (${p.code})`,
			}));
	}, [formOptions.products, productId, byProductIds]);

	const handleAddByProduct = useCallback((pId: string | null) => {
		if (pId && !byProductIds.includes(pId)) {
			setByProductIds((prev) => [...prev, pId]);
		}
	}, [byProductIds]);

	const handleRemoveByProduct = useCallback((pId: string) => {
		setByProductIds((prev) => prev.filter((id) => id !== pId));
	}, []);

	// 投入行增删改
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
						next[idx].unitId = found.inventoryUnitId;
					}
				}
				return next;
			});
		},
		[formOptions.products],
	);

	// 工序行增删改
	const handleAddOperation = useCallback(() => {
		setOperations((prev) => [
			...prev,
			{
				operationId: formOptions.operations[0]?.id || "",
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
				return next;
			});
		},
		[],
	);

	// 权限判定
	const ability = useAbility();
	const canReadName = ability.can("read", BomSubject, BomField.NAME);
	const canReadCode = ability.can("read", BomSubject, BomField.CODE);

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
					...byProductIds.map((bpId, idx) => {
						const bpProd = formOptions.products.find((p) => p.id === bpId);
						return {
							productId: bpId,
							quantity: 1,
							unitId: bpProd?.inventoryUnitId || formOptions.units[0]?.id || "",
							outputRole: OUTPUT_ROLES.BYPRODUCT,
							sortOrder: idx + 1,
							remark: "联副产品",
						};
					}),
				],
				inputs: inputs.map((inp, idx) => ({
					productId: inp.productId,
					quantity: isRatioMode ? null : Number(inp.quantity),
					unitId: inp.unitId,
					ratio: isRatioMode ? Number(inp.ratio) / 100 : null,
					materialRole: inp.materialRole as MaterialRole,
					cookedYieldRate: Number(inp.cookedYieldRate) / 100,
					normalLossRate: Number(inp.normalLossRate) / 100,
					sortOrder: idx,
				})),
				operations: operations.map((op, idx) => ({
					operationId: op.operationId,
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
		byProductIds,
		byProductCandidateOptions,
		handleAddByProduct,
		handleRemoveByProduct,
		inputs,
		handleAddInput,
		handleRemoveInput,
		handleUpdateInput,
		operations,
		handleAddOperation,
		handleRemoveOperation,
		handleUpdateOperation,
		handleSelectProduct,
		handleSave,
	};
}
