"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@base/ui";
import {
	createOperationAction,
	updateOperationAction,
} from "../../actions";
import type { OperationDetail } from "../../types";
import type { ProcessingSpecificationInput } from "../../specification/types";
import type { OperationFormData } from "./types";

export interface UseOperationFormStateOptions {
	initialDetail?: OperationDetail | null;
	onSaved?: (detail: OperationDetail) => void;
}

export function useOperationFormState({
	initialDetail,
	onSaved,
}: UseOperationFormStateOptions = {}) {
	const router = useRouter();
	const isEdit = Boolean(initialDetail?.id);

	const [formData, setFormData] = useState<OperationFormData>(() => {
		if (initialDetail) {
			return {
				code: initialDetail.code,
				name: initialDetail.name,
				operationCategoryDictItemId: initialDetail.operationCategoryDictItemId,
				defaultSetupMinutes: initialDetail.defaultSetupMinutes,
				defaultCleanupMinutes: initialDetail.defaultCleanupMinutes,
				defaultYieldRate:
					initialDetail.defaultYieldRate !== null &&
					initialDetail.defaultYieldRate !== undefined
						? initialDetail.defaultYieldRate <= 1
							? Number((initialDetail.defaultYieldRate * 100).toFixed(2))
							: initialDetail.defaultYieldRate
						: null,
				minimumOperatorCount: initialDetail.minimumOperatorCount,
				minimumBatchQuantity: initialDetail.minimumBatchQuantity,
				minimumBatchUnitId: initialDetail.minimumBatchUnitId,
				sopText: initialDetail.sopText,
				status: initialDetail.status,
				specifications: initialDetail.specifications.map((s) => ({
					id: s.id,
					code: s.code,
					name: s.name,
					description: s.description,
					defaultYieldRate:
						s.defaultYieldRate !== null && s.defaultYieldRate !== undefined
							? s.defaultYieldRate <= 1
								? Number((s.defaultYieldRate * 100).toFixed(2))
								: s.defaultYieldRate
							: null,
					status: s.status,
				})),
			};
		}

		return {
			code: "",
			name: "",
			operationCategoryDictItemId: "",
			defaultSetupMinutes: 0,
			defaultCleanupMinutes: 0,
			defaultYieldRate: null,
			minimumOperatorCount: null,
			minimumBatchQuantity: null,
			minimumBatchUnitId: null,
			sopText: "",
			status: "ACTIVE",
			specifications: [],
		};
	});

	const [isSubmitting, setIsSubmitting] = useState(false);

	const updateField = useCallback(
		(field: keyof OperationFormData, value: unknown) => {
			setFormData((prev) => ({
				...prev,
				[field]: value,
			}));
		},
		[],
	);

	const updateSpecifications = useCallback(
		(specifications: readonly ProcessingSpecificationInput[]) => {
			setFormData((prev) => ({
				...prev,
				specifications,
			}));
		},
		[],
	);

	const handleSave = useCallback(async () => {
		// 1. 客户端前置验证
		if (!formData.code.trim()) {
			toast.error("请输入工序编码");
			return false;
		}
		if (!formData.name.trim()) {
			toast.error("请输入工序名称");
			return false;
		}
		if (!formData.operationCategoryDictItemId) {
			toast.error("请选择工序分类");
			return false;
		}

		// 2. 规格校验
		for (let i = 0; i < formData.specifications.length; i++) {
			const spec = formData.specifications[i];
			if (!spec.code.trim()) {
				toast.error(`工艺规格明细第 ${i + 1} 行的规格编码不能为空`);
				return false;
			}
			if (!spec.name.trim()) {
				toast.error(`工艺规格明细第 ${i + 1} 行的规格名称不能为空`);
				return false;
			}
		}

		const codes = formData.specifications.map((s) => s.code.trim().toUpperCase());
		const uniqueCodes = new Set(codes);
		if (uniqueCodes.size !== codes.length) {
			toast.error("工艺规格明细中规格编码不能重复");
			return false;
		}

		setIsSubmitting(true);
		try {
			const payload = {
				...formData,
				code: formData.code.trim(),
				name: formData.name.trim(),
				specifications: formData.specifications.map((s) => ({
					...s,
					code: s.code.trim(),
					name: s.name.trim(),
					description: s.description?.trim() || null,
				})),
			};

			const res =
				isEdit && initialDetail?.id
					? await updateOperationAction(initialDetail.id, payload)
					: await createOperationAction(payload);

			if (!res.success) {
				toast.error(res.error || "保存失败");
				return false;
			}

			toast.success(isEdit ? "工艺档案更新成功" : "工艺档案创建成功");

			if (onSaved) {
				onSaved(res.data);
			} else {
				router.push("/production/operations");
				router.refresh();
			}
			return true;
		} catch (err: unknown) {
			toast.error(
				err instanceof Error ? err.message : "保存工艺档案失败，请稍后重试",
			);
			return false;
		} finally {
			setIsSubmitting(false);
		}
	}, [formData, isEdit, initialDetail, onSaved, router]);

	return {
		formData,
		isEdit,
		isSubmitting,
		updateField,
		updateSpecifications,
		handleSave,
	};
}
