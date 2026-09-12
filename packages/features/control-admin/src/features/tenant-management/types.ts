import type { TenantDatabaseStatus } from "@base/db-control";

/**
 * 控制平面租户全景运维信息契约
 */
export interface ControlTenantItem {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly createdAt: Date;
  readonly memberCount: number;
  readonly database: {
    readonly databaseName: string;
    readonly clusterCode: string;
    readonly schemaVersion: string;
    readonly status: TenantDatabaseStatus;
    readonly updatedAt: Date;
  } | null;
  readonly latestMigration?: {
    readonly version: string;
    readonly migrationName: string;
    readonly status: string;
    readonly appliedSteps: number;
  } | null;
}

/**
 * 开通新租户参数契约
 */
export interface ProvisionTenantInput {
  readonly name: string;
  readonly slug: string;
  readonly adminEmail: string;
  readonly adminName?: string;
  readonly clusterCode?: string;
  readonly initialPassword?: string;
}

/**
 * 租户开通操作返回结果契约
 */
export interface ProvisionTenantResult {
  readonly organizationId: string;
  readonly slug: string;
  readonly databaseName: string;
  readonly status: TenantDatabaseStatus;
  readonly initialPassword?: string;
}

/**
 * 租户成员信息契约
 */
export interface ControlTenantMember {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly image: string | null;
  readonly role: string;
  readonly createdAt: Date;
}

/**
 * 租户成员列表分页与过滤参数契约
 */
export interface GetTenantMembersQuery {
  readonly search?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

/**
 * 租户全景详情契约（包含物理库拓扑与成员分页数据）
 */
export interface ControlTenantDetail {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly createdAt: Date;
  readonly authorizationVersion: number;
  readonly database: {
    readonly id: string;
    readonly databaseName: string;
    readonly clusterCode: string;
    readonly secretRef: string;
    readonly schemaVersion: string;
    readonly status: TenantDatabaseStatus;
    readonly createdAt: Date;
    readonly updatedAt: Date;
  } | null;
  readonly members: readonly ControlTenantMember[];
  readonly memberPagination: {
    readonly total: number;
    readonly page: number;
    readonly pageSize: number;
    readonly totalPages: number;
  };
}

/**
 * 重置租户成员密码结果契约
 */
export interface ResetTenantUserPasswordResult {
  readonly userId: string;
  readonly email: string;
  readonly temporaryPassword: string;
}
