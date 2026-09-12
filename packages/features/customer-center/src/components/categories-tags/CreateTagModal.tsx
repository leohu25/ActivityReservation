"use client";

import React, { useMemo } from "react";
import { DataTable, toast } from "@chenrun/ui";
import type { DataTableFormFieldSchema } from "@chenrun/ui";
import { createTagAction } from "../../actions";

export interface CreateTagModalProps {
  readonly onClose: () => void;
  readonly onCreated?: () => void;
}

/** 新建业务标签：FormModal + Schema */
export function CreateTagModal({ onClose, onCreated }: CreateTagModalProps) {
  const form = DataTable.useForm({
    tagCode: "",
    tagName: "",
    tagType: "DELIVERY",
    description: "",
  });

  const fields: DataTableFormFieldSchema[] = useMemo(
    () => [
      {
        name: "tagCode",
        label: "标签编码 (唯一标识)",
        type: "text",
        required: true,
        placeholder: "如: TAG_VIP",
      },
      {
        name: "tagName",
        label: "标签名称",
        type: "text",
        required: true,
        placeholder: "如: VIP专属、早间必达",
      },
      {
        name: "tagType",
        label: "标签业务类型",
        type: "select",
        required: true,
        options: [
          { value: "DELIVERY", label: "配送策略 (DELIVERY)" },
          { value: "SETTLEMENT", label: "结算方式 (SETTLEMENT)" },
          { value: "CREDIT", label: "信用分级 (CREDIT)" },
          { value: "OTHER", label: "其他通用 (OTHER)" },
        ],
      },
      {
        name: "description",
        label: "业务描述说明",
        type: "text",
        span: 2,
        placeholder: "标签打标规则与适用场景",
      },
    ],
    [],
  );

  return (
    <DataTable.FormModal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="新建客户业务标签"
      description="标签用于客户打标与业务决策标记"
      submitText="保存标签"
      onSubmit={async () => {
        const res = await createTagAction({
          tagCode: form.values.tagCode,
          tagName: form.values.tagName,
          tagType: form.values.tagType,
          description: form.values.description || null,
        });
        if (!res.success) {
          toast.error(res.error || "创建标签失败");
          throw new Error(res.error || "创建标签失败");
        }
        toast.success("业务标签创建成功");
        onCreated?.();
      }}
    >
      <DataTable.FormSection title="标签信息">
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
