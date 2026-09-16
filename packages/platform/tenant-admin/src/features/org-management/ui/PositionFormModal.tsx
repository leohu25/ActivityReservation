"use client";

import { useMemo } from "react";
import { FormModal, type FormFieldSchema, toast, z } from "@base/ui";
import { createPositionAction, updatePositionAction } from "../actions";
import type { PositionItem } from "../types";

export interface PositionFormModalProps {
  readonly mode: "create" | "edit";
  readonly record?: PositionItem | null;
  readonly onClose: () => void;
  readonly onSaved?: () => void;
}

const positionZodSchema = z.object({
  name: z.string().min(1, "岗位名称不能为空"),
  code: z.string().min(1, "岗位编码不能为空"),
  description: z.string().optional(),
  sort: z.number().default(0),
});

type PositionForm = z.infer<typeof positionZodSchema>;

/** 岗位新建/编辑：标准 FormModal 驱动 */
export function PositionFormModal({
  mode,
  record,
  onClose,
  onSaved,
}: PositionFormModalProps) {
  const initialValues: PositionForm = useMemo(
    () => ({
      name: record?.name || "",
      code: record?.code || "",
      description: record?.description || "",
      sort: record?.sort ?? 0,
    }),
    [record],
  );

  const fields: FormFieldSchema[] = useMemo(
    () => [
      {
        name: "name",
        label: "岗位名称",
        type: "text",
        required: true,
        placeholder: "例如: 采购经理、技术主管",
      },
      {
        name: "code",
        label: "岗位编码",
        type: "text",
        required: true,
        placeholder: "例如: pos_procurement_mgr",
      },
      {
        name: "description",
        label: "职责说明",
        type: "textarea",
        span: 2,
        rows: 3,
        placeholder: "描述该岗位的核心工作范畴与职责要求",
      },
      {
        name: "sort",
        label: "同级排序号",
        type: "number",
      },
    ],
    [],
  );

  return (
    <FormModal<PositionForm>
      open
      onClose={onClose}
      mode={mode}
      title={mode === "create" ? "新建岗位字典" : "编辑岗位信息"}
      description="维护行政职务字典，编码用于接口与系统内部唯一标识"
      schema={positionZodSchema}
      fields={fields}
      initialValues={initialValues}
      submitText="确认保存"
      onSubmit={async (values) => {
        const payload = {
          name: values.name.trim(),
          code: values.code.trim(),
          description: values.description?.trim() || null,
          sort: Number(values.sort) || 0,
        };
        const res =
          mode === "create"
            ? await createPositionAction(payload)
            : await updatePositionAction(record!.id, payload);
        if (!res.success) {
          toast.error(res.error || "保存岗位失败");
          throw new Error(res.error || "保存岗位失败");
        }
        toast.success(mode === "create" ? "岗位已创建" : "岗位已更新");
        onSaved?.();
      }}
    />
  );
}
