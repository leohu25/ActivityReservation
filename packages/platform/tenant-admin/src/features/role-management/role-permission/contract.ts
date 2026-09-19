import {
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";
import { roleConfigurableFields } from "../role-definition/contract";

/** 角色权限配置中心 (矩阵编排) 实体与资源标识 (SSoT) */
export const RoleManagementSubject = "RoleManagement";
export type RoleManagementSubject = typeof RoleManagementSubject;
export const RoleManagementResource = "system.role_management";
export type RoleManagementResource = typeof RoleManagementResource;

/**
 * 权限管理 - 角色权限配置中心页面纯数据权限契约 (SSoT)
 */
export const rolePageContract: FeaturePagePermissionDescriptor = {
  resource: RoleManagementResource,
  subject: RoleManagementSubject,
  label: "角色权限配置",
  path: "/settings/roles",
  actions: [
    { action: StandardAction.READ, label: "查看配置" },
    { action: StandardAction.UPDATE, label: "保存/分配权限" },
  ],
  configurableFields: roleConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;
