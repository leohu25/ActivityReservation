"use client";

import { useMemo } from "react";
import {
  FormModal,
  type FormModalMode,
  type FormModalSection,
  type ComboboxOption,
  toast,
} from "@base/ui";
import { createDepartmentAction, updateDepartmentAction } from "../actions";
import { DepartmentSubject } from "../contract";
import {
  createDepartmentSchema,
  type CreateDepartmentSchema,
} from "../schema";
import type { DepartmentTreeNode } from "../types";

export interface DepartmentFormModalProps {
  readonly open: boolean;
  readonly mode: FormModalMode;
  readonly record?: DepartmentTreeNode | null;
  /** 扁平化可选上级部门列表 */
  readonly parentOptions: readonly {
    id: string;
    name: string;
    depth: number;
  }[];
  readonly defaultParentId?: string | null;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
  readonly inline?: boolean;
}

/**
 * 部门新建/编辑/只读详情：官方三态受控 FormModal
 * 1. 单一度量源 (SSoT)：直接复用 department.schema.ts 中的 createDepartmentSchema；
 * 2. 上级部门选择全面升级为 Combobox（支持即时模糊打字检索与一键清空）；
 * 3. 严格遵循受控契约，彻底清除旧胶水回调 onSaved。
 */
export function DepartmentFormModal({
  open,
  mode,
  record,
  parentOptions,
  defaultParentId,
  onClose,
  onSuccess,
  inline,
}: DepartmentFormModalProps) {
  const isEdit = mode === "edit";

  const initialValues = useMemo<CreateDepartmentSchema>(
    () => ({
      name: record?.name || "",
      code: record?.code || "",
      parentId: (isEdit ? record?.parentId : defaultParentId) || "",
      sort: record?.sort ?? 0,
    }),
    [record, isEdit, defaultParentId],
  );

  // 过滤掉自身（防止自选循环）
  const parentComboboxOptions = useMemo<ComboboxOption[]>(() => {
    return parentOptions.flatMap((opt) =>
      opt.id === record?.id
        ? []
        : [
            {
              value: opt.id,
              label: `${"— ".repeat(opt.depth)}${opt.name}`,
            },
          ],
    );
  }, [parentOptions, record?.id]);

  const sections: FormModalSection[] = useMemo(
    () => [
      {
        title: "基本信息",
        columns: 2,
        fields: [
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
            type: "combobox",
            options: parentComboboxOptions,
            placeholder: "无上级 (作为顶级根部门)",
            clearable: true,
          },
          {
            name: "sort",
            label: "同级排序号",
            type: "number",
            placeholder: "0",
          },
        ],
      },
    ],
    [parentComboboxOptions],
  );

  return (
    <FormModal<CreateDepartmentSchema>
      key={`${mode}-${record?.id || "new"}-${open ? "open" : "closed"}`}
      open={open}
      inline={inline}
      mode={mode}
      subject={DepartmentSubject}
      title={
        mode === "create"
          ? "新建部门节点"
          : isEdit
            ? `编辑部门: ${record?.name}`
            : `部门详情: ${record?.name}`
      }
      description="系统将在服务端严格防范循环引用与重复编码"
      schema={createDepartmentSchema}
      sections={sections}
      initialValues={initialValues}
      onClose={onClose}
      onSubmit={async (values) => {
        if (isEdit && record) {
          const res = await updateDepartmentAction(record.id, values);
          if (!res.success) {
            toast.error(res.error || "更新部门失败");
            throw new Error(res.error || "更新部门失败");
          }
          toast.success("部门更新成功");
        } else {
          const res = await createDepartmentAction(values);
          if (!res.success) {
            toast.error(res.error || "创建部门失败");
            throw new Error(res.error || "创建部门失败");
          }
          toast.success("部门创建成功");
        }
        onSuccess?.();
      }}
    />
  );
}
