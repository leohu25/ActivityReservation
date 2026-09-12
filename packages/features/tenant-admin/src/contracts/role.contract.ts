import {
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@chenrun/authorization";

/** 角色权限管理实体与资源标识 (SSoT) */
export const RoleManagementSubject = "RoleManagement";
export const RoleManagementResource = "system.roles";

/** 角色管理受控字段字典 */
export const RoleField = {
  ROLE: "role",
  NAME: "name",
  DESCRIPTION: "description",
  IS_SYSTEM: "isSystem",
  PERMISSIONS: "permissions",
} as const;

export type RoleField = (typeof RoleField)[keyof typeof RoleField];

/** 角色管理受控字段元数据定义 */
export const roleConfigurableFields = [
  { field: RoleField.ROLE, label: "角色编码", isSensitive: false },
  { field: RoleField.NAME, label: "角色名称", isSensitive: false },
  { field: RoleField.DESCRIPTION, label: "角色描述", isSensitive: false },
  { field: RoleField.IS_SYSTEM, label: "是否系统内置", isSensitive: false },
  { field: RoleField.PERMISSIONS, label: "权限配置载荷", isSensitive: false },
] as const;

/**
 * 角色权限管理页面纯数据权限契约 (SSoT)
 */
export const rolePageContract: FeaturePagePermissionDescriptor = {
  resource: RoleManagementResource,
  subject: RoleManagementSubject,
  label: "角色权限管理",
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
