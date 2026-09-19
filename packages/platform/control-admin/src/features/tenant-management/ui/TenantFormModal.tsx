"use client";

import { useMemo } from "react";
import {
  FormModal,
  type FormModalMode,
  type FormModalSection,
  toast,
} from "@base/ui";
import { provisionTenantAction } from "../actions";
import { TenantManagementSubject } from "../contract";
import {
  provisionTenantSchema,
  type ProvisionTenantSchema,
} from "../schema";
import type { ControlTenantItem, ProvisionTenantResult } from "../types";

export interface TenantFormModalProps {
  readonly open: boolean;
  readonly mode: FormModalMode;
  readonly record?: ControlTenantItem | null;
  readonly onClose: () => void;
  readonly onSuccess?: (result?: ProvisionTenantResult) => void;
  readonly inline?: boolean;
}

/**
 * 租户开通与查看模态框 (TenantFormModal)
 * 遵循黄金三态 FormModal 范式：
 * 1. create 模式：开通新租户与物理数据库，由 provisionTenantSchema 强校验驱动；
 * 2. view 模式：查看租户基本标识与物理库配置。
 */
export function TenantFormModal({
  open,
  mode,
  record,
  onClose,
  onSuccess,
  inline,
}: TenantFormModalProps) {
  const initialValues = useMemo<ProvisionTenantSchema>(
    () => ({
      name: record?.name || "",
      slug: record?.slug || "",
      adminEmail: "",
      adminName: "",
      clusterCode: record?.database?.clusterCode || "primary",
      initialPassword: "",
    }),
    [record],
  );

  const sections: FormModalSection[] = useMemo(
    () => [
      {
        title: "租户与物理库信息",
        columns: 2,
        fields: [
          {
            name: "name",
            label: "租户全称",
            type: "text",
            required: true,
            placeholder: "例如: 辰润供应链科技有限公司",
          },
          {
            name: "slug",
            label: "租户Slug标识 (子域名/代号)",
            type: "text",
            required: true,
            placeholder: "例如: chenrun-scm",
          },
          {
            name: "clusterCode",
            label: "部署集群节点",
            type: "text",
            placeholder: "primary",
          },
        ],
      },
      {
        title: "初始管理员账号",
        columns: 2,
        fields: [
          {
            name: "adminEmail",
            label: "超管登录邮箱",
            type: "text",
            required: true,
            placeholder: "admin@enterprise.com",
          },
          {
            name: "adminName",
            label: "超管真实姓名",
            type: "text",
            placeholder: "系统管理员",
          },
          {
            name: "initialPassword",
            label: "初始密码 (留空则系统自动随机生成)",
            type: "password",
            placeholder: "8位以上强密码",
          },
        ],
      },
    ],
    [],
  );

  return (
    <FormModal<ProvisionTenantSchema>
      key={`${mode}-${record?.id || "new"}-${open ? "open" : "closed"}`}
      open={open}
      inline={inline}
      mode={mode}
      subject={TenantManagementSubject}
      title={mode === "create" ? "开通新租户与独立物理库" : `租户信息: ${record?.name}`}
      description="系统将在隔离实例上自动开通 Database-per-Tenant 物理数据库并执行基线迁移"
      schema={provisionTenantSchema}
      sections={sections}
      initialValues={initialValues}
      submitText="立即开通租户并分配独立库"
      onClose={onClose}
      onSubmit={async (values) => {
        const res = await provisionTenantAction(values);
        if (!res.success) {
          toast.error(res.error || "租户开通失败");
          throw new Error(res.error || "租户开通失败");
        }
        toast.success(
          `租户 [${values.name}] 开通成功！已分配独立物理库 [${res.data.databaseName}]`,
        );
        onSuccess?.(res.data);
      }}
    />
  );
}
