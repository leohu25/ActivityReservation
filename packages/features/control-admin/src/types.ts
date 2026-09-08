import type { TenantDatabaseStatus } from "@chenrun/db-control";

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
 * 控制平面大盘核心统计概览契约
 */
export interface ControlStats {
  readonly totalTenants: number;
  readonly activeTenants: number;
  readonly suspendedTenants: number;
  readonly failedTenants: number;
  readonly provisioningTenants: number;
}

/**
 * 开通新租户参数契约
 */
export interface ProvisionTenantInput {
  /** 租户组织全称 */
  readonly name: string;
  /** 租户组织唯一标识 (Slug) */
  readonly slug: string;
  /** 初始组织管理员邮箱 */
  readonly adminEmail: string;
  /** 初始组织管理员姓名（可选） */
  readonly adminName?: string;
  /** 物理数据库集群标识（可选，缺省 primary） */
  readonly clusterCode?: string;
  /** 初始租户管理员密码（可选，缺省自动生成 Admin123456!） */
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
  /** 生成或设置的初始管理员登录密码（供管理员展示与提供给 Owner） */
  readonly initialPassword?: string;
}
