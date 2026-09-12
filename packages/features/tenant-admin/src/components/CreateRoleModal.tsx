"use client";

import { useMemo, useState } from "react";
import { FormDialog, FormSection, FormFields, type FormFieldSchema, toast } from "@chenrun/ui";
import { createRoleAction } from "../actions";

export interface CreateRoleModalProps {
  readonly onClose: () => void;
  readonly onCreated?: () => void;
}

/** 新建租户业务角色：FormDialog + FormFields 驱动 */
export function CreateRoleModal({ onClose, onCreated }: CreateRoleModalProps) {
  const [values, setValues] = useState({
    roleCode: "",
    roleName: "",
    description: "",
  });

  const fields: FormFieldSchema[] = useMemo(
    () => [
      {
        name: "roleCode",
        label: "角色标识代码 (Role Code)",
        type: "text",
        required: true,
        span: 2,
        placeholder: "例如: customer_manager, buyer_leader",
        hint: "小写字母开头，由 2-31 位小写字母、数字或下划线组成；创建后不可修改",
      },
      {
        name: "roleName",
        label: "角色显示名称",
        type: "text",
        placeholder: "例如: 客户业务经理",
      },
      {
        name: "description",
        label: "职责描述",
        type: "text",
        placeholder: "该角色在业务流程中的职责说明",
      },
    ],
    [],
  );

  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="新建租户业务角色"
      description="角色编码创建后不可修改，请遵循小写字母下划线规范"
      submitText="确认创建"
      onSubmit={async () => {
        if (!values.roleCode.trim()) {
          toast.error("角色标识代码不能为空");
          throw new Error("角色标识代码不能为空");
        }
        const res = await createRoleAction(
          values.roleCode.trim(),
          values.roleName.trim() || undefined,
          values.description.trim() || undefined,
        );
        if (!res.success) {
          toast.error(res.error || "创建角色失败");
          throw new Error(res.error || "创建角色失败");
        }
        toast.success("角色创建成功");
        onCreated?.();
      }}
    >
      <FormSection title="角色基础信息">
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
