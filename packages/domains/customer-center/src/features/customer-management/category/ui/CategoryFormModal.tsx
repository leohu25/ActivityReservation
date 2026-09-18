"use client";

import { useMemo } from "react";
import { FormModal, type FormFieldSchema, toast } from "@base/ui";
import { createCategoryAction, updateCategoryAction } from "../actions";
import { CustomerCategorySubject } from "../contract";
import { createCategorySchema, type CreateCategorySchema } from "../schema";
import type { CustomerCategoryItem } from "../types";

export interface CategoryFormModalProps {
	readonly mode: "create" | "edit" | "view";
	readonly record?: CustomerCategoryItem | null;
	readonly defaultParentCode?: string | null;
	readonly categories: readonly CustomerCategoryItem[];
	readonly onClose: () => void;
	readonly onSuccess?: () => void;
}

/** 递归压平分类树，供选择父级时使用 */
function flattenCategoryTree(
	list: readonly CustomerCategoryItem[],
	depth = 0,
): { categoryCode: string; categoryName: string; depth: number }[] {
	const result: {
		categoryCode: string;
		categoryName: string;
		depth: number;
	}[] = [];
	for (const item of list) {
		result.push({
			categoryCode: item.categoryCode,
			categoryName: `${"— ".repeat(depth)}${item.categoryName}`,
			depth,
		});
		if (item.children && item.children.length > 0) {
			result.push(...flattenCategoryTree(item.children, depth + 1));
		}
	}
	return result;
}

/** 客户分类表单：标准 FormModal 驱动（支持 create / edit / view 模式） */
export function CategoryFormModal({
	mode,
	record,
	defaultParentCode,
	categories,
	onClose,
	onSuccess,
}: CategoryFormModalProps) {
	const isEdit = mode === "edit";
	const isView = mode === "view";

	const flatOptions = useMemo(
		() =>
			flattenCategoryTree(
				(isEdit || isView) && record
					? categories.filter((c) => c.categoryCode !== record.categoryCode)
					: categories,
			),
		[categories, isEdit, isView, record],
	);

	const initialValues: CreateCategorySchema = useMemo(
		() => ({
			categoryCode: record?.categoryCode || "",
			categoryName: record?.categoryName || "",
			parentCode: record?.parentCode || defaultParentCode || "",
			description: record?.description || "",
		}),
		[record, defaultParentCode],
	);

	const fields: FormFieldSchema[] = useMemo(
		() => [
			...(isEdit || isView
				? ([
						{
							name: "categoryCode",
							label: "分类编码",
							type: "text" as const,
							disabled: true,
							hint: "分类唯一编码，由系统自动生成",
						},
					] as FormFieldSchema[])
				: []),
			{
				name: "categoryName",
				label: "分类名称",
				type: "text" as const,
				required: !isView,
				disabled: isView,
				placeholder: "如: 连锁餐饮 / 企事业单位",
			},
			{
				name: "parentCode",
				label: "父级分类",
				type: "select" as const,
				disabled: isView,
				hint: isView ? undefined : "留空则作为一级根分类",
				options: [
					{ value: "", label: "(无父级 · 作为一级根分类)" },
					...flatOptions.map((c) => ({
						value: c.categoryCode,
						label: `${c.categoryName} (${c.categoryCode})`,
					})),
				],
			},
			{
				name: "description",
				label: "业务描述说明",
				type: "text" as const,
				span: 2 as const,
				disabled: isView,
				placeholder: "分类适用范围与说明",
			},
		],
		[flatOptions, isEdit, isView],
	);

	const title = isView
		? `查看分类: ${record?.categoryName || record?.categoryCode}`
		: isEdit
			? `编辑分类: ${record?.categoryName}`
			: defaultParentCode
				? `新增下级分类 (归属于: ${defaultParentCode})`
				: "新增一级根分类";

	return (
		<FormModal<CreateCategorySchema>
			open
			onClose={onClose}
			mode={mode}
			subject={CustomerCategorySubject}
			title={title}
			description={
				isView
					? "查看分类基本信息、上级归属及业务说明"
					: isEdit
						? "更新分类名称、上级归属及业务说明"
						: "分类编码由系统自动生成（格式：CAT_YYYYMMDD_XXXX），无需人工维护"
			}
			schema={createCategorySchema}
			fields={fields}
			initialValues={initialValues}
			submitText={isEdit ? "保存修改" : "立即创建"}
			onSubmit={async (values) => {
				if (isView) {
					onClose();
					return;
				}
				if (isEdit && record) {
					const res = await updateCategoryAction(record.categoryCode, {
						categoryName: values.categoryName,
						parentCode: values.parentCode || null,
						description: values.description || null,
					});
					if (!res.success) {
						toast.error(res.error || "更新分类失败");
						throw new Error(res.error || "更新分类失败");
					}
					toast.success("分类已成功更新");
				} else {
					const res = await createCategoryAction({
						categoryName: values.categoryName,
						parentCode: values.parentCode || null,
						description: values.description || null,
					});
					if (!res.success) {
						toast.error(res.error || "创建分类失败");
						throw new Error(res.error || "创建分类失败");
					}
					toast.success("新客户分类已创建");
				}
				onSuccess?.();
			}}
		/>
	);
}
