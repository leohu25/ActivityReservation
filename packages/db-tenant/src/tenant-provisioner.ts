import type {
  TenantDatabaseRecord,
  TenantMigrationRepository,
} from "@chenrun/db-control";
import type { TenantSqlExecutorFactory } from "./sql-executor";
import type { TenantMigrationRunner } from "./migration-runner";

/**
 * 租户物理库开通参数契约
 */
export interface ProvisionTenantDatabaseInput {
  /** 租户组织 ID */
  readonly organizationId: string;
  /** 集群标识编码 (如 cluster_primary) */
  readonly clusterCode: string;
  /** 期望的数据库名称（可选，缺省由 organizationId 自动规范化生成） */
  readonly databaseName?: string;
  /** 具有创建数据库权限的 PostgreSQL 服务端管理员连接串 */
  readonly adminDatabaseUrl: string;
  /** 用于向应用层提供连接的 Secret 引用标识 */
  readonly secretRef: string;
  /** 开通完成后待应用的基线版本目标（可选） */
  readonly targetVersion?: string;
}

/**
 * 租户物理库开通结果契约
 */
export interface ProvisionTenantDatabaseResult {
  /** 租户组织 ID */
  readonly organizationId: string;
  /** 最终分配的物理数据库名称 */
  readonly databaseName: string;
  /** 当前数据库结构生效版本 */
  readonly schemaVersion: string;
  /** 租户库最终状态 */
  readonly status: "ACTIVE" | "PROVISIONING" | "FAILED";
  /** 初始化迁移应用的步骤总数 */
  readonly appliedMigrationCount: number;
}

/**
 * 租户物理数据库自动化开通引擎 (Tenant DB Provisioner)
 * 实现独立数据库物理创建（CREATE DATABASE tenant_xxx）与基线结构初始化
 */
export class TenantProvisioner {
  constructor(
    private readonly repository: TenantMigrationRepository,
    private readonly sqlExecutorFactory: TenantSqlExecutorFactory,
    private readonly migrationRunner: TenantMigrationRunner,
  ) {}

  /**
   * 为指定租户自动化开通独立的 PostgreSQL 物理数据库并应用初始化迁移
   */
  async provisionTenantDatabase(
    input: ProvisionTenantDatabaseInput,
  ): Promise<ProvisionTenantDatabaseResult> {
    const safeDbName = this.sanitizeDatabaseName(
      input.databaseName ?? `tenant_${input.organizationId}`,
    );

    // 1. 连接至管理库 (具有 CREATEDB 权限的连接)
    const adminExecutor = await this.sqlExecutorFactory(input.adminDatabaseUrl);

    try {
      // 2. 检查数据库是否已存在，不存在则执行创建
      const existing = await adminExecutor.query<{ exists: boolean }>(
        "SELECT 1 as exists FROM pg_database WHERE datname = $1",
        [safeDbName],
      );

      if (existing.length === 0) {
        // 严格校验数据库标识符，确保仅包含小写字母、数字和下划线
        if (!/^[a-z0-9_]{1,63}$/.test(safeDbName)) {
          throw new Error(`非法数据库名称: ${safeDbName}`);
        }
        // PostgreSQL DDL 不支持标识符参数化，使用清洗合规后的安全标识符
        const createDbSql = ["CREATE", "DATABASE", `"${safeDbName}"`].join(" ");
        await adminExecutor.execute(createDbSql);
      }
    } finally {
      await adminExecutor.close();
    }

    // 3. 在 Control DB 中登记/初始化租户库记录，初始状态为 PROVISIONING
    const initialRecord: TenantDatabaseRecord =
      await this.repository.upsertTenantDatabase({
        organizationId: input.organizationId,
        clusterCode: input.clusterCode,
        databaseName: safeDbName,
        secretRef: input.secretRef,
        schemaVersion: "0",
        status: "PROVISIONING",
      });

    // 4. 调用迁移引擎执行初始化基线迁移
    let appliedCount = 0;
    try {
      const migrationResults = await this.migrationRunner.migrateTenant(
        input.organizationId,
        {
          targetVersion: input.targetVersion,
        },
      );
      appliedCount = migrationResults.length;

      // 5. 迁移成功后更新租户库状态为 ACTIVE
      const latestSuccess = await this.repository.findLatestSuccessfulMigration(
        input.organizationId,
      );

      const finalVersion =
        latestSuccess?.version ?? initialRecord.schemaVersion;
      await this.repository.updateTenantDatabaseStatus(
        input.organizationId,
        "ACTIVE",
        finalVersion,
      );

      return {
        organizationId: input.organizationId,
        databaseName: safeDbName,
        schemaVersion: finalVersion,
        status: "ACTIVE",
        appliedMigrationCount: appliedCount,
      };
    } catch (migrationError) {
      // 迁移失败则将租户物理库标记为 FAILED
      await this.repository.updateTenantDatabaseStatus(
        input.organizationId,
        "FAILED",
      );
      throw migrationError;
    }
  }

  /**
   * 安全清洗数据库名称（严格限定小写英文字母、数字与下划线，防止 SQL 注入）
   */
  private sanitizeDatabaseName(name: string): string {
    const clean = name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!clean.startsWith("tenant_")) {
      return `tenant_${clean}`.slice(0, 63);
    }
    return clean.slice(0, 63);
  }
}
