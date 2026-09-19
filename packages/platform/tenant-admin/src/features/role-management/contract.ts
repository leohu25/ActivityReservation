import {
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";
import { defineListSearchParams } from "@base/ui";

/** 角色列表 URL 搜索契约 (SSoT) */
export const roleSearchParams = defineListSearchParams({
  keyword: "",
});

export type RoleSearchParams = ReturnType<typeof roleSearchParams.parse>;

/** 角色管理 (组织架构下 CRUD) 实体与资源标识 (SSoT) */
export const RoleSubject = "Role";
export type RoleSubject = typeof RoleSubject;
export const RoleResource = "organization.role";
export type RoleResource = typeof RoleResource;

/** 角色权限配置中心 (矩阵编排) 实体与资源标识 (SSoT) */
export const RoleManagementSubject = "RoleManagement";
export type RoleManagementSubject = typeof RoleManagementSubject;
export const RoleManagementResource = "system.role_management";
export type RoleManagementResource = typeof RoleManagementResource;

/** 角色受控字段字典 */
export const RoleField = {
  ROLE: "role",
  NAME: "name",
  DESCRIPTION: "description",
  IS_SYSTEM: "isSystem",
  PERMISSIONS: "permissions",
} as const;

export type RoleField = (typeof RoleField)[keyof typeof RoleField];

/** 角色受控字段元数据定义 */
export const roleConfigurableFields = [
  { field: RoleField.ROLE, label: "角色编码", isSensitive: false },
  { field: RoleField.NAME, label: "角色名称", isSensitive: false },
  { field: RoleField.DESCRIPTION, label: "角色描述", isSensitive: false },
  { field: RoleField.IS_SYSTEM, label: "是否系统内置", isSensitive: false },
  { field: RoleField.PERMISSIONS, label: "权限配置载荷", isSensitive: false },
] as const;

/**
 * 组织架构 - 角色管理页面纯数据权限契约 (SSoT)
 */
export const roleDefinitionPageContract: FeaturePagePermissionDescriptor = {
  resource: RoleResource,
  subject: RoleSubject,
  label: "角色管理",
  path: "/organization/roles",
  actions: [
    { action: StandardAction.READ, label: "查看角色" },
    { action: StandardAction.CREATE, label: "新建角色" },
    { action: StandardAction.UPDATE, label: "编辑角色" },
    { action: StandardAction.DELETE, label: "删除角色" },
  ],
  configurableFields: roleConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;

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
