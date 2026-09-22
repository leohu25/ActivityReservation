import { randomUUID } from "node:crypto";
import type {
  TenantDatabaseRecord,
  TenantMigrationRecord,
  TenantMigrationRepository,
} from "@base/db-control";
import type {
  SecretResolver,
  TenantSqlExecutor,
  TenantSqlExecutorFactory,
} from "@base/db-tenant";
import type {
  MigrationPreflightResult,
  MigrationRisk,
  MigrationRuntimeCatalog,
  TenantFleetResult,
} from "../core/types";

export class TenantMigrationRunner {
  constructor(
    private readonly repository: TenantMigrationRepository,
    private readonly secretResolver: SecretResolver,
    private readonly sqlExecutorFactory: TenantSqlExecutorFactory,
    private readonly catalog: MigrationRuntimeCatalog,
  ) {}

  private async getDatabase(
    organizationId: string,
  ): Promise<TenantDatabaseRecord> {
    const database = await this.repository
      .listTenantDatabases()
      .then((items) =>
        items.find((item) => item.organizationId === organizationId),
      );
    if (!database)
      throw new Error(`Tenant database not found: ${organizationId}`);
    return database;
  }

  private async getExecutor(
    database: TenantDatabaseRecord,
  ): Promise<TenantSqlExecutor> {
    const databaseUrl = await this.secretResolver.resolveDatabaseUrl(
      database.secretRef,
    );
    if (!databaseUrl.trim()) {
      throw new Error(
        `Tenant database secret resolved empty: ${database.secretRef}`,
      );
    }
    return this.sqlExecutorFactory(databaseUrl);
  }

  private preflightFromHistory(
    database: TenantDatabaseRecord,
    history: readonly TenantMigrationRecord[],
  ): MigrationPreflightResult {
    const successful = new Map(
      history
        .filter((record) => record.status === "SUCCESS")
        .map((record) => [record.version, record]),
    );
    const messages: string[] = [];
    const risks: MigrationRisk[] = [];

    // 1. 基于已执行成功的账本 Set 进行差集计算（彻底解决多人协同合入较早时间戳的补丁被遗漏的问题）
    const pendingMigrations = this.catalog.migrations
      .filter((migration) => !successful.has(migration.version))
      .sort((a, b) =>
        a.version.localeCompare(b.version, undefined, { numeric: true }),
      );

    // 2. 检查待执行迁移中是否存在历史乱序合入（Out-of-Order Migration）
    for (const migration of pendingMigrations) {
      risks.push(...migration.risks);

      // 若待执行版本低于数据库已记录的水位，识别为协同合入导致的乱序历史补丁
      if (
        database.schemaVersion &&
        migration.version.localeCompare(database.schemaVersion, undefined, {
          numeric: true,
        }) < 0
      ) {
        const warningMsg = `检测到协同合入的历史乱序迁移 [${migration.version}_${migration.name}]，低于租户库当前版本水位 [${database.schemaVersion}]，将在升级中自动按序补跑。`;
        messages.push(warningMsg);
        risks.push({
          code: "OUT_OF_ORDER_MIGRATION",
          message: warningMsg,
          statement: `-- Out-of-order execution: ${migration.version}_${migration.name}`,
        });
      }
    }

    return {
      currentVersion: database.schemaVersion || null,
      targetVersion:
        this.catalog.migrations.at(-1)?.version ??
        this.catalog.baseline.version,
      pendingVersions: pendingMigrations.map((migration) => migration.version),
      risks,
      checksumValid: true,
      executable: database.status !== "SUSPENDED",
      messages,
    };
  }

  async preflightTenant(
    organizationId: string,
  ): Promise<MigrationPreflightResult> {
    const [database, history] = await Promise.all([
      this.getDatabase(organizationId),
      this.repository.findMigrationHistory(organizationId),
    ]);
    return this.preflightFromHistory(database, history);
  }

  async migrateTenant(organizationId: string): Promise<readonly string[]> {
    const database = await this.getDatabase(organizationId);
    const executor = await this.getExecutor(database);
    try {
      await executor.execute("SELECT pg_advisory_lock(hashtext($1))", [
        `base-tenant-migrate:${organizationId}`,
      ]);
      const preflight = await this.preflightTenant(organizationId);
      if (!preflight.executable) throw new Error(preflight.messages.join("; "));
      const appliedVersions: string[] = [];
      let currentWatermark = database.schemaVersion ?? "0";

      for (const version of preflight.pendingVersions) {
        const migration = this.catalog.migrations.find(
          (item) => item.version === version,
        );
        if (!migration) throw new Error(`Missing tenant migration ${version}`);
        const startedAt = Date.now();
        const record = await this.repository.recordMigrationStart({
          organizationId,
          migrationName: migration.name,
          version: migration.version,
          batchId: randomUUID(),
        });
        try {
          await executor.transaction(async (transaction) => {
            await transaction.execute(migration.upSql);
          });

          // 计算新的水位：取当前水位与新应用版本的较大者，确保版本号单调递增，不因补跑乱序补丁而倒退
          const newWatermark =
            version.localeCompare(currentWatermark, undefined, {
              numeric: true,
            }) > 0
              ? version
              : currentWatermark;

          await this.repository.recordMigrationSuccess({
            migrationId: record.id,
            organizationId,
            appliedSteps: 1,
            executionTimeMs: Date.now() - startedAt,
            schemaVersion: newWatermark,
          });
          currentWatermark = newWatermark;
          appliedVersions.push(migration.version);
        } catch (error) {
          await this.repository.recordMigrationFailure({
            migrationId: record.id,
            appliedSteps: 0,
            executionTimeMs: Date.now() - startedAt,
            errorMessage:
              error instanceof Error ? error.message : String(error),
          });
          await this.repository.updateTenantDatabaseStatus(
            organizationId,
            "FAILED",
          );
          throw error;
        }
      }
      return appliedVersions;
    } finally {
      try {
        await executor.execute("SELECT pg_advisory_unlock(hashtext($1))", [
          `base-tenant-migrate:${organizationId}`,
        ]);
      } finally {
        await executor.close();
      }
    }
  }

  async migrateFleet(
    targetOrganizationId?: string,
  ): Promise<TenantFleetResult> {
    const databases = targetOrganizationId
      ? [await this.getDatabase(targetOrganizationId)]
      : await this.repository.listTenantDatabases({ status: "ACTIVE" });
    let upgradedCount = 0;
    let failedCount = 0;
    for (const database of databases) {
      try {
        const applied = await this.migrateTenant(database.organizationId);
        if (applied.length > 0) upgradedCount++;
      } catch {
        failedCount++;
      }
    }
    return { upgradedCount, failedCount };
  }
}
