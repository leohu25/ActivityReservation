import type { DataScopeType, RolePermissionPayload } from "@base/authorization";

/** 资源动作元数据模型 */
export interface ActionOption {
  readonly action: string;
  readonly label: string;
  readonly supportedScopes: readonly DataScopeType[];
  readonly supportedFields: readonly string[];
}

/** 资源权限自描述清单视图模型 */
export interface ResourcePermissionDescriptor {
  readonly resource: string;
  readonly subject: string;
  readonly label: string;
  readonly actions: readonly ActionOption[];
  readonly allFields: readonly string[];
}

/** 字段矩阵单行配置 */
export interface FieldMatrixRow {
  readonly field: string;
  readonly label?: string;
  readonly canRead: boolean;
  readonly canCreate: boolean;
  readonly canUpdate: boolean;
  readonly canExport: boolean;
}

/** 保存角色权限请求载荷 */
export interface SaveRolePermissionsInput {
  readonly organizationId: string;
  readonly role: string;
  readonly payload: RolePermissionPayload;
}
