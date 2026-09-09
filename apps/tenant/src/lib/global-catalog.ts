import { createPermissionCatalog } from "@chenrun/authorization";
import { customerPermissionDefinitions } from "@chenrun/feature-customer-center";
import { procurementPermissionDefinition } from "@chenrun/feature-procurement-center";

/**
 * 全局租户端自描述权限资源清单（供全局 Ability 构建与侧边栏动态过滤使用）
 * 彻底遵循形态 A（隐式自动推导）：仅注册真实的业务实体资源，完全废弃任何 *.module 伪资源！
 * TODO 后续改为自动扫描,动态发现。
 */
export const globalTenantPermissionDefinitions = [
  procurementPermissionDefinition,
  ...customerPermissionDefinitions,

  // 组织架构独立实体
  {
    resource: "organization.employee",
    subject: "Employee",
    label: "员工管理",
    actions: ["read", "create", "update", "delete"],
  },
  {
    resource: "organization.department",
    subject: "Department",
    label: "部门管理",
    actions: ["read", "create", "update", "delete"],
  },
  {
    resource: "organization.position",
    subject: "Position",
    label: "岗位管理",
    actions: ["read", "create", "update", "delete"],
  },

  // 系统管理相关实体
  {
    resource: "system.roles",
    subject: "RoleManagement",
    label: "角色权限管理",
    actions: ["read", "update"],
  },
  {
    resource: "settings.company",
    subject: "CompanyProfile",
    label: "企业信息",
    actions: ["read", "update"],
  },
  {
    resource: "settings.general",
    subject: "GeneralSettings",
    label: "基础设置",
    actions: ["read", "update"],
  },
  {
    resource: "settings.security",
    subject: "SecuritySettings",
    label: "安全设置",
    actions: ["read", "update"],
  },
  {
    resource: "audit.operations",
    subject: "AuditLogOperation",
    label: "操作日志",
    actions: ["read", "export"],
  },
  {
    resource: "audit.logins",
    subject: "AuditLogLogin",
    label: "登录日志",
    actions: ["read", "export"],
  },
  {
    resource: "audit.permissions",
    subject: "AuditLogPermission",
    label: "权限变更日志",
    actions: ["read", "export"],
  },
] as const;

export const globalTenantCatalog = createPermissionCatalog(
  globalTenantPermissionDefinitions,
);
