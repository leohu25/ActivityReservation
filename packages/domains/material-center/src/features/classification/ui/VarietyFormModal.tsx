"use client";

import { useMemo } from "react";
import { FormModal, type FormFieldSchema, toast, z } from "@base/ui";
import { createVarietyAction } from "../actions";
import type { VarietyListItem } from "../types";

export interface VarietyFormModalProps {
  readonly mode: "create" | "edit";
  readonly record?: VarietyListItem | null;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

const varietyFormZodSchema = z.object({
  varietyCode: z.string().min(1, "品种编码不能为空"),
  varietyName: z.string().min(1, "品种名称不能为空"),
  description: z.string().optional(),
});

type VarietyFormData = z.infer<typeof varietyFormZodSchema>;

export function VarietyFormModal({
  mode,
  record,
  onClose,
  onSuccess,
}: VarietyFormModalProps) {
  const isEdit = mode === "edit";

  const initialValues: VarietyFormData = useMemo(
    () => ({
      varietyCode: record?.varietyCode || "",
      varietyName: record?.varietyName || "",
      description: record?.description || "",
    }),
    [record],
  );

  const fields: FormFieldSchema[] = useMemo(
    () => [
      {
        name: "varietyCode",
        label: "品种编码",
        type: "text" as const,
        required: true,
        disabled: isEdit,
        placeholder: "如: VAR-POTATO",
        hint: isEdit ? "品种编码由系统建档锁定，不可变更" : undefined,
      },
      {
        name: "varietyName",
        label: "品种名称",
        type: "text" as const,
        required: true,
        placeholder: "如: 荷兰土豆、螺丝椒",
      },
      {
        name: "description",
        label: "品种特征与说明",
        type: "text" as const,
        placeholder: "适宜切丝、耐储存",
      },
    ],
    [isEdit],
  );

  return (
    <FormModal<VarietyFormData>
      open
      onClose={onClose}
      mode={mode}
      title={isEdit ? `编辑品种: ${record?.varietyName}` : "新增独立品种档案"}
      description="维护农产品、生鲜作物的独立生物品种与性状"
      schema={varietyFormZodSchema}
      fields={fields}
      initialValues={initialValues}
      submitText={isEdit ? "保存修改" : "立即创建"}
      onSubmit={async (values) => {
        if (!isEdit) {
          const res = await createVarietyAction({
            varietyCode: values.varietyCode,
            varietyName: values.varietyName,
            description: values.description || null,
          });
          if (!res.success) {
            toast.error(res.error || "创建品种失败");
            throw new Error(res.error || "创建品种失败");
          }
          toast.success("新独立品种已创建");
        }
        onSuccess?.();
      }}
    />
  );
}
