import type { DataScopeType, RolePermissionPayload } from "@base/authorization";

/** 租户角色展示信息模型 */
export interface TenantRoleItem {
  readonly id: string;
  readonly role: string;
  readonly name: string;
  readonly description?: string;
  readonly isSystem: boolean;
  readonly permissions: RolePermissionPayload;
  readonly updatedAt?: Date | null;
}

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

/** 创建自定义角色请求输入 */
export interface CreateRoleInput {
  readonly organizationId: string;
  readonly roleCode: string;
  readonly roleName?: string;
  readonly description?: string;
}
