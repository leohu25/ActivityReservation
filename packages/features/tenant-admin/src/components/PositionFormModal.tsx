"use client";

import React, { useMemo } from "react";
import { DataTable, toast } from "@chenrun/ui";
import type { DataTableFormFieldSchema } from "@chenrun/ui";
import {
  createPositionAction,
  updatePositionAction,
} from "../actions";
import type { PositionItem } from "../types";

export interface PositionFormModalProps {
  readonly mode: "create" | "edit";
  readonly record?: PositionItem | null;
  readonly onClose: () => void;
  readonly onSaved?: () => void;
}

type PositionForm = {
  name: string;
  code: string;
  description: string;
  sort: number;
};

/** 岗位新建/编辑：FormModal + Schema */
export function PositionFormModal({
  mode,
  record,
  onClose,
  onSaved,
}: PositionFormModalProps) {
  const form = DataTable.useForm<PositionForm>({
    name: record?.name || "",
    code: record?.code || "",
    description: record?.description || "",
    sort: record?.sort ?? 0,
  });

  const fields: DataTableFormFieldSchema[] = useMemo(
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
    <DataTable.FormModal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      record={record}
      title={mode === "create" ? "新建岗位字典" : "编辑岗位信息"}
      description="维护行政职务字典，编码用于接口与系统内部唯一标识"
      submitText="确认保存"
      onSubmit={async () => {
        const payload = {
          name: form.values.name.trim(),
          code: form.values.code.trim(),
          description: form.values.description.trim() || null,
          sort: Number(form.values.sort) || 0,
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
    >
      <DataTable.FormSection title="岗位信息">
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
