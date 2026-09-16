export const TenantDatabaseStatus = {
  PROVISIONING: "PROVISIONING",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  FAILED: "FAILED",
} as const;

export type TenantDatabaseStatus =
  (typeof TenantDatabaseStatus)[keyof typeof TenantDatabaseStatus];

/** 租户迁移状态枚举定义 */
export type TenantMigrationStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "ROLLED_BACK";

export interface OrganizationMemberRecord {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: Date;
}

export interface OrganizationRoleRecord {
  id: string;
  organizationId: string;
  role: string;
  permission: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface TenantDatabaseRecord {
  id: string;
  organizationId: string;
  clusterCode: string;
  databaseName: string;
  secretRef: string;
  schemaVersion: string;
  status: TenantDatabaseStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** 租户数据库迁移账本实体契约 */
export interface TenantMigrationRecord {
  id: string;
  organizationId: string;
  migrationName: string;
  version: string;
  batchId?: string | null;
  status: TenantMigrationStatus;
  appliedSteps: number;
  errorMessage?: string | null;
  executionTimeMs?: number | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** 记录迁移开始输入参数 */
export interface RecordMigrationStartInput {
  organizationId: string;
  migrationName: string;
  version: string;
  batchId?: string;
  appliedSteps?: number;
}

/** 记录迁移成功输入参数 */
export interface RecordMigrationSuccessInput {
  migrationId: string;
  organizationId: string;
  appliedSteps: number;
  executionTimeMs: number;
  schemaVersion: string;
}

/** 记录迁移失败输入参数 */
export interface RecordMigrationFailureInput {
  migrationId: string;
  errorMessage: string;
  appliedSteps: number;
  executionTimeMs: number;
}
