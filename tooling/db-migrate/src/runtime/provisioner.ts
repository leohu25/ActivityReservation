import type { TenantMigrationRepository } from "@base/db-control";
import type {
  TenantDatabaseSeeder,
  TenantSeedInput,
  TenantSeedResult,
  TenantSqlExecutor,
  TenantSqlExecutorFactory,
} from "@base/db-tenant";
import type {
  DatabaseInitializationInspection,
  EnsureDatabaseResult,
  MigrationRuntimeCatalog,
} from "../core/types";
import { DatabaseInitializationError } from "./platform-runner";

const TENANT_REQUIRED_TABLES = [
  "department",
  "employee_profile",
  "position",
  "purchase_order",
] as const;

export interface ProvisionTenantDatabaseInput {
  readonly organizationId: string;
  readonly clusterCode: string;
  readonly databaseName?: string;
  readonly adminDatabaseUrl: string;
  readonly secretRef: string;
  readonly seedInput?: TenantSeedInput;
  readonly tenantDatabaseUrl?: string;
}

export interface ProvisionTenantDatabaseResult {
  readonly organizationId: string;
  readonly databaseName: string;
  readonly schemaVersion: string;
  readonly status: "ACTIVE" | "FAILED";
  readonly appliedMigrationCount: number;
  readonly seedResult?: TenantSeedResult;
}

export class TenantDatabaseProvisioner {
  constructor(
    private readonly repository: TenantMigrationRepository,
    private readonly sqlExecutorFactory: TenantSqlExecutorFactory,
    private readonly catalog: MigrationRuntimeCatalog,
    private readonly seeder?: TenantDatabaseSeeder,
  ) {}

  async inspectTenantDatabase(
    tenantDatabaseUrl: string,
  ): Promise<DatabaseInitializationInspection> {
    const executor = await this.sqlExecutorFactory(tenantDatabaseUrl);
    try {
      return this.inspectWithExecutor(executor);
    } finally {
      await executor.close();
    }
  }

  async ensureTenantDatabase(
    organizationId: string,
    tenantDatabaseUrl: string,
    seedInput?: TenantSeedInput,
  ): Promise<
    EnsureDatabaseResult & { readonly seedResult?: TenantSeedResult }
  > {
    const startedAt = Date.now();
    const executor = await this.sqlExecutorFactory(tenantDatabaseUrl);
    try {
      await executor.execute("SELECT pg_advisory_lock(hashtext($1))", [
        `base-tenant-baseline:${organizationId}`,
      ]);
      try {
        const inspection = await this.inspectWithExecutor(executor);
        if (
          inspection.state === "READY" ||
          inspection.state === "UPGRADE_REQUIRED"
        ) {
          return this.toEnsureResult(inspection, false, startedAt);
        }
        if (inspection.state !== "EMPTY") {
          throw new DatabaseInitializationError(
            inspection.state === "CHECKSUM_MISMATCH"
              ? "BASELINE_CHECKSUM_MISMATCH"
              : "DATABASE_PARTIAL",
            `Tenant ${organizationId} database is non-empty but incomplete`,
          );
        }
        if (!seedInput || !this.seeder) {
          throw new DatabaseInitializationError(
            "SEED_CONFIGURATION_MISSING",
            `Tenant ${organizationId} Day 0 requires owner seed input and a seeder`,
          );
        }

        let seedResult: TenantSeedResult | undefined;
        await executor.transaction(async (transaction) => {
          await transaction.execute(this.catalog.baseline.sql);
          await this.ensureLocalLedger(transaction);
          await transaction.execute(
            `INSERT INTO "tenant_schema_migration" ("version", "checksum") VALUES ($1, $2)`,
            [this.catalog.baseline.version, this.catalog.baseline.checksum],
          );
          seedResult = await this.seeder!.seedTenant(transaction, seedInput);
        });
        const ready = await this.inspectWithExecutor(executor);
        if (ready.state !== "READY" && ready.state !== "UPGRADE_REQUIRED") {
          throw new DatabaseInitializationError(
            "BASELINE_EXECUTION_FAILED",
            `Tenant ${organizationId} baseline verification failed`,
          );
        }
        return {
          ...this.toEnsureResult(ready, true, startedAt),
          seedResult,
        };
      } finally {
        await executor.execute("SELECT pg_advisory_unlock(hashtext($1))", [
          `base-tenant-baseline:${organizationId}`,
        ]);
      }
    } finally {
      await executor.close();
    }
  }

  async provision(
    input: ProvisionTenantDatabaseInput,
  ): Promise<ProvisionTenantDatabaseResult> {
    const databaseName = this.sanitizeDatabaseName(
      input.databaseName ?? `tenant_${input.organizationId}`,
    );
    await this.createDatabaseIfMissing(input.adminDatabaseUrl, databaseName);
    await this.repository.upsertTenantDatabase({
      organizationId: input.organizationId,
      clusterCode: input.clusterCode,
      databaseName,
      secretRef: input.secretRef,
      schemaVersion: "0",
      status: "PROVISIONING",
    });

    const tenantUrl =
      input.tenantDatabaseUrl ??
      this.resolveTenantDatabaseUrl(input.adminDatabaseUrl, databaseName);
    try {
      const ensureResult = await this.ensureTenantDatabase(
        input.organizationId,
        tenantUrl,
        input.seedInput,
      );
      if (ensureResult.appliedBaseline) {
        await this.recordBaseline(input.organizationId);
      }
      await this.repository.updateTenantDatabaseStatus(
        input.organizationId,
        "ACTIVE",
        this.catalog.baseline.version,
      );
      return {
        organizationId: input.organizationId,
        databaseName,
        schemaVersion: this.catalog.baseline.version,
        status: "ACTIVE",
        appliedMigrationCount: 0,
        seedResult: ensureResult.seedResult,
      };
    } catch (error) {
      await this.repository.updateTenantDatabaseStatus(
        input.organizationId,
        "FAILED",
      );
      throw error;
    }
  }

