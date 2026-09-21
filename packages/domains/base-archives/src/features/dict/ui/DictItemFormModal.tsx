"use client";

import { useMemo } from "react";
import { FormModal, type FormFieldSchema, toast } from "@base/ui";
import {
	createTenantDictItemAction,
	updateTenantDictItemAction,
} from "../actions";
import {
	DICT_TYPE_OPTIONS,
	TenantDictItemSubject,
} from "../contract";
import {
	createDictItemSchema,
	type CreateDictItemSchema,
} from "../schema";
import type { TenantDictItemDto } from "../types";

export interface DictItemFormModalProps {
	readonly open?: boolean;
	readonly mode: "create" | "edit" | "view";
	readonly record?: TenantDictItemDto | null;
	readonly defaultType?: string;
	readonly onClose: () => void;
	readonly onSuccess?: () => void;
	readonly inline?: boolean;
}

export function DictItemFormModal({
	open = true,
	mode,
	record,
	defaultType = "",
	onClose,
	onSuccess,
	inline,
}: DictItemFormModalProps) {
	const isEdit = mode === "edit";
	const isView = mode === "view";

	const initialValues: CreateDictItemSchema = useMemo(
		() => ({
			type: record?.type || defaultType || DICT_TYPE_OPTIONS[0].value,
			code: record?.code || "",
			name: record?.name || "",
			status: record?.status || "ACTIVE",
			sort: record?.sort ?? 0,
			isDefault: record?.isDefault ?? false,
			remark: record?.remark || "",
		}),
		[record, defaultType],
	);

	const fields: FormFieldSchema[] = useMemo(
		() => [
			{
				name: "type",
				label: "字典类型 (type)",
				type: "combobox" as const,
				required: true,
				disabled: isEdit,
				placeholder: "选择或输入字典类型",
				options: DICT_TYPE_OPTIONS.map((o) => ({
					value: o.value,
					label: o.label,
				})),
			},
			{
				name: "code",
				label: "字典项编码 (code)",
				type: "text" as const,
				required: true,
				disabled: isEdit,
				placeholder: "如: HIGH, 01, VIP",
			},
			{
				name: "name",
				label: "字典项名称 (name)",
				type: "text" as const,
				required: true,
				placeholder: "如: 高价值客户、月结30天",
			},
			{
				name: "sort",
				label: "排序权重 (sort)",
				type: "number" as const,
				placeholder: "数字越小越靠前，默认 0",
			},
			{
				name: "isDefault",
				label: "是否默认选项",
				type: "switch" as const,
				placeholder: "启用后默认选中此项",
			},
			{
				name: "remark",
				label: "备注说明",
				type: "textarea" as const,
				span: 2 as const,
				placeholder: "字典项业务背景或使用场景说明",
			},
		],
		[isEdit],
	);

	const title = isView
		? `查看字典项: ${record?.name || record?.code}`
		: isEdit
			? `编辑字典项: ${record?.name} (${record?.code})`
			: "新建数据字典项";

	return (
		<FormModal<CreateDictItemSchema>
			key={`${mode}-${record?.id || "new"}-${open ? "open" : "closed"}`}
			open={open}
			inline={inline}
			onClose={onClose}
			mode={mode}
			subject={TenantDictItemSubject}
			title={title}
			description={
				isView
					? "查看字典项详细配置与分类信息"
					: isEdit
						? "修改字典项显示名称、排序权重与备注（编码与类型不可变）"
						: "填写字典项所属类型、业务编码与名称"
			}
			schema={createDictItemSchema}
			fields={fields}
			initialValues={initialValues}
			submitText={isEdit ? "保存修改" : "立即创建"}
			onSubmit={async (values) => {
				if (isView) {
					onClose();
					return;
				}

				if (isEdit && record) {
					const res = await updateTenantDictItemAction({
						id: record.id,
						name: values.name,
						status: values.status,
						sort: values.sort,
						isDefault: values.isDefault,
						remark: values.remark || null,
					});

					if (res.success) {
						toast.success("字典项已成功保存");
						onSuccess?.();
						onClose();
					} else {
						toast.error(res.error || "保存失败");
					}
					return;
				}

				const res = await createTenantDictItemAction({
					type: values.type,
					code: values.code,
					name: values.name,
					status: values.status,
					sort: values.sort,
					isDefault: values.isDefault,
					remark: values.remark || null,
				});

				if (res.success) {
					toast.success("字典项创建成功");
					onSuccess?.();
					onClose();
				} else {
					toast.error(res.error || "创建失败");
				}
			}}
		/>
	);
}
