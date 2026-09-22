import assert from "node:assert/strict";
import test from "node:test";
import type { TenantMigrationRepository } from "@base/db-control";
import type { TenantDatabaseSeeder, TenantSqlExecutor } from "@base/db-tenant";
import type { MigrationRuntimeCatalog } from "../core/types";
import { DatabaseInitializationError } from "./platform-runner";
import { TenantDatabaseProvisioner } from "./provisioner";

const catalog: MigrationRuntimeCatalog = {
  scope: "tenant",
  baseline: {
    formatVersion: 1,
    scope: "tenant",
    version: "200",
    checksum: "tenant-checksum",
    schemaChecksum: "tenant-schema",
    generatedAt: "2026-01-01T00:00:00.000Z",
    sql: "TENANT BASELINE",
  },
  migrations: [],
};

class FakeExecutor implements TenantSqlExecutor {
  tables = new Set<string>();
  ledger: { version: string; checksum: string } | undefined;
  baselineRuns = 0;

  async execute(sql: string, params?: readonly unknown[]): Promise<void> {
    if (sql === "TENANT BASELINE") {
      this.baselineRuns += 1;
      for (const table of [
        "company_profile",
        "department",
        "employee_profile",
        "position",
      ]) {
        this.tables.add(table);
      }
    }
    if (sql.includes('CREATE TABLE IF NOT EXISTS "tenant_schema_migration"')) {
      this.tables.add("tenant_schema_migration");
    }
    if (sql.includes('INSERT INTO "tenant_schema_migration"')) {
      this.ledger = {
        version: String(params?.[0]),
        checksum: String(params?.[1]),
      };
    }
  }

  async query<T = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<T[]> {
    if (sql.includes("information_schema.tables")) {
      return [...this.tables].map((tableName) => ({ tableName })) as T[];
    }
    if (
      sql.includes('FROM "tenant_schema_migration"') &&
      sql.includes('WHERE "version" = $1')
    ) {
      return this.ledger && this.ledger.version === String(params?.[0])
        ? ([this.ledger] as T[])
        : [];
    }
    if (sql.includes('FROM "tenant_schema_migration"')) {
      return (this.ledger ? [{ version: this.ledger.version }] : []) as T[];
    }
    return [];
  }

  async transaction<T>(
    callback: (tx: TenantSqlExecutor) => Promise<T>,
  ): Promise<T> {
    return callback(this);
  }
  async close(): Promise<void> {}
}

const repository = {} as TenantMigrationRepository;
const seedInput = {
  organizationId: "org1",
  organizationName: "Org One",
  ownerUserId: "user1",
  ownerMemberId: "member1",
  ownerName: "Owner",
  ownerEmail: "owner@example.com",
};

function provisioner(executor: FakeExecutor, seed: () => void) {
  const seeder = {
    async seedTenant() {
      seed();
      return {
        rootDepartmentId: "root",
        seededPositionsCount: 3,
        ownerEmployeeProfileId: "employee",
      };
    },
  } as unknown as TenantDatabaseSeeder;
  return new TenantDatabaseProvisioner(
    repository,
    () => executor,
    catalog,
    seeder,
  );
}

test("tenant strict empty ensure applies baseline and seed idempotently", async () => {
  const executor = new FakeExecutor();
  let seeds = 0;
  const target = provisioner(executor, () => {
    seeds += 1;
  });

  const first = await target.ensureTenantDatabase("org1", "unused", seedInput);
  const second = await target.ensureTenantDatabase("org1", "unused", seedInput);

  assert.equal(first.status, "INITIALIZED");
  assert.equal(second.status, "READY");
  assert.equal(executor.baselineRuns, 1);
  assert.equal(seeds, 1);
});

test("tenant baseline checksum mismatch fails closed", async () => {
  const executor = new FakeExecutor();
  for (const table of [
    "company_profile",
    "department",
    "employee_profile",
    "position",
    "tenant_schema_migration",
  ]) {
    executor.tables.add(table);
  }
  executor.ledger = { version: catalog.baseline.version, checksum: "tampered" };
  const target = provisioner(executor, () => {});

  await assert.rejects(
    target.ensureTenantDatabase("org1", "unused", seedInput),
    (error: unknown) =>
      error instanceof DatabaseInitializationError &&
      error.code === "BASELINE_CHECKSUM_MISMATCH",
  );
  assert.equal(executor.baselineRuns, 0);
});

test("tenant non-empty partial database fails closed", async () => {
  const executor = new FakeExecutor();
  executor.tables.add("department");
  const target = provisioner(executor, () => {});

  await assert.rejects(
    target.ensureTenantDatabase("org1", "unused", seedInput),
    (error: unknown) =>
      error instanceof DatabaseInitializationError &&
      error.code === "DATABASE_PARTIAL",
  );
  assert.equal(executor.baselineRuns, 0);
});
