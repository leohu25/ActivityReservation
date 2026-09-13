"use client";

import { useMemo, useState } from "react";
import {
  FormDialog,
  FormSection,
  FormFields,
  type FormFieldSchema,
  toast,
} from "@base/ui";
import { createCategoryAction, updateCategoryAction } from "../actions";
import type { CustomerCategoryItem } from "../types";

export interface CategoryFormModalProps {
  readonly mode: "create" | "edit";
  readonly record?: CustomerCategoryItem | null;
  readonly categories: readonly CustomerCategoryItem[];
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

/** 客户分类表单：支持新建与编辑修改 */
export function CategoryFormModal({
  mode,
  record,
  categories,
  onClose,
  onSuccess,
}: CategoryFormModalProps) {
  const isEdit = mode === "edit";

  const [values, setValues] = useState({
    categoryCode: record?.categoryCode || "",
    categoryName: record?.categoryName || "",
    parentCode: record?.parentCode || "",
    description: record?.description || "",
  });

  const availableParents = useMemo(
    () =>
      categories.filter(
        (c) => !isEdit || c.categoryCode !== record?.categoryCode,
      ),
    [categories, isEdit, record],
  );

  const fields: FormFieldSchema[] = useMemo(
    () => [
      {
        name: "categoryCode",
        label: "分类编码 (唯一标识)",
        type: "text",
        required: true,
        disabled: isEdit,
        placeholder: "如: CUST_CAT_001",
        hint: isEdit ? "分类唯一标识创建后不可修改" : undefined,
      },
      {
        name: "categoryName",
        label: "分类名称",
        type: "text",
        required: true,
        placeholder: "如: 连锁餐饮 / 企事业单位",
      },
      {
        name: "parentCode",
        label: "父级分类编码",
        type: "select",
        hint: "留空则作为根分类",
        options: [
          { value: "", label: "(作为根分类)" },
          ...availableParents.map((c) => ({
            value: c.categoryCode,
            label: `${c.categoryName} (${c.categoryCode})`,
          })),
        ],
      },
      {
        name: "description",
        label: "业务描述说明",
        type: "text",
        span: 2,
        placeholder: "分类适用范围与说明",
      },
    ],
    [availableParents, isEdit],
  );

  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={isEdit ? `编辑分类: ${record?.categoryName}` : "新建客户分类"}
      description={
        isEdit
          ? "更新分类名称、上级归属及业务说明"
          : "分类编码全局唯一，保存后可挂到客户档案"
      }
      submitText={isEdit ? "保存修改" : "保存分类"}
      onSubmit={async () => {
        if (isEdit && record) {
          const res = await updateCategoryAction(record.categoryCode, {
            categoryName: values.categoryName,
            parentCode: values.parentCode || null,
            description: values.description || null,
          });
          if (!res.success) {
            toast.error(res.error || "修改分类失败");
            throw new Error(res.error || "修改分类失败");
          }
          toast.success("客户分类修改成功");
        } else {
          const res = await createCategoryAction({
            categoryCode: values.categoryCode,
            categoryName: values.categoryName,
            parentCode: values.parentCode || null,
            description: values.description || null,
          });
          if (!res.success) {
            toast.error(res.error || "创建分类失败");
            throw new Error(res.error || "创建分类失败");
          }
          toast.success("客户分类创建成功");
        }
        onSuccess?.();
      }}
    >
      <FormSection title="分类信息">
        <FormFields
          fields={fields}
          values={values}
          onChange={(name, val) =>
            setValues((prev) => ({ ...prev, [name]: val }))
          }
          columns={2}
        />
      </FormSection>
    </FormDialog>
  );
}
