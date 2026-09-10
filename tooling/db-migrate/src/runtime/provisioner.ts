import type { TenantMigrationRepository } from "@chenrun/db-control";
import type {
  TenantDatabaseSeeder,
  TenantSeedInput,
  TenantSeedResult,
  TenantSqlExecutorFactory,
} from "@chenrun/db-tenant";
import type { MigrationRuntimeCatalog } from "../core/types";

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
    const executor = await this.sqlExecutorFactory(tenantUrl);
    try {
      await executor.execute("SELECT pg_advisory_lock(hashtext($1))", [
        `chenrun-tenant-provision:${input.organizationId}`,
      ]);
      await this.assertEmptyDatabase(executor, input.organizationId);
      await executor.transaction(async (transaction) => {
        await transaction.execute(this.catalog.baseline.sql);
      });
      let seedResult: TenantSeedResult | undefined;
      if (input.seedInput && this.seeder) {
        seedResult = await this.seeder.seedTenant(executor, input.seedInput);
      }
      await this.verifyProvisionedDatabase(executor, input.organizationId);
      await this.recordBaseline(input.organizationId);
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
        seedResult,
      };
    } catch (error) {
      await this.repository.updateTenantDatabaseStatus(
        input.organizationId,
        "FAILED",
      );
      throw error;
    } finally {
      try {
        await executor.execute("SELECT pg_advisory_unlock(hashtext($1))", [
          `chenrun-tenant-provision:${input.organizationId}`,
        ]);
      } finally {
        await executor.close();
      }
    }
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
        // PostgreSQL 不支持参数化 CREATE DATABASE 标识符；databaseName 已由严格白名单校验。
        await executor.execute(
          ["CREATE", "DATABASE", `"${databaseName}"`].join(" "),
        );
      }
    } finally {
      await executor.close();
    }
  }

  private async assertEmptyDatabase(
    executor: Awaited<ReturnType<TenantSqlExecutorFactory>>,
    organizationId: string,
  ): Promise<void> {
    const rows = await executor.query<{ count: string }>(`
      SELECT COUNT(*)::text AS count
      FROM information_schema.tables
      WHERE table_schema = 'public';
    `);
    if (Number(rows[0]?.count ?? 0) > 0) {
      throw new Error(
        `Tenant ${organizationId} database is not empty; failed provisioning must be cleaned before retry`,
      );
    }
  }

  private async verifyProvisionedDatabase(
    executor: Awaited<ReturnType<TenantSqlExecutorFactory>>,
    organizationId: string,
  ): Promise<void> {
    const requiredTables = ["department", "employee_profile", "purchase_order"];
    const rows = await executor.query<{ tableName: string }>(
      `SELECT table_name AS "tableName"
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
      [requiredTables],
    );
    const present = new Set(rows.map((row) => row.tableName));
    const missing = requiredTables.filter((table) => !present.has(table));
    if (missing.length > 0) {
      throw new Error(
        `Tenant ${organizationId} baseline verification failed; missing tables: ${missing.join(", ")}`,
      );
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
