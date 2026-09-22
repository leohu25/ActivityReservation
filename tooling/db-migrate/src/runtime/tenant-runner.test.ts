import assert from "node:assert/strict";
import test from "node:test";
import type {
  TenantDatabaseRecord,
  TenantDatabaseStatus,
  TenantMigrationRecord,
  TenantMigrationRepository,
} from "@base/db-control";
import type { SecretResolver, TenantSqlExecutor } from "@base/db-tenant";
import type { MigrationRuntimeCatalog } from "../core/types";
import { TenantMigrationRunner } from "./tenant-runner";

function createMockCatalog(): MigrationRuntimeCatalog {
  return {
    scope: "tenant",
    baseline: {
      formatVersion: 1,
      scope: "tenant",
      version: "20260901000000",
      checksum: "baseline-checksum",
      schemaChecksum: "baseline-schema-checksum",
      generatedAt: "2026-09-01T00:00:00.000Z",
      sql: "CREATE TABLE dummy;",
    },
    migrations: [
      {
        formatVersion: 1,
        scope: "tenant",
        version: "20260902100000",
        name: "add_customer_field",
        previousVersion: "20260901000000",
        checksum: "checksum-02",
        schemaChecksum: "schema-02",
        createdAt: "2026-09-02T10:00:00.000Z",
        risks: [],
        rollbackSupported: true,
        upSql: "ALTER TABLE customer ADD COLUMN phone TEXT;",
      },
      {
        formatVersion: 1,
        scope: "tenant",
        version: "20260903120000",
        name: "add_order_table",
        previousVersion: "20260902100000",
        checksum: "checksum-03",
        schemaChecksum: "schema-03",
        createdAt: "2026-09-03T12:00:00.000Z",
        risks: [],
        rollbackSupported: true,
        upSql: "CREATE TABLE customer_order (id TEXT PRIMARY KEY);",
      },
    ],
  };
}

class FakeExecutor implements TenantSqlExecutor {
  readonly executedSqls: string[] = [];

  async execute(sql: string): Promise<void> {
    this.executedSqls.push(sql);
  }

  async query<T = Record<string, unknown>>(): Promise<T[]> {
    return [];
  }

  async transaction<T>(
    callback: (tx: TenantSqlExecutor) => Promise<T>,
  ): Promise<T> {
    return callback(this);
  }

  async close(): Promise<void> {}
}

