import {
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";

/** 审计日志实体与资源标识 (SSoT) */
export const AuditLogOperationSubject = "AuditLogOperation";
export const AuditLogOperationResource = "audit.operations";

export const AuditLogLoginSubject = "AuditLogLogin";
export const AuditLogLoginResource = "audit.logins";

export const AuditLogPermissionSubject = "AuditLogPermission";
export const AuditLogPermissionResource = "audit.permissions";

/** 操作日志页面纯数据权限契约 */
export const auditOperationPageContract: FeaturePagePermissionDescriptor = {
  resource: AuditLogOperationResource,
  subject: AuditLogOperationSubject,
  label: "操作日志",
  path: "/audit/operations",
  actions: [
    { action: StandardAction.READ, label: "查看日志" },
    { action: StandardAction.EXPORT, label: "导出日志" },
  ],
} as const;

/** 登录日志页面纯数据权限契约 */
export const auditLoginPageContract: FeaturePagePermissionDescriptor = {
  resource: AuditLogLoginResource,
  subject: AuditLogLoginSubject,
  label: "登录日志",
  path: "/audit/logins",
  actions: [
    { action: StandardAction.READ, label: "查看日志" },
    { action: StandardAction.EXPORT, label: "导出日志" },
  ],
} as const;

/** 权限变更日志页面纯数据权限契约 */
export const auditPermissionPageContract: FeaturePagePermissionDescriptor = {
  resource: AuditLogPermissionResource,
  subject: AuditLogPermissionSubject,
  label: "权限变更日志",
  path: "/audit/permissions",
  actions: [
    { action: StandardAction.READ, label: "查看日志" },
    { action: StandardAction.EXPORT, label: "导出日志" },
  ],
} as const;
