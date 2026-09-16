"use client";

import { useMemo } from "react";
import { FormModal, type FormFieldSchema, toast, z } from "@base/ui";
import { createCategoryAction, updateCategoryAction } from "../actions";
import type { CustomerCategoryItem } from "../types";

export interface CategoryFormModalProps {
  readonly mode: "create" | "edit";
  readonly record?: CustomerCategoryItem | null;
  readonly defaultParentCode?: string | null;
  readonly categories: readonly CustomerCategoryItem[];
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

const categoryFormZodSchema = z.object({
  categoryName: z.string().min(1, "分类名称不能为空"),
  parentCode: z.string().optional(),
  description: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categoryFormZodSchema>;

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

/** 客户分类表单：标准 FormModal 驱动 */
export function CategoryFormModal({
  mode,
  record,
  defaultParentCode,
  categories,
  onClose,
  onSuccess,
}: CategoryFormModalProps) {
  const isEdit = mode === "edit";

  const flatOptions = useMemo(
    () =>
      flattenCategoryTree(
        isEdit && record
          ? categories.filter((c) => c.categoryCode !== record.categoryCode)
          : categories,
      ),
    [categories, isEdit, record],
  );

  const initialValues: CategoryFormData = useMemo(
    () => ({
      categoryName: record?.categoryName || "",
      parentCode: record?.parentCode || defaultParentCode || "",
      description: record?.description || "",
    }),
    [record, defaultParentCode],
  );

  const fields: FormFieldSchema[] = useMemo(
    () => [
      {
        name: "categoryName",
        label: "分类名称",
        type: "text" as const,
        required: true,
        placeholder: "如: 连锁餐饮 / 企事业单位",
      },
      {
        name: "parentCode",
        label: "父级分类",
        type: "select" as const,
        hint: "留空则作为一级根分类",
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
        placeholder: "分类适用范围与说明",
      },
    ],
    [flatOptions],
  );

  const title = isEdit
    ? `编辑分类: ${record?.categoryName}`
    : defaultParentCode
      ? `新增下级分类 (归属于: ${defaultParentCode})`
      : "新增一级根分类";

  return (
    <FormModal<CategoryFormData>
      open
      onClose={onClose}
      mode={mode}
      title={title}
      description={
        isEdit
          ? "更新分类名称、上级归属及业务说明"
          : "分类编码由系统自动生成（格式：CAT_YYYYMMDD_XXXX），无需人工维护"
      }
      schema={categoryFormZodSchema}
      fields={fields}
      initialValues={initialValues}
      submitText={isEdit ? "保存修改" : "立即创建"}
      onSubmit={async (values) => {
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