class FakeRepository implements TenantMigrationRepository {
  tenantDb: TenantDatabaseRecord = {
    id: "db-1",
    organizationId: "org-test",
    clusterCode: "default",
    databaseName: "tenant_test",
    schemaVersion: "20260901000000",
    status: "ACTIVE",
    secretRef: "env:TEST_DB_URL",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  history: TenantMigrationRecord[] = [];

  async listTenantDatabases(): Promise<TenantDatabaseRecord[]> {
    return [this.tenantDb];
  }

  async findMigrationHistory(
    organizationId: string,
  ): Promise<TenantMigrationRecord[]> {
    return this.history.filter((h) => h.organizationId === organizationId);
  }

  async findLatestSuccessfulMigration(
    organizationId: string,
  ): Promise<TenantMigrationRecord | null> {
    const success = this.history
      .filter(
        (h) => h.organizationId === organizationId && h.status === "SUCCESS",
      )
      .sort((a, b) => b.version.localeCompare(a.version));
    return success[0] ?? null;
  }

  async findLatestFailedMigration(): Promise<TenantMigrationRecord | null> {
    return null;
  }

  async recordMigrationStart(input: {
    organizationId: string;
    migrationName: string;
    version: string;
    batchId?: string;
  }): Promise<TenantMigrationRecord> {
    const record: TenantMigrationRecord = {
      id: `mig-${Date.now()}-${Math.random()}`,
      organizationId: input.organizationId,
      migrationName: input.migrationName,
      version: input.version,
      status: "RUNNING",
      batchId: input.batchId ?? null,
      appliedSteps: 0,
      executionTimeMs: null,
      errorMessage: null,
      startedAt: new Date(),
      finishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.history.push(record);
    return record;
  }

  async recordMigrationSuccess(input: {
    migrationId: string;
    organizationId: string;
    appliedSteps: number;
    executionTimeMs: number;
    schemaVersion: string;
  }): Promise<TenantMigrationRecord> {
    const record = this.history.find((h) => h.id === input.migrationId);
    if (!record) throw new Error("Record not found");
    record.status = "SUCCESS";
    record.appliedSteps = input.appliedSteps;
    record.executionTimeMs = input.executionTimeMs;
    record.finishedAt = new Date();
    this.tenantDb.schemaVersion = input.schemaVersion;
    return record;
  }

  async recordMigrationFailure(input: {
    migrationId: string;
    errorMessage: string;
    appliedSteps: number;
    executionTimeMs: number;
  }): Promise<TenantMigrationRecord> {
    const record = this.history.find((h) => h.id === input.migrationId);
    if (!record) throw new Error("Record not found");
    record.status = "FAILED";
    record.errorMessage = input.errorMessage;
    return record;
  }

  async updateTenantDatabaseStatus(
    organizationId: string,
    status: TenantDatabaseStatus,
    schemaVersion?: string,
  ): Promise<TenantDatabaseRecord> {
    if (this.tenantDb.organizationId === organizationId) {
      this.tenantDb.status = status;
      if (schemaVersion) {
        this.tenantDb.schemaVersion = schemaVersion;
      }
    }
    return this.tenantDb;
  }

  async upsertTenantDatabase(input: {
    organizationId: string;
    clusterCode: string;
    databaseName: string;
    secretRef: string;
    schemaVersion: string;
    status: TenantDatabaseStatus;
  }): Promise<TenantDatabaseRecord> {
    this.tenantDb = {
      id: "db-1",
      organizationId: input.organizationId,
      clusterCode: input.clusterCode,
      databaseName: input.databaseName,
      secretRef: input.secretRef,
      schemaVersion: input.schemaVersion,
      status: input.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.tenantDb;
  }
}

test("TenantMigrationRunner 基于账本差集正确执行增量迁移", async () => {
  const catalog = createMockCatalog();
  const repo = new FakeRepository();
  const executor = new FakeExecutor();
  const secretResolver: SecretResolver = {
    resolveDatabaseUrl: async () => "postgres://localhost/test",
  };

  const runner = new TenantMigrationRunner(
    repo,
    secretResolver,
    () => executor,
    catalog,
  );

  const preflight = await runner.preflightTenant("org-test");
  assert.equal(preflight.pendingVersions.length, 2);
  assert.deepEqual(preflight.pendingVersions, [
    "20260902100000",
    "20260903120000",
  ]);
  assert.equal(preflight.executable, true);

  const applied = await runner.migrateTenant("org-test");
  assert.deepEqual(applied, ["20260902100000", "20260903120000"]);
  assert.equal(repo.tenantDb.schemaVersion, "20260903120000");
});

test("TenantMigrationRunner 针对多人协同历史乱序迁移精准识别并安全补跑，且水位不倒退", async () => {
  const catalog = createMockCatalog();
  const repo = new FakeRepository();
  const executor = new FakeExecutor();
  const secretResolver: SecretResolver = {
    resolveDatabaseUrl: async () => "postgres://localhost/test",
  };

  // 模拟场景：本地此前已执行过 20260903120000（更高版本），但同事合入进来了 20260902100000（更早时间戳）
  repo.tenantDb.schemaVersion = "20260903120000";
  repo.history.push({
    id: "mig-03",
    organizationId: "org-test",
    migrationName: "add_order_table",
    version: "20260903120000",
    status: "SUCCESS",
    batchId: null,
    appliedSteps: 1,
    executionTimeMs: 10,
    errorMessage: null,
    startedAt: new Date(),
    finishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const runner = new TenantMigrationRunner(
    repo,
    secretResolver,
    () => executor,
    catalog,
  );

  // 1. 预检断言：差集算法必须精准揪出同事未执行的 20260902100000
  const preflight = await runner.preflightTenant("org-test");
  assert.equal(preflight.pendingVersions.length, 1);
  assert.equal(preflight.pendingVersions[0], "20260902100000");

  // 2. 乱序检测断言：识别为 OUT_OF_ORDER_MIGRATION 风险并给出友好提示
  const outOfOrderRisk = preflight.risks.find(
    (r) => r.code === "OUT_OF_ORDER_MIGRATION",
  );
  assert.ok(outOfOrderRisk, "必须识别出 OUT_OF_ORDER_MIGRATION 风险");
  assert.match(outOfOrderRisk.message, /检测到协同合入的历史乱序迁移/);
  assert.equal(
    preflight.executable,
    true,
    "乱序补丁应作为风险提示，允许用户安全补跑",
  );

  // 3. 执行升级断言：成功补跑同事的历史迁移
  const applied = await runner.migrateTenant("org-test");
  assert.deepEqual(applied, ["20260902100000"]);

  // 4. 最高水位断言：版本号必须保持为已执行过的最高水位 20260903120000，严禁倒退为 20260902100000
  assert.equal(repo.tenantDb.schemaVersion, "20260903120000");
});
