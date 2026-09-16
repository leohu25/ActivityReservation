"use client";

import { useMemo } from "react";
import {
  z,
  FormModal,
  type FormFieldSchema,
  type FormModalSection,
  toast,
} from "@base/ui";
import { createDepartmentAction, updateDepartmentAction } from "../actions";
import type { DepartmentTreeNode } from "../types";

export interface DepartmentFormModalProps {
  readonly mode: "create" | "edit";
  readonly record?: DepartmentTreeNode | null;
  /** 扁平化上级部门选项（含缩进深度） */
  readonly parentOptions: readonly {
    id: string;
    name: string;
    depth: number;
  }[];
  readonly defaultParentId?: string | null;
  readonly onClose: () => void;
  readonly onSaved?: () => void;
  readonly inline?: boolean;
}

export type DepartmentFormData = {
  name: string;
  code: string;
  parentId: string;
  sort: number;
};

export const departmentFormZodSchema = z.object({
  name: z.string().trim().min(1, "部门名称为必填项"),
  code: z.string().trim().min(1, "部门编码 (唯一标识) 为必填项"),
  parentId: z.string().optional().default(""),
  sort: z.coerce.number().optional().default(0),
});

/** 部门新建/编辑：FormModal + Zod Schema 声明式驱动 */
export function DepartmentFormModal({
  mode,
  record,
  parentOptions,
  defaultParentId,
  onClose,
  onSaved,
  inline,
}: DepartmentFormModalProps) {
  const initialValues = useMemo<DepartmentFormData>(
    () => ({
      name: record?.name || "",
      code: record?.code || "",
      parentId: (mode === "edit" ? record?.parentId : defaultParentId) || "",
      sort: record?.sort ?? 0,
    }),
    [record, mode, defaultParentId],
  );

  const fields: FormFieldSchema[] = useMemo(
    () => [
      {
        name: "name",
        label: "部门名称",
        type: "text",
        required: true,
        placeholder: "例如: 华东销售部、研发中心",
      },
      {
        name: "code",
        label: "部门编码 (唯一标识)",
        type: "text",
        required: true,
        placeholder: "例如: SALES_EAST、DEV",
      },
      {
        name: "parentId",
        label: "上级部门",
        type: "select",
        options: [
          { value: "", label: "-- 无上级 (作为顶级根部门) --" },
          ...parentOptions.map((opt) => ({
            value: opt.id,
            label: `${"— ".repeat(opt.depth)}${opt.name}`,
          })),
        ],
      },
      {
        name: "sort",
        label: "同级排序号",
        type: "number",
      },
    ],
    [parentOptions],
  );

  const sections: FormModalSection[] = useMemo(
    () => [
      {
        title: "部门信息",
        fields,
        columns: 2,
      },
    ],
    [fields],
  );

  const handleSubmit = async (values: DepartmentFormData) => {
    const payload = {
      name: values.name.trim(),
      code: values.code.trim(),
      parentId: values.parentId || null,
      leaderMemberId: null,
      sort: Number(values.sort) || 0,
    };
    const res =
      mode === "create"
        ? await createDepartmentAction(payload)
        : await updateDepartmentAction(record!.id, payload);
    if (!res.success) {
      toast.error(res.error || "保存部门失败");
      throw new Error(res.error || "保存部门失败");
    }
    toast.success(mode === "create" ? "部门创建成功" : "部门更新成功");
    onSaved?.();
  };

  return (
    <FormModal<DepartmentFormData>
      open
      inline={inline}
      mode={mode}
      title={mode === "create" ? "新建部门节点" : "编辑部门节点"}
      description="系统将严格防范循环引用与重复编码"
      submitText="确认保存"
      sections={sections}
      initialValues={initialValues}
      schema={departmentFormZodSchema}
      onClose={onClose}
      onSubmit={handleSubmit}
    />
  );
}

