import { randomUUID } from "node:crypto";
import type {
  TenantDatabaseRecord,
  TenantMigrationRecord,
  TenantMigrationRepository,
} from "@chenrun/db-control";
import type {
  SecretResolver,
  TenantSqlExecutor,
  TenantSqlExecutorFactory,
} from "@chenrun/db-tenant";
import type {
  MigrationPreflightResult,
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
    for (const migration of this.catalog.migrations) {
      if (
        successful.has(migration.version) &&
        database.schemaVersion < migration.version
      ) {
        messages.push(
          `Tenant ${database.organizationId} ledger/version mismatch at ${migration.version}`,
        );
      }
    }
    const pending = this.catalog.migrations.filter(
      (migration) => migration.version > database.schemaVersion,
    );
    return {
      currentVersion: database.schemaVersion || null,
      targetVersion:
        this.catalog.migrations.at(-1)?.version ??
        this.catalog.baseline.version,
      pendingVersions: pending.map((migration) => migration.version),
      risks: pending.flatMap((migration) => migration.risks),
      checksumValid: messages.length === 0,
      executable: database.status !== "SUSPENDED" && messages.length === 0,
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
        `chenrun-tenant-migrate:${organizationId}`,
      ]);
      const preflight = await this.preflightTenant(organizationId);
      if (!preflight.executable) throw new Error(preflight.messages.join("; "));
      const appliedVersions: string[] = [];
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
          await this.repository.recordMigrationSuccess({
            migrationId: record.id,
            organizationId,
            appliedSteps: 1,
            executionTimeMs: Date.now() - startedAt,
            schemaVersion: migration.version,
          });
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
          `chenrun-tenant-migrate:${organizationId}`,
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
