"use client";

import { useMemo } from "react";
import { FormModal, type FormFieldSchema, toast } from "@base/ui";
import { RoleSubject } from "../contract";
import {
  createRoleSchema,
  updateRoleSchema,
  type CreateRoleSchema,
} from "../schema";
import { createRoleAction, updateRoleAction } from "../actions";
import type { TenantRoleItem } from "../types";

export interface RoleFormModalProps {
  readonly open?: boolean;
  readonly mode: "create" | "edit" | "view";
  readonly record?: TenantRoleItem | null;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
  readonly inline?: boolean;
}

/**
 * 组织架构 - 角色表单弹窗 (现代数智工业风)
 * 基于标准 FormModal 驱动，支持 create / edit / view 三态模式
 * 严格声明 subject={RoleSubject}，权限由上下文感知
 */
export function RoleFormModal({
  open = true,
  mode,
  record,
  onClose,
  onSuccess,
  inline,
}: RoleFormModalProps) {
  const isCreate = mode === "create";
  const isView = mode === "view";

  const initialValues: CreateRoleSchema = useMemo(
    () => ({
      roleCode: record?.role ?? "",
      roleName: record?.name ?? "",
      description: record?.description ?? "",
    }),
    [record],
  );

  const fields: FormFieldSchema[] = useMemo(
    () => [
      {
        name: "roleCode",
        label: "角色标识代码 (Role Code)",
        type: "text",
        required: isCreate,
        disabled: !isCreate,
        placeholder: "例如: customer_manager, buyer_leader",
        hint: isCreate
          ? "以小写字母开头，由 2-32 位小写字母、数字或下划线组成；创建后全局不可修改"
          : "角色标识代码为不可变业务主键",
      },
      {
        name: "roleName",
        label: "角色显示名称",
        type: "text",
        required: true,
        disabled: isView,
        placeholder: "例如: 客户业务经理",
      },
      {
        name: "description",
        label: "职责描述",
        type: "textarea",
        disabled: isView,
        placeholder: "描述该角色在业务流程中的核心职责与职能定位",
      },
    ],
    [isCreate, isView],
  );

  const handleSubmit = async (values: CreateRoleSchema) => {
    if (isView) {
      onClose();
      return;
    }

    try {
      if (isCreate) {
        const res = await createRoleAction(values);
        if (res.success) {
          toast.success(`业务角色 [${values.roleName}] 创建成功`);
          onSuccess?.();
          onClose();
        } else {
          toast.error(res.error || "创建角色失败");
        }
      } else if (record) {
        const res = await updateRoleAction({
          roleCode: record.role,
          roleName: values.roleName,
          description: values.description,
        });
        if (res.success) {
          toast.success(`角色 [${record.role}] 更新成功`);
          onSuccess?.();
          onClose();
        } else {
          toast.error(res.error || "更新角色失败");
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "操作异常");
    }
  };

  return (
    <FormModal<CreateRoleSchema>
      key={`${mode}-${record?.role || "new"}-${open ? "open" : "closed"}`}
      open={open}
      inline={inline}
      onClose={onClose}
      mode={mode}
      subject={RoleSubject}
      title={
        isCreate
          ? "新建业务角色"
          : isView
            ? `角色详情: ${record?.name || record?.role}`
            : `编辑角色: ${record?.name || record?.role}`
      }
      description={
        isCreate
          ? "为租户创建业务角色代码，后续可针对此角色分配菜单、操作动作及数据范围"
          : isView
            ? "查看系统预置或自定义业务角色的基本档案"
            : "调整角色的对外展示名称与职能说明"
      }
      schema={isCreate ? createRoleSchema : updateRoleSchema}
      fields={fields}
      initialValues={initialValues}
      submitText={
        isCreate ? "确认创建" : isView ? "关闭" : "保存修改"
      }
      onSubmit={handleSubmit}
    />
  );
}
