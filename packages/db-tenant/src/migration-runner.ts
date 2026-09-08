import type {
  TenantDatabaseRecord,
  TenantMigrationRecord,
  TenantMigrationRepository,
} from "@chenrun/db-control";
import type { SecretResolver } from "./index";
import type {
  TenantSqlExecutor,
  TenantSqlExecutorFactory,
} from "./sql-executor";
import {
  compareMigrationVersions,
  type TenantMigrationBatchResult,
  type TenantMigrationDefinition,
  type TenantMigrationExecutionResult,
  type TenantMigrationStatusReport,
} from "./migration-types";

/**
 * 租户迁移异常错误类
 */
export class TenantMigrationError extends Error {
  constructor(
    public readonly organizationId: string,
    public readonly version: string,
    public readonly migrationName: string,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(
      `租户 [${organizationId}] 迁移 [${version}_${migrationName}] 失败: ${message}`,
    );
    this.name = "TenantMigrationError";
  }
}

/**
 * 多租户数据库版本迁移执行引擎 (Tenant DB Migration Engine)
 * 负责在各独立租户物理库上执行幂等、可追溯、带事务保护的版本升级并更新 Control DB 账本
 */
export class TenantMigrationRunner {
  constructor(
    private readonly repository: TenantMigrationRepository,
    private readonly secretResolver: SecretResolver,
    private readonly sqlExecutorFactory: TenantSqlExecutorFactory,
    private readonly migrations: readonly TenantMigrationDefinition[],
  ) {}

  /**
   * 针对单个租户物理库执行版本升级
   */
  async migrateTenant(
    organizationId: string,
    options?: {
      readonly targetVersion?: string;
      readonly batchId?: string;
    },
  ): Promise<readonly TenantMigrationExecutionResult[]> {
    const tenantDb = await this.getTenantDatabase(organizationId);

    if (tenantDb.status === "SUSPENDED") {
      throw new Error(
        `租户 [${organizationId}] 数据库处于挂起 (SUSPENDED) 状态，禁止执行升级`,
      );
    }

    // 获取已成功执行的所有历史迁移版本集合
    const history = await this.repository.findMigrationHistory(organizationId);
    const successfulVersions = new Set(
      history
        .filter((item) => item.status === "SUCCESS")
        .map((item) => item.version),
    );

    // 筛选出尚未应用的待升级版本（按版本号升序排列）
    const sortedDefinitions = [...this.migrations].sort((a, b) =>
      compareMigrationVersions(a.version, b.version),
    );

    const pendingMigrations = sortedDefinitions.filter((def) => {
      const isApplied = successfulVersions.has(def.version);
      if (isApplied) {
        return false;
      }
      if (
        options?.targetVersion &&
        compareMigrationVersions(def.version, options.targetVersion) > 0
      ) {
        return false;
      }
      return true;
    });

    if (pendingMigrations.length === 0) {
      return [];
    }

    const databaseUrl = await this.secretResolver.resolveDatabaseUrl(
      tenantDb.secretRef,
    );
    if (!databaseUrl || databaseUrl.trim().length === 0) {
      throw new Error(
        `租户 [${organizationId}] 物理库 Secret [${tenantDb.secretRef}] 解析为空`,
      );
    }

    const executor = await this.sqlExecutorFactory(databaseUrl);
    const executionResults: TenantMigrationExecutionResult[] = [];

    try {
      for (const migration of pendingMigrations) {
        const startTime = Date.now();
        const startRecord = await this.repository.recordMigrationStart({
          organizationId,
          migrationName: migration.name,
          version: migration.version,
          batchId: options?.batchId,
          appliedSteps: 0,
        });

        let executedStepsCount = 0;

        try {
          // 在单事务中执行该版本的所有步骤
          await executor.transaction(async (tx) => {
            for (let i = 0; i < migration.steps.length; i++) {
              const step = migration.steps[i];
              if (typeof step.up === "string") {
                await tx.execute(step.up);
              } else {
                await step.up(tx);
              }
              executedStepsCount = i + 1;
            }
          });

          const durationMs = Date.now() - startTime;

          // 记录迁移成功并更新租户库版本号
          await this.repository.recordMigrationSuccess({
            migrationId: startRecord.id,
            organizationId,
            appliedSteps: executedStepsCount,
            executionTimeMs: durationMs,
            schemaVersion: migration.version,
          });

          executionResults.push({
            organizationId,
            version: migration.version,
            migrationName: migration.name,
            success: true,
            appliedSteps: executedStepsCount,
            durationMs,
          });
        } catch (stepError) {
          const durationMs = Date.now() - startTime;
          const errorMsg =
            stepError instanceof Error ? stepError.message : String(stepError);

          // 记录迁移失败详情并标记租户库为 FAILED
          await this.repository.recordMigrationFailure({
            migrationId: startRecord.id,
            errorMessage: errorMsg,
            appliedSteps: executedStepsCount,
            executionTimeMs: durationMs,
          });

          await this.repository.updateTenantDatabaseStatus(
            organizationId,
            "FAILED",
          );

          executionResults.push({
            organizationId,
            version: migration.version,
            migrationName: migration.name,
            success: false,
            appliedSteps: executedStepsCount,
            durationMs,
            errorMessage: errorMsg,
          });

          throw new TenantMigrationError(
            organizationId,
            migration.version,
            migration.name,
            errorMsg,
            stepError,
          );
        }
      }
    } finally {
      await executor.close();
    }

    return executionResults;
  }

