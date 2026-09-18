"use client";

import { useMemo } from "react";
import { FormModal, type FormFieldSchema, toast } from "@base/ui";
import { createPositionAction, updatePositionAction } from "../actions";
import { PositionSubject } from "../position.contract";
import { createPositionSchema, type CreatePositionSchema } from "../position.schema";
import type { PositionItem } from "../types";

export interface PositionFormModalProps {
  readonly open?: boolean;
  readonly mode: "create" | "edit" | "view";
  readonly record?: PositionItem | null;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
  readonly inline?: boolean;
  /** 向后兼容旧回调命名 */
  readonly onSaved?: () => void;
}

export const positionZodSchema = createPositionSchema;

/** 岗位新建/编辑/查看：标准 FormModal 驱动 */
export function PositionFormModal({
  open = true,
  mode,
  record,
  onClose,
  onSuccess,
  onSaved,
  inline,
}: PositionFormModalProps) {
  const isEdit = mode === "edit";

  const initialValues: CreatePositionSchema = useMemo(
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
        disabled: isEdit,
        placeholder: "例如: pos_procurement_mgr",
        hint: isEdit ? "岗位编码创建后不可变更" : undefined,
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
    [isEdit],
  );

  const title =
    mode === "create"
      ? "新建岗位字典"
      : isEdit
        ? `编辑岗位: ${record?.name || ""}`
        : `岗位详情: ${record?.name || ""}`;

  return (
    <FormModal<CreatePositionSchema>
      key={`${mode}-${record?.id || "new"}-${open ? "open" : "closed"}`}
      open={open}
      inline={inline}
      onClose={onClose}
      mode={mode}
      subject={PositionSubject}
      title={title}
      description="维护行政职务字典，编码用于接口与系统内部唯一标识"
      schema={createPositionSchema}
      fields={fields}
      initialValues={initialValues}
      submitText={mode === "create" ? "立即创建岗位" : "保存修改"}
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
        onSuccess?.();
        onSaved?.();
      }}
    />
  );
}
