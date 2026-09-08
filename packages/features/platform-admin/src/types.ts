import type { TenantDatabaseStatus } from "@chenrun/db-control";

/**
 * 租户全景运维信息契约
 */
export interface PlatformTenantItem {
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
 * 平台总控统计概览
 */
export interface PlatformAdminStats {
  readonly totalTenants: number;
  readonly activeTenants: number;
  readonly suspendedTenants: number;
  readonly failedTenants: number;
  readonly provisioningTenants: number;
}

/**
 * 开通新租户参数
 */
export interface ProvisionTenantInput {
  /** 租户组织名称 */
  readonly name: string;
  /** 租户组织唯一标识 (Slug) */
  readonly slug: string;
  /** 初始组织管理员邮箱 */
  readonly adminEmail: string;
  /** 初始组织管理员名称（可选） */
  readonly adminName?: string;
  /** 集群标识编码（可选，缺省 primary） */
  readonly clusterCode?: string;
}

/**
 * 租户开通操作返回结果
 */
export interface ProvisionTenantResult {
  readonly organizationId: string;
  readonly slug: string;
  readonly databaseName: string;
  readonly status: TenantDatabaseStatus;
}
