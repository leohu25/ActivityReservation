import type { TenantMigrationStatus } from "@base/db-control";
import type { TenantSqlExecutor } from "./sql-executor";

/**
 * 迁移步骤契约：支持原始 SQL 脚本或自定义执行回调
 */
export interface MigrationStep {
 /** 步骤名称标识 */
 readonly name: string;
 /** 升级脚本或函数 */
 readonly up: string | ((executor: TenantSqlExecutor) => Promise<void>);
 /** 可选降级回滚脚本或函数 */
 readonly down?: string | ((executor: TenantSqlExecutor) => Promise<void>);
}

/**
 * 租户迁移定义实体（类似 Alembic Revision）
 */
export interface TenantMigrationDefinition {
 /** 迁移版本号 (如 "202609080001" 或 "1.0.0") */
 readonly version: string;
 /** 迁移名称 (如 "initial_tenant_schema") */
 readonly name: string;
 /** 详细描述说明 */
 readonly description?: string;
 /** 迁移文件的 SHA-256 校验和（用于防篡改校验） */
 readonly checksum?: string;
 /** 迁移步骤集合 */
 readonly steps: readonly MigrationStep[];
}

/**
 * 单个租户迁移执行结果
 */
export interface TenantMigrationExecutionResult {
 /** 租户组织 ID */
 readonly organizationId: string;
 /** 执行的迁移版本号 */
 readonly version: string;
 /** 迁移名称 */
 readonly migrationName: string;
 /** 是否执行成功 */
 readonly success: boolean;
 /** 已成功执行的步骤数 */
 readonly appliedSteps: number;
 /** 耗时毫秒数 */
 readonly durationMs: number;
 /** 异常信息（失败时） */
 readonly errorMessage?: string;
}

/**
 * 跨租户批量迁移汇总结果
 */
export interface TenantMigrationBatchResult {
 /** 本次批量执行批次 ID */
 readonly batchId: string;
 /** 目标版本号 */
 readonly targetVersion?: string;
 /** 扫描租户总数 */
 readonly totalTenants: number;
 /** 成功升级租户数 */
 readonly successCount: number;
 /** 升级失败租户数 */
 readonly failureCount: number;
 /** 无需升级 (已是最新) 租户数 */
 readonly upToDateCount: number;
 /** 各租户详细执行记录列表 */
 readonly results: readonly TenantMigrationExecutionResult[];
}

/**
 * 租户版本状态详情报告
 */
export interface TenantMigrationStatusReport {
 /** 租户组织 ID */
 readonly organizationId: string;
 /** 物理数据库名称 */
 readonly databaseName: string;
 /** 当前生效的数据库 Schema 版本号 */
 readonly currentVersion: string;
 /** 租户物理库状态 */
 readonly databaseStatus: string;
 /** 待应用的迁移版本数 */
 readonly pendingMigrationCount: number;
 /** 待应用的迁移定义列表 */
 readonly pendingMigrations: readonly {
  readonly version: string;
  readonly name: string;
 }[];
 /** 最后一次成功迁移记录 */
 readonly latestSuccessfulVersion?: string;
 /** 最后一次失败迁移记录（若有） */
 readonly latestFailedVersion?: string;
 /** 最近的迁移账本历史列表 */
 readonly history: readonly {
  readonly id: string;
  readonly version: string;
  readonly migrationName: string;
  readonly status: TenantMigrationStatus;
  readonly executionTimeMs?: number | null;
  readonly errorMessage?: string | null;
  readonly createdAt: Date;
 }[];
}

/**
 * 版本号对比工具函数 (按自然字典序比较时间戳或版本字符串)
 * 返回值：a > b 返回正数，a < b 返回负数，相等返回 0
 */
export function compareMigrationVersions(a: string, b: string): number {
 return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}
