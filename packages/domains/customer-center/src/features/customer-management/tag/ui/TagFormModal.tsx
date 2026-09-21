"use client";

import { useMemo } from "react";
import { FormModal, type FormFieldSchema, toast } from "@base/ui";
import { createTagAction, updateTagAction } from "../actions";
import { CustomerTagSubject } from "../contract";
import { createTagSchema, type CreateTagSchema } from "../schema";
import type { CustomerTagItem, TagTypeOption } from "../types";

export interface TagFormModalProps {
	readonly open?: boolean;
	readonly mode: "create" | "edit" | "view";
	readonly record?: CustomerTagItem | null;
	readonly onClose: () => void;
	readonly onSuccess?: () => void;
	readonly inline?: boolean;
	readonly tagTypeOptions?: readonly TagTypeOption[] | TagTypeOption[];
}

/** 客户业务标签表单：标准 FormModal 驱动（支持 create / edit / view 模式） */
export function TagFormModal({
	open = true,
	mode,
	record,
	onClose,
	onSuccess,
	inline,
	tagTypeOptions = [],
}: TagFormModalProps) {
	const isEdit = mode === "edit";
	const isView = mode === "view";

	const resolvedTagOptions = useMemo(() => {
		const raw = tagTypeOptions ?? [];
		const options = raw.map((opt) => ({
			value: opt.value,
			label: opt.code ? `${opt.label} (${opt.code})` : opt.label,
		}));
		const recordTagTypeId = record?.tagTypeId;
		if (recordTagTypeId && !options.some((o) => o.value === recordTagTypeId)) {
			const label = record.tagType
				? `${record.tagType.name} (${record.tagType.code}) [已停用/历史]`
				: `${recordTagTypeId} (已停用/未匹配)`;
			options.push({
				value: recordTagTypeId,
				label,
			});
		}
		return options;
	}, [tagTypeOptions, record?.tagTypeId, record?.tagType]);

	const defaultTagTypeId = useMemo(() => {
		if (record?.tagTypeId) return record.tagTypeId;
		const activeDefault = tagTypeOptions?.find((o) => o.isDefault)?.value;
		if (activeDefault) return activeDefault;
		return resolvedTagOptions[0]?.value || "";
	}, [record?.tagTypeId, tagTypeOptions, resolvedTagOptions]);

	const initialValues: CreateTagSchema = useMemo(
		() => ({
			name: record?.name || "",
			tagTypeId: defaultTagTypeId,
			description: record?.description || "",
		}),
		[record, defaultTagTypeId],
	);

	const fields: FormFieldSchema[] = useMemo(
		() => [
			{
				name: "name",
				label: "标签名称",
				type: "text" as const,
				required: true,
				placeholder: "如: VIP专属、早间必达",
			},
			{
				name: "tagTypeId",
				label: "标签业务类型",
				type: "select" as const,
				required: true,
				options: resolvedTagOptions,
			},
			{
				name: "description",
				label: "业务描述说明",
				type: "text" as const,
				span: 2 as const,
				placeholder: "标签打标规则与适用场景",
			},
		],
		[resolvedTagOptions],
	);

	const title = isView
		? `查看标签: ${record?.name || record?.id}`
		: isEdit
			? `编辑标签: ${record?.name}`
			: "新建业务标签";

	return (
		<FormModal<CreateTagSchema>
			key={`${mode}-${record?.id || "new"}-${open ? "open" : "closed"}`}
			open={open}
			inline={inline}
			onClose={onClose}
			mode={mode}
			subject={CustomerTagSubject}
			title={title}
			description={
				isView
					? "查看业务标签详细配置与打标规则"
					: isEdit
						? "修改业务标签名称、类型及打标业务规则"
						: "填写业务标签名称与类型"
			}
			schema={createTagSchema}
			fields={fields}
			initialValues={initialValues}
			submitText={isEdit ? "保存修改" : "立即创建"}
			onSubmit={async (values) => {
				if (isView) {
					onClose();
					return;
				}
				if (isEdit && record) {
					const res = await updateTagAction(record.id, {
						name: values.name,
						tagTypeId: values.tagTypeId,
						description: values.description || null,
					});
					if (!res.success) {
						toast.error(res.error || "修改标签失败");
						throw new Error(res.error || "修改标签失败");
					}
					toast.success("标签已成功更新");
				} else {
					const res = await createTagAction({
						name: values.name,
						tagTypeId: values.tagTypeId,
						description: values.description || null,
					});
					if (!res.success) {
						toast.error(res.error || "创建标签失败");
						throw new Error(res.error || "创建标签失败");
					}
					toast.success("新业务标签已创建");
				}
				onSuccess?.();
			}}
		/>
	);
}