  /**
   * 遍历所有活跃租户物理库执行批量升级
   */
  async migrateAllTenants(options?: {
    readonly targetVersion?: string;
    readonly batchId?: string;
  }): Promise<TenantMigrationBatchResult> {
    const batchId =
      options?.batchId ??
      `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const activeDatabases = await this.repository.listTenantDatabases({
      status: "ACTIVE",
    });

    const allResults: TenantMigrationExecutionResult[] = [];
    let successCount = 0;
    let failureCount = 0;
    let upToDateCount = 0;

    for (const db of activeDatabases) {
      try {
        const results = await this.migrateTenant(db.organizationId, {
          targetVersion: options?.targetVersion,
          batchId,
        });

        if (results.length === 0) {
          upToDateCount++;
        } else {
          allResults.push(...results);
          const hasFailure = results.some((r) => !r.success);
          if (hasFailure) {
            failureCount++;
          } else {
            successCount++;
          }
        }
      } catch (error) {
        failureCount++;
        if (error instanceof TenantMigrationError) {
          // 已在单租户流程中记录详细结果
        } else {
          allResults.push({
            organizationId: db.organizationId,
            version: "UNKNOWN",
            migrationName: "BATCH_MIGRATE_ERROR",
            success: false,
            appliedSteps: 0,
            durationMs: 0,
            errorMessage:
              error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    return {
      batchId,
      targetVersion: options?.targetVersion,
      totalTenants: activeDatabases.length,
      successCount,
      failureCount,
      upToDateCount,
      results: allResults,
    };
  }

  /**
   * 获取指定租户的完整版本状态与迁移历史报告
   */
  async getTenantStatus(
    organizationId: string,
  ): Promise<TenantMigrationStatusReport> {
    const tenantDb = await this.getTenantDatabase(organizationId);
    const history = await this.repository.findMigrationHistory(organizationId);
    const latestSuccessful =
      await this.repository.findLatestSuccessfulMigration(organizationId);
    const latestFailed =
      await this.repository.findLatestFailedMigration(organizationId);

    const successfulVersions = new Set(
      history
        .filter((item) => item.status === "SUCCESS")
        .map((item) => item.version),
    );

    const pendingMigrations = this.migrations
      .filter((def) => !successfulVersions.has(def.version))
      .map((def) => ({
        version: def.version,
        name: def.name,
      }));

    return {
      organizationId,
      databaseName: tenantDb.databaseName,
      currentVersion: tenantDb.schemaVersion,
      databaseStatus: tenantDb.status,
      pendingMigrationCount: pendingMigrations.length,
      pendingMigrations,
      latestSuccessfulVersion: latestSuccessful?.version,
      latestFailedVersion: latestFailed?.version,
      history: history.map((item) => ({
        id: item.id,
        version: item.version,
        migrationName: item.migrationName,
        status: item.status,
        executionTimeMs: item.executionTimeMs,
        errorMessage: item.errorMessage,
        createdAt: item.createdAt,
      })),
    };
  }

  /**
   * 重试租户最后一次失败的迁移
   */
  async retryFailedMigration(
    organizationId: string,
    options?: { readonly batchId?: string },
  ): Promise<readonly TenantMigrationExecutionResult[]> {
    const latestFailed =
      await this.repository.findLatestFailedMigration(organizationId);
    if (!latestFailed) {
      throw new Error(`租户 [${organizationId}] 没有失败的迁移记录，无需重试`);
    }

    // 重新将状态恢复为 ACTIVE 状态以允许重试
    await this.repository.updateTenantDatabaseStatus(organizationId, "ACTIVE");

    return this.migrateTenant(organizationId, {
      targetVersion: latestFailed.version,
      batchId: options?.batchId,
    });
  }

  /**
   * 对租户执行降级回滚至指定目标版本 (若各步提供了 down 回滚脚本)
   */
  async rollbackTenant(
    organizationId: string,
    targetVersion: string,
  ): Promise<readonly TenantMigrationExecutionResult[]> {
    const tenantDb = await this.getTenantDatabase(organizationId);
    const history = await this.repository.findMigrationHistory(organizationId);

    const successfulHistory = history
      .filter((item) => item.status === "SUCCESS")
      .filter(
        (item) => compareMigrationVersions(item.version, targetVersion) > 0,
      )
      .sort((a, b) => compareMigrationVersions(b.version, a.version)); // 降序回滚

    if (successfulHistory.length === 0) {
      return [];
    }

    const databaseUrl = await this.secretResolver.resolveDatabaseUrl(
      tenantDb.secretRef,
    );
    const executor = await this.sqlExecutorFactory(databaseUrl);
    const results: TenantMigrationExecutionResult[] = [];

    try {
      for (const record of successfulHistory) {
        const def = this.migrations.find((m) => m.version === record.version);
        if (!def) {
          throw new Error(
            `找不到版本 [${record.version}] 的迁移定义，无法回滚`,
          );
        }

        const startTime = Date.now();
        let executedStepsCount = 0;

        await executor.transaction(async (tx) => {
          // 逆序执行各步骤的 down 逻辑
          const reversedSteps = [...def.steps].reverse();
          for (let i = 0; i < reversedSteps.length; i++) {
            const step = reversedSteps[i];
            if (!step.down) {
              throw new Error(
                `版本 [${def.version}] 步骤 [${step.name}] 未定义 down 回滚脚本`,
              );
            }
            if (typeof step.down === "string") {
              await tx.execute(step.down);
            } else {
              await step.down(tx);
            }
            executedStepsCount = i + 1;
          }
        });

        const durationMs = Date.now() - startTime;
        results.push({
          organizationId,
          version: def.version,
          migrationName: def.name,
          success: true,
          appliedSteps: executedStepsCount,
          durationMs,
        });
      }

      // 全部降级成功后更新版本号
      await this.repository.updateTenantDatabaseStatus(
        organizationId,
        "ACTIVE",
        targetVersion,
      );
    } finally {
      await executor.close();
    }

    return results;
  }

  /**
   * 内部方法：获取合法的租户数据库映射
   */
  private async getTenantDatabase(
    organizationId: string,
  ): Promise<TenantDatabaseRecord> {
    const allDbs = await this.repository.listTenantDatabases();
    const db = allDbs.find((item) => item.organizationId === organizationId);
    if (!db) {
      throw new Error(`找不到租户 [${organizationId}] 的数据库映射配置`);
    }
    return db;
  }
}
