import path from "node:path";
import type {
  TenantFullInitializer,
  TenantSqlExecutorFactory,
} from "@chenrun/db-tenant";
import type { TenantMigrationRepository } from "@chenrun/db-control";
import { generateFullTenantDdl, findMonorepoRoot } from "./schema-scanner";
import { loadMigrationsFromDirectory } from "./loader";

/**
 * 生产级租户物理库全量初始化器 (Dynamic Full Provisioner + Baseline Alignment)
 *
 * 核心特性：
 * 1. 动态全量扫描：遍历当前 Monorepo 下所有 Feature 的 prisma/schema.prisma，一次性生成最新全量 DDL 建表
 * 2. 基线版本对齐：自动扫描迁移目录，将所有历史增量迁移版本在新库账本中标记为 SUCCESS (BASELINE)
 * 3. 一张白纸、零历史回放开荒，同时无缝具备后续增量升级与紧急回退的履历能力
 */
export class DefaultTenantFullInitializer implements TenantFullInitializer {
  constructor(
    private readonly workspaceRoot: string,
    private readonly repository: TenantMigrationRepository,
    private readonly sqlExecutorFactory: TenantSqlExecutorFactory,
    private readonly migrationsDir?: string,
  ) {}

  async initializeFullTenant(
    tenantDatabaseUrl: string,
    organizationId: string,
  ): Promise<{ appliedCount: number; latestVersion: string }> {
    // 1. 动态扫描所有 Feature Schema 并生成最新全量建表 DDL
    const ddl = generateFullTenantDdl(this.workspaceRoot);

    // 2. 连接租户物理库执行全量建表
    const tenantExecutor = await this.sqlExecutorFactory(tenantDatabaseUrl);
    try {
      await tenantExecutor.execute(ddl);
    } finally {
      await tenantExecutor.close();
    }

    // 3. 基线版本对齐 (Baseline Alignment): 扫描当前所有已存在的版本迁移补丁
    const root = findMonorepoRoot(this.workspaceRoot);
    const migrationsPath =
      this.migrationsDir ??
      path.join(root, "tooling/tenant-migrate/migrations");
    const migrations = loadMigrationsFromDirectory(migrationsPath);

    let latestVersion = "0";
    const batchId = `baseline_${Date.now()}`;

    for (const m of migrations) {
      const record = await this.repository.recordMigrationStart({
        organizationId,
        migrationName: m.name,
        version: m.version,
        batchId,
      });

      await this.repository.recordMigrationSuccess({
        migrationId: record.id,
        organizationId,
        appliedSteps: m.steps.length,
        executionTimeMs: 0,
        schemaVersion: m.version,
      });

      latestVersion = m.version;
    }

    return {
      appliedCount: migrations.length,
      latestVersion,
    };
  }
}
