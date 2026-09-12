"use client";

import { useMemo, useState } from "react";
import { FormDialog, FormSection, FormFields, type FormFieldSchema, toast } from "@chenrun/ui";
import { createCategoryAction } from "../../actions";
import type { CustomerCategoryItem } from "../../types";

export interface CreateCategoryModalProps {
  readonly categories: readonly CustomerCategoryItem[];
  readonly onClose: () => void;
  readonly onCreated?: () => void;
}

/** 新建客户分类：标准 FormDialog + FormFields 驱动 */
export function CreateCategoryModal({
  categories,
  onClose,
  onCreated,
}: CreateCategoryModalProps) {
  const [values, setValues] = useState({
    categoryCode: "",
    categoryName: "",
    parentCode: "",
    description: "",
  });

  const fields: FormFieldSchema[] = useMemo(
    () => [
      {
        name: "categoryCode",
        label: "分类编码 (唯一标识)",
        type: "text",
        required: true,
        placeholder: "如: CUST_CAT_001",
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
          ...categories.map((c) => ({
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
    [categories],
  );

  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="新建客户分类"
      description="分类编码全局唯一，保存后可挂到客户档案"
      submitText="保存分类"
      onSubmit={async () => {
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
        onCreated?.();
      }}
    >
      <FormSection title="分类信息">
        <FormFields
          fields={fields}
          values={values}
          onChange={(name, val) => setValues((prev) => ({ ...prev, [name]: val }))}
          columns={2}
        />
      </FormSection>
    </FormDialog>
  );
}
