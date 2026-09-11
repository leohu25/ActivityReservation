"use client";

import React, { useMemo } from "react";
import { DataTable, toast } from "@chenrun/ui";
import type { DataTableFormFieldSchema } from "@chenrun/ui";
import { createCategoryAction } from "../actions";
import type { CustomerCategoryItem } from "../types";

export interface CreateCategoryModalProps {
  readonly categories: readonly CustomerCategoryItem[];
  readonly onClose: () => void;
  readonly onCreated?: () => void;
}

/** 新建客户分类：FormModal + Schema */
export function CreateCategoryModal({
  categories,
  onClose,
  onCreated,
}: CreateCategoryModalProps) {
  const form = DataTable.useForm({
    categoryCode: "",
    categoryName: "",
    parentCode: "",
    description: "",
  });

  const fields: DataTableFormFieldSchema[] = useMemo(
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
    <DataTable.FormModal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="新建客户分类"
      description="分类编码全局唯一，保存后可挂到客户档案"
      submitText="保存分类"
      onSubmit={async () => {
        const res = await createCategoryAction({
          categoryCode: form.values.categoryCode,
          categoryName: form.values.categoryName,
          parentCode: form.values.parentCode || null,
          description: form.values.description || null,
        });
        if (!res.success) {
          toast.error(res.error || "创建分类失败");
          throw new Error(res.error || "创建分类失败");
        }
        toast.success("客户分类创建成功");
        onCreated?.();
      }}
    >
      <DataTable.FormSection title="分类信息">
        <DataTable.FormFields
          fields={fields}
          values={form.values}
          onChange={form.setField}
          columns={2}
        />
      </DataTable.FormSection>
    </DataTable.FormModal>
  );
}
