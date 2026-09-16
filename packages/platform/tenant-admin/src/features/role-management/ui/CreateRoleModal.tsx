"use client";

import { useMemo } from "react";
import { FormModal, type FormFieldSchema, toast, z } from "@base/ui";
import { createRoleAction } from "../actions";

export interface CreateRoleModalProps {
  readonly onClose: () => void;
  readonly onCreated?: () => void;
}

const createRoleZodSchema = z.object({
  roleCode: z.string().min(2, "角色标识代码至少2个字符"),
  roleName: z.string().optional(),
  description: z.string().optional(),
});

type CreateRoleForm = z.infer<typeof createRoleZodSchema>;

/** 新建租户业务角色：标准 FormModal 驱动 */
export function CreateRoleModal({ onClose, onCreated }: CreateRoleModalProps) {
  const initialValues: CreateRoleForm = useMemo(
    () => ({
      roleCode: "",
      roleName: "",
      description: "",
    }),
    [],
  );

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
    <FormModal<CreateRoleForm>
      open
      onClose={onClose}
      mode="create"
      title="新建业务角色"
      description="为租户配置专属的业务角色代码，后续可针对此角色授权具体菜单、按钮操作及数据访问范围"
      schema={createRoleZodSchema}
      fields={fields}
      initialValues={initialValues}
      submitText="确认创建"
      onSubmit={async (values) => {
        const res = await createRoleAction(
          values.roleCode.trim(),
          values.roleName?.trim() || undefined,
          values.description?.trim() || undefined,
        );
        if (!res.success) {
          toast.error(res.error || "创建角色失败");
          throw new Error(res.error || "创建角色失败");
        }
        toast.success("角色创建成功");
        onCreated?.();
      }}
    />
  );
}
