"use client";

import { useMemo } from "react";
import { FormModal, type FormFieldSchema, toast, z } from "@base/ui";
import { createCategoryAction, updateCategoryAction } from "../actions";
import type { CategoryListItem } from "../types";

export interface CategoryFormModalProps {
  readonly mode: "create" | "edit";
  readonly record?: CategoryListItem | null;
  readonly categories: readonly CategoryListItem[];
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

const categoryFormZodSchema = z.object({
  categoryCode: z.string().min(1, "分类编码不能为空"),
  categoryName: z.string().min(1, "分类名称不能为空"),
  parentId: z.string().optional(),
  level: z.number().default(1),
  sortOrder: z.number().default(0),
});

type CategoryFormData = z.infer<typeof categoryFormZodSchema>;

export function CategoryFormModal({
  mode,
  record,
  categories,
  onClose,
  onSuccess,
}: CategoryFormModalProps) {
  const isEdit = mode === "edit";

  const parentOptions = useMemo(() => {
    return [
      { value: "", label: "(无父级 · 一级分类)" },
      ...categories
        .filter((c) => !isEdit || c.id !== record?.id)
        .map((c) => ({
          value: c.id,
          label: `${c.categoryName} (${c.categoryCode})`,
        })),
    ];
  }, [categories, isEdit, record]);

  const initialValues: CategoryFormData = useMemo(
    () => ({
      categoryCode: record?.categoryCode || "",
      categoryName: record?.categoryName || "",
      parentId: record?.parentId || "",
      level: record?.level ?? 1,
      sortOrder: record?.sortOrder ?? 0,
    }),
    [record],
  );

  const fields: FormFieldSchema[] = useMemo(
    () => [
      {
        name: "categoryCode",
        label: "分类编码",
        type: "text" as const,
        required: true,
        disabled: isEdit,
        placeholder: "如: CAT-VEG",
        hint: isEdit ? "分类编码由系统建档锁定，不可变更" : undefined,
      },
      {
        name: "categoryName",
        label: "分类名称",
        type: "text" as const,
        required: true,
        placeholder: "如: 蔬菜、调理肉类",
      },
      {
        name: "parentId",
        label: "上级分类",
        type: "select" as const,
        options: parentOptions,
      },
      {
        name: "level",
        label: "分类层级",
        type: "number" as const,
        hint: "1 为一级大类，2 为二级子分类",
      },
    ],
    [isEdit, parentOptions],
  );

  return (
    <FormModal<CategoryFormData>
      open
      onClose={onClose}
      mode={mode}
      title={isEdit ? `编辑分类: ${record?.categoryName}` : "新增商品分类"}
      description="配置生鲜净菜加工的一二级品类字典"
      schema={categoryFormZodSchema}
      fields={fields}
      initialValues={initialValues}
      submitText={isEdit ? "保存修改" : "立即创建"}
      onSubmit={async (values) => {
        if (isEdit && record) {
          const res = await updateCategoryAction({
            id: record.id,
            categoryName: values.categoryName,
            parentId: values.parentId || null,
            level: Number(values.level) || 1,
            sortOrder: Number(values.sortOrder) || 0,
          });
          if (!res.success) {
            toast.error(res.error || "修改分类失败");
            throw new Error(res.error || "修改分类失败");
          }
          toast.success("分类已成功更新");
        } else {
          const res = await createCategoryAction({
            categoryCode: values.categoryCode,
            categoryName: values.categoryName,
            parentId: values.parentId || null,
            level: Number(values.level) || 1,
            sortOrder: Number(values.sortOrder) || 0,
          });
          if (!res.success) {
            toast.error(res.error || "创建分类失败");
            throw new Error(res.error || "创建分类失败");
          }
          toast.success("新分类已创建");
        }
        onSuccess?.();
      }}
    />
  );
}
