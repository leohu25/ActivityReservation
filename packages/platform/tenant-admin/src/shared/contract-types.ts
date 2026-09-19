import type { StandardAction } from "@base/authorization";
import type {
  DepartmentSubject,
  EmployeeSubject,
  PositionSubject,
} from "../features/org-management/contract";
import type {
  RoleManagementSubject,
  RoleSubject,
} from "../features/role-management/contract";
import type {
  CompanyProfileSubject,
  GeneralSettingsSubject,
  SecuritySettingsSubject,
} from "../features/tenant-settings/contract";
import type {
  AuditLogLoginSubject,
  AuditLogOperationSubject,
  AuditLogPermissionSubject,
} from "../features/audit-log/contract";
import type { TenantMenuItemSubject } from "../features/nav-management/contract";

/** 企业系统管理受控实体/能力 Subject 强类型联合 */
export type TenantAdminSubjectType =
  | DepartmentSubject
  | PositionSubject
  | EmployeeSubject
  | RoleSubject
  | RoleManagementSubject
  | CompanyProfileSubject
  | GeneralSettingsSubject
  | SecuritySettingsSubject
  | AuditLogOperationSubject
  | AuditLogLoginSubject
  | AuditLogPermissionSubject
  | TenantMenuItemSubject;

/** 企业系统管理受控操作 Action 强类型联合 */
export type TenantAdminActionType = StandardAction;
