"use client";

import { useMemo } from "react";
import { FormModal, type FormFieldSchema, toast, z } from "@base/ui";
import { updateRoleAction } from "../actions";
import type { TenantRoleItem } from "../types";

export interface EditRoleModalProps {
  readonly role: TenantRoleItem;
  readonly onClose: () => void;
  readonly onUpdated?: () => void;
}

const editRoleZodSchema = z.object({
  roleCode: z.string(),
  roleName: z.string().min(1, "角色显示名称不能为空"),
  description: z.string().optional(),
});

type EditRoleForm = z.infer<typeof editRoleZodSchema>;

/** 编辑自定义角色：标准 FormModal 驱动 */
export function EditRoleModal({
  role,
  onClose,
  onUpdated,
}: EditRoleModalProps) {
  const initialValues: EditRoleForm = useMemo(
    () => ({
      roleCode: role.role,
      roleName: role.name || role.role,
      description: role.description || "",
    }),
    [role],
  );

  const fields: FormFieldSchema[] = useMemo(
    () => [
      {
        name: "roleCode",
        label: "角色标识代码 (不可修改)",
        type: "text",
        disabled: true,
        span: 2,
      },
      {
        name: "roleName",
        label: "角色显示名称",
        type: "text",
        required: true,
        span: 2,
        placeholder: "例如: 资深销售专员",
      },
      {
        name: "description",
        label: "职责描述",
        type: "text",
        span: 2,
        placeholder: "简要说明该角色的业务定位与职责边界",
      },
    ],
    [],
  );

  return (
    <FormModal<EditRoleForm>
      open
      onClose={onClose}
      mode="edit"
      title={`编辑业务角色 [${role.role}]`}
      description="更新业务角色的显示名称与职责描述；如需配置具体功能或数据权限，请前往权限配置中心"
      schema={editRoleZodSchema}
      fields={fields}
      initialValues={initialValues}
      submitText="保存修改"
      onSubmit={async (values) => {
        const res = await updateRoleAction(
          role.role,
          values.roleName.trim(),
          values.description?.trim() || undefined,
        );
        if (!res.success) {
          toast.error(res.error || "更新角色失败");
          throw new Error(res.error || "更新角色失败");
        }
        toast.success("角色信息更新成功");
        onUpdated?.();
      }}
    />
  );
}