  private async inspectWithExecutor(
    executor: TenantSqlExecutor,
  ): Promise<DatabaseInitializationInspection> {
    const rows = await executor.query<{ tableName: string }>(`
      SELECT table_name AS "tableName"
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    const present = new Set(rows.map((row) => row.tableName));
    if (present.size === 0) {
      return {
        state: "EMPTY",
        scope: "tenant",
        baselineVersion: this.catalog.baseline.version,
        currentVersion: null,
        missingTables: TENANT_REQUIRED_TABLES,
        pendingMigrations: [],
      };
    }
    const missingTables = [
      ...TENANT_REQUIRED_TABLES,
      "tenant_schema_migration",
    ].filter((table) => !present.has(table));
    if (missingTables.length > 0) {
      return {
        state: "PARTIAL",
        scope: "tenant",
        baselineVersion: this.catalog.baseline.version,
        currentVersion: null,
        missingTables,
        pendingMigrations: [],
      };
    }
    const ledger = await executor.query<{ version: string; checksum: string }>(
      `SELECT "version", "checksum" FROM "tenant_schema_migration"
       WHERE "version" = $1 LIMIT 1`,
      [this.catalog.baseline.version],
    );
    const baseline = ledger[0];
    if (!baseline) {
      return {
        state: "PARTIAL",
        scope: "tenant",
        baselineVersion: this.catalog.baseline.version,
        currentVersion: null,
        missingTables: [],
        pendingMigrations: [],
      };
    }
    if (baseline.checksum !== this.catalog.baseline.checksum) {
      return {
        state: "CHECKSUM_MISMATCH",
        scope: "tenant",
        baselineVersion: this.catalog.baseline.version,
        currentVersion: baseline.version,
        missingTables: [],
        pendingMigrations: [],
      };
    }
    const appliedVersions = new Set(
      (
        await executor.query<{ version: string }>(
          'SELECT "version" FROM "tenant_schema_migration"',
        )
      ).map((row) => row.version),
    );
    const pendingMigrations = this.catalog.migrations
      .filter((migration) => !appliedVersions.has(migration.version))
      .map((migration) => migration.version);
    return {
      state: pendingMigrations.length > 0 ? "UPGRADE_REQUIRED" : "READY",
      scope: "tenant",
      baselineVersion: this.catalog.baseline.version,
      currentVersion: baseline.version,
      missingTables: [],
      pendingMigrations,
    };
  }

  private async ensureLocalLedger(executor: TenantSqlExecutor): Promise<void> {
    await executor.execute(`
      CREATE TABLE IF NOT EXISTS "tenant_schema_migration" (
        "version" VARCHAR(30) PRIMARY KEY,
        "checksum" VARCHAR(64) NOT NULL,
        "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  private toEnsureResult(
    inspection: DatabaseInitializationInspection,
    appliedBaseline: boolean,
    startedAt: number,
  ): EnsureDatabaseResult {
    return {
      status: appliedBaseline
        ? "INITIALIZED"
        : inspection.state === "UPGRADE_REQUIRED"
          ? "UPGRADE_REQUIRED"
          : "READY",
      scope: "tenant",
      baselineVersion: inspection.baselineVersion,
      currentVersion: inspection.currentVersion,
      appliedBaseline,
      pendingMigrations: inspection.pendingMigrations,
      durationMs: Date.now() - startedAt,
    };
  }

  private async createDatabaseIfMissing(
    adminDatabaseUrl: string,
    databaseName: string,
  ): Promise<void> {
    const executor = await this.sqlExecutorFactory(adminDatabaseUrl);
    try {
      const rows = await executor.query<{ exists: number }>(
        "SELECT 1 AS exists FROM pg_database WHERE datname = $1",
        [databaseName],
      );
      if (rows.length === 0) {
        if (!/^[a-z0-9_]{1,63}$/.test(databaseName)) {
          throw new Error(`Invalid tenant database name: ${databaseName}`);
        }
        await executor.execute(
          ["CREATE", "DATABASE", `"${databaseName}"`].join(" "),
        );
      }
    } finally {
      await executor.close();
    }
  }

  private async recordBaseline(organizationId: string): Promise<void> {
    const record = await this.repository.recordMigrationStart({
      organizationId,
      migrationName: "baseline",
      version: this.catalog.baseline.version,
      batchId: `baseline_${Date.now()}`,
    });
    await this.repository.recordMigrationSuccess({
      migrationId: record.id,
      organizationId,
      appliedSteps: 1,
      executionTimeMs: 0,
      schemaVersion: this.catalog.baseline.version,
    });
  }

  private resolveTenantDatabaseUrl(
    adminUrl: string,
    databaseName: string,
  ): string {
    try {
      const url = new URL(adminUrl);
      url.pathname = `/${databaseName}`;
      return url.toString();
    } catch (error) {
      throw new Error(`Invalid tenant admin database URL: ${String(error)}`);
    }
  }

  private sanitizeDatabaseName(name: string): string {
    const sanitized = name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    return (
      sanitized.startsWith("tenant_") ? sanitized : `tenant_${sanitized}`
    ).slice(0, 63);
  }
}
