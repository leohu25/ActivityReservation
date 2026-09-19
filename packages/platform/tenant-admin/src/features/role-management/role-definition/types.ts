import type { RolePermissionPayload } from "@base/authorization";

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

/** 创建自定义角色请求输入 */
export interface CreateRoleInput {
  readonly organizationId: string;
  readonly roleCode: string;
  readonly roleName?: string;
  readonly description?: string;
}

/** 更新自定义角色请求输入 */
export interface UpdateRoleInput {
  readonly organizationId: string;
  readonly roleCode: string;
  readonly roleName?: string;
  readonly description?: string;
}

/** 分页与检索角色列表输入 */
export interface ListRolesQueryInput {
  readonly page?: number;
  readonly pageSize?: number;
  readonly keyword?: string;
}

/** 分页角色响应模型 */
export interface PaginatedRolesResult {
  readonly items: readonly TenantRoleItem[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}
