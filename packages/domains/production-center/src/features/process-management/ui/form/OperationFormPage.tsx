"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
	FormPage,
	type FormPageSection,
	toast,
} from "@base/ui";
import { MasterDataStatus } from "@base/shared";
import { OperationSubject } from "../../contract";
import { createOperationSchema } from "../../schema";
import { processingSpecificationSchema } from "../../specification/schema";
import {
	createOperationAction,
	updateOperationAction,
} from "../../actions";
import { createSpecificationColumns } from "../../specification/ui/specificationColumns";
import type {
	OperationDetail,
	OperationFormOptions,
} from "../../types";
import type { ProcessingSpecificationInput } from "../../specification/types";
import type { OperationFormData } from "./types";

export interface OperationFormPageProps {
	readonly initialDetail?: OperationDetail | null;
	readonly options: OperationFormOptions;
	readonly isView?: boolean;
}

export function OperationFormPage({
	initialDetail,
	options,
	isView = false,
}: OperationFormPageProps) {
	const router = useRouter();
	const isEdit = Boolean(initialDetail?.id);
	const mode = isView ? "view" : isEdit ? "edit" : "create";

	const categoryOptions = useMemo(
		() =>
			options.categories.map((c) => ({
				value: c.id,
				label: c.name,
			})),
		[options.categories],
	);

	const unitOptions = useMemo(
		() =>
			options.units.map((u) => ({
				value: u.id,
				label: `${u.name} (${u.code})`,
			})),
		[options.units],
	);

	const initialValues = useMemo<OperationFormData>(() => {
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
				sopText: initialDetail.sopText || "",
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
			status: MasterDataStatus.ACTIVE,
			specifications: [],
		};
	}, [initialDetail]);

	const sections: FormPageSection[] = useMemo(
		() => [
			{
				title: "工序基础与工艺技术参数",
				description:
					"维护工艺档案的基础编码、分类属性、标准工时与参考出成率等关键技术参数",
				columns: 3,
				fields: [
					{
						name: "code",
						label: "工序编码",
						type: "text",
						required: true,
						placeholder: "如 OP_CUT、OP_PICKLE",
					},
					{
						name: "name",
						label: "工序名称",
						type: "text",
						required: true,
						placeholder: "如 切配工序、腌制工序",
					},
					{
						name: "operationCategoryDictItemId",
						label: "工序分类",
						type: "combobox",
						required: true,
						options: categoryOptions,
						placeholder: "请选择工序分类...",
					},
					{
						name: "defaultYieldRate",
						label: "参考出成率 (%)",
						type: "number",
						step: "0.1",
						placeholder: "如 95",
					},
					{
						name: "defaultSetupMinutes",
						label: "准备时间 (分钟)",
						type: "number",
						placeholder: "0",
					},
					{
						name: "defaultCleanupMinutes",
						label: "清理时间 (分钟)",
						type: "number",
						placeholder: "0",
					},
					{
						name: "minimumOperatorCount",
						label: "最少操作人数",
						type: "number",
						placeholder: "如 2",
					},
					{
						name: "minimumBatchQuantity",
						label: "最小批量",
						type: "number",
						step: "0.01",
						placeholder: "如 50",
					},
					{
						name: "minimumBatchUnitId",
						label: "最小批量计量单位",
						type: "combobox",
						options: unitOptions,
						placeholder: "选择计量单位...",
					},
					{
						name: "status",
						label: "工序状态",
						type: "select",
						options: [
							{ value: MasterDataStatus.ACTIVE, label: "正常启用" },
							{ value: MasterDataStatus.DISABLED, label: "已停用" },
						],
					},
					{
						name: "sopText",
						label: "SOP 标准作业指导说明",
						type: "textarea",
						placeholder: "录入本工序通用的 SOP 操作指引、安全规程或卫生要求...",
						rows: 3,
						span: 3,
					},
				],
			},
		],
		[categoryOptions, unitOptions],
	);

	const specificationColumns = useMemo(
		() => createSpecificationColumns({ isView }),
		[isView],
	);

	const handleSubmit = useCallback(
		async (
			values: OperationFormData,
			context: { items: ProcessingSpecificationInput[] },
		) => {
			const payload = {
				...values,
				code: values.code.trim(),
				name: values.name.trim(),
				sopText: values.sopText ? values.sopText.trim() : null,
				specifications: context.items.map((s) => ({
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
				return;
			}

			toast.success(isEdit ? "工艺档案更新成功" : "工艺档案创建成功");
			router.push("/production/operations");
			router.refresh();
		},
		[isEdit, initialDetail, router],
	);

	const pageTitle = isView
		? `工艺档案详情: ${initialValues.name || initialValues.code}`
		: isEdit
			? `编辑工艺档案: ${initialValues.name || initialValues.code}`
			: "新建工艺档案";

	return (
		<FormPage<OperationFormData, ProcessingSpecificationInput>
			mode={mode}
			title={pageTitle}
			description="维护工序主技术参数及下挂的多工艺规格明细"
			subject={OperationSubject}
			schema={createOperationSchema}
			initialValues={initialValues}
			sections={sections}
			initialItems={initialValues.specifications}
			detailConfig={{
				title: "工序工艺规格明细",
				description:
					"维护本工序可适用的具体加工规格（如切片厚度、切块大小等）。选定规格后其说明将自动带入BOM工艺指引",
				addText: "添加规格",
				columns: specificationColumns,
				schema: processingSpecificationSchema,
				onAddRow: () => ({
					code: `SPEC_${String(Date.now()).slice(-4)}`,
					name: "",
					defaultYieldRate: null,
					description: "",
					status: MasterDataStatus.ACTIVE,
				}),
			}}
			onBack={() => router.push("/production/operations")}
			backText="返回列表"
			onSubmit={handleSubmit}
		/>
	);
}
