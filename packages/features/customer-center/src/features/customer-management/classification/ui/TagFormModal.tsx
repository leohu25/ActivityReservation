"use client";

import { useMemo, useState } from "react";
import {
  FormDialog,
  FormSection,
  FormFields,
  type FormFieldSchema,
  toast,
} from "@base/ui";
import { createTagAction, updateTagAction } from "../actions";
import type { CustomerTagItem } from "../types";

export interface TagFormModalProps {
  readonly mode: "create" | "edit";
  readonly record?: CustomerTagItem | null;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

/** 客户业务标签表单：支持新建与编辑修改，唯一编码全自动生成 */
export function TagFormModal({
  mode,
  record,
  onClose,
  onSuccess,
}: TagFormModalProps) {
  const isEdit = mode === "edit";

  const [values, setValues] = useState({
    tagCode: record?.tagCode || "",
    tagName: record?.tagName || "",
    tagType: record?.tagType || "DELIVERY",
    description: record?.description || "",
  });

  const fields: FormFieldSchema[] = useMemo(
    () => [
      ...(isEdit
        ? ([
            {
              name: "tagCode",
              label: "标签编码 (唯一标识)",
              type: "text" as const,
              disabled: true,
              hint: "标签唯一标识由系统自动生成，不可修改",
            },
          ] as FormFieldSchema[])
        : []),
      {
        name: "tagName",
        label: "标签名称",
        type: "text" as const,
        required: true,
        placeholder: "如: VIP专属、早间必达",
      },
      {
        name: "tagType",
        label: "标签业务类型",
        type: "select" as const,
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
        type: "text" as const,
        span: 2 as const,
        placeholder: "标签打标规则与适用场景",
      },
    ],
    [isEdit],
  );

  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={isEdit ? `编辑标签: ${record?.tagName}` : "新建业务标签"}
      description={
        isEdit
          ? "修改业务标签名称、类型及打标业务规则"
          : "标签编码由系统自动生成（格式：TAG_YYYYMMDD_XXXX），无需人工维护"
      }
      submitText={isEdit ? "保存修改" : "立即创建"}
      onSubmit={async () => {
        if (isEdit && record) {
          const res = await updateTagAction(record.tagCode, {
            tagName: values.tagName,
            tagType: values.tagType,
            description: values.description || null,
          });
          if (!res.success) {
            toast.error(res.error || "修改标签失败");
            throw new Error(res.error || "修改标签失败");
          }
          toast.success("业务标签修改成功");
        } else {
          const res = await createTagAction({
            tagName: values.tagName,
            tagType: values.tagType,
            description: values.description || null,
          });
          if (!res.success) {
            toast.error(res.error || "创建标签失败");
            throw new Error(res.error || "创建标签失败");
          }
          toast.success("业务标签创建成功");
        }
        onSuccess?.();
      }}
    >
      <FormSection title="标签配置">
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
