import assert from "node:assert/strict";
import test from "node:test";
import type {
  TenantDatabaseRecord,
  TenantMigrationRecord,
  TenantMigrationRepository,
  RecordMigrationStartInput,
  RecordMigrationSuccessInput,
  RecordMigrationFailureInput,
} from "@chenrun/db-control";
import {
  TenantMigrationRunner,
  TenantMigrationError,
  TenantProvisioner,
  compareMigrationVersions,
  type TenantMigrationDefinition,
  type TenantSqlExecutor,
} from "../index";

const testTime = new Date("2026-09-08T12:00:00.000Z");

// 模拟的内存版迁移仓储
class MockMigrationRepository implements TenantMigrationRepository {
  public dbs = new Map<string, TenantDatabaseRecord>();
  public migrations: TenantMigrationRecord[] = [];
  private idCounter = 1;

  async recordMigrationStart(
    input: RecordMigrationStartInput,
  ): Promise<TenantMigrationRecord> {
    const rec: TenantMigrationRecord = {
      id: `mig-${this.idCounter++}`,
      organizationId: input.organizationId,
      migrationName: input.migrationName,
      version: input.version,
      batchId: input.batchId ?? null,
      status: "RUNNING",
      appliedSteps: input.appliedSteps ?? 0,
      errorMessage: null,
      executionTimeMs: null,
      startedAt: new Date(),
      finishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.migrations.push(rec);
    return rec;
  }

  async recordMigrationSuccess(
    input: RecordMigrationSuccessInput,
  ): Promise<TenantMigrationRecord> {
    const item = this.migrations.find((m) => m.id === input.migrationId);
    if (!item) {
      throw new Error(`Migration ${input.migrationId} not found`);
    }
    item.status = "SUCCESS";
    item.appliedSteps = input.appliedSteps;
    item.executionTimeMs = input.executionTimeMs;
    item.finishedAt = new Date();

    const db = this.dbs.get(input.organizationId);
    if (db) {
      db.schemaVersion = input.schemaVersion;
      db.status = "ACTIVE";
    }
    return item;
  }

  async recordMigrationFailure(
    input: RecordMigrationFailureInput,
  ): Promise<TenantMigrationRecord> {
    const item = this.migrations.find((m) => m.id === input.migrationId);
    if (!item) {
      throw new Error(`Migration ${input.migrationId} not found`);
    }
    item.status = "FAILED";
    item.errorMessage = input.errorMessage;
    item.appliedSteps = input.appliedSteps;
    item.executionTimeMs = input.executionTimeMs;
    item.finishedAt = new Date();
    return item;
  }

  async findMigrationHistory(
    organizationId: string,
  ): Promise<TenantMigrationRecord[]> {
    return this.migrations.filter((m) => m.organizationId === organizationId);
  }

  async findLatestSuccessfulMigration(
    organizationId: string,
  ): Promise<TenantMigrationRecord | null> {
    const list = this.migrations
      .filter(
        (m) => m.organizationId === organizationId && m.status === "SUCCESS",
      )
      .sort(
        (a, b) =>
          compareMigrationVersions(b.version, a.version) ||
          b.createdAt.getTime() - a.createdAt.getTime(),
      );
    return list[0] ?? null;
  }

  async findLatestFailedMigration(
    organizationId: string,
  ): Promise<TenantMigrationRecord | null> {
    const list = this.migrations
      .filter(
        (m) => m.organizationId === organizationId && m.status === "FAILED",
      )
      .sort(
        (a, b) =>
          compareMigrationVersions(b.version, a.version) ||
          b.createdAt.getTime() - a.createdAt.getTime(),
      );
    return list[0] ?? null;
  }

  async listTenantDatabases(filter?: {
    status?: TenantDatabaseRecord["status"];
  }): Promise<TenantDatabaseRecord[]> {
    const all = Array.from(this.dbs.values());
    if (filter?.status) {
      return all.filter((d) => d.status === filter.status);
    }
    return all;
  }

  async upsertTenantDatabase(input: {
    organizationId: string;
    clusterCode: string;
    databaseName: string;
    secretRef: string;
    schemaVersion: string;
    status: TenantDatabaseRecord["status"];
  }): Promise<TenantDatabaseRecord> {
    const existing = this.dbs.get(input.organizationId);
    if (existing) {
      existing.clusterCode = input.clusterCode;
      existing.databaseName = input.databaseName;
      existing.secretRef = input.secretRef;
      existing.schemaVersion = input.schemaVersion;
      existing.status = input.status;
      return existing;
    }
    const newDb: TenantDatabaseRecord = {
      id: `db-${input.organizationId}`,
      organizationId: input.organizationId,
      clusterCode: input.clusterCode,
      databaseName: input.databaseName,
      secretRef: input.secretRef,
      schemaVersion: input.schemaVersion,
      status: input.status,
      createdAt: testTime,
      updatedAt: testTime,
    };
    this.dbs.set(input.organizationId, newDb);
    return newDb;
  }

  async updateTenantDatabaseStatus(
    organizationId: string,
    status: TenantDatabaseRecord["status"],
    schemaVersion?: string,
  ): Promise<TenantDatabaseRecord> {
    const db = this.dbs.get(organizationId);
    if (!db) {
      throw new Error(`Db for org ${organizationId} not found`);
    }
    db.status = status;
    if (schemaVersion !== undefined) {
      db.schemaVersion = schemaVersion;
    }
    return db;
  }
}

// 模拟的内存版 SQL 执行器
class MockSqlExecutor implements TenantSqlExecutor {
  public executedSqls: string[] = [];
  public closed = false;

  async execute(sql: string): Promise<void> {
    this.executedSqls.push(sql);
  }

  async query<T = Record<string, unknown>>(sql: string): Promise<T[]> {
    this.executedSqls.push(`QUERY: ${sql}`);
    return [] as T[];
  }

  async transaction<T>(
    callback: (tx: TenantSqlExecutor) => Promise<T>,
  ): Promise<T> {
    this.executedSqls.push("BEGIN");
    try {
      const res = await callback(this);
      this.executedSqls.push("COMMIT");
      return res;
    } catch (e) {
      this.executedSqls.push("ROLLBACK");
      throw e;
    }
  }

  async close(): Promise<void> {
    this.closed = true;
  }
}

test("compareMigrationVersions 支持语义化与时间戳版本正确排序", () => {
  assert.equal(
    compareMigrationVersions("202609080001", "202609080002") < 0,
    true,
  );
  assert.equal(
    compareMigrationVersions("202609080002", "202609080001") > 0,
    true,
  );
  assert.equal(compareMigrationVersions("202609080001", "202609080001"), 0);
  assert.equal(compareMigrationVersions("1.0.0", "1.1.0") < 0, true);
});

test("TenantMigrationRunner 针对单租户正确按序执行升级并更新账本", async () => {
  const repo = new MockMigrationRepository();
  repo.dbs.set("org-alpha", {
    id: "db-alpha",
    organizationId: "org-alpha",
    clusterCode: "cluster-primary",
    databaseName: "tenant_alpha",
    secretRef: "secret-alpha",
    schemaVersion: "0",
    status: "ACTIVE",
    createdAt: testTime,
    updatedAt: testTime,
  });

  const executor = new MockSqlExecutor();
  const secretResolver = {
    async resolveDatabaseUrl(secretRef: string) {
      return `postgres://mock-tenant/${secretRef}`;
    },
  };

  const migrations: TenantMigrationDefinition[] = [
    {
      version: "202609080001",
      name: "initial_schema",
      steps: [
        {
          name: "create_department",
          up: "CREATE TABLE department (id TEXT PRIMARY KEY);",
          down: "DROP TABLE department;",
        },
      ],
    },
    {
      version: "202609080002",
      name: "add_purchase_order",
      steps: [
        {
          name: "create_purchase_order",
          up: "CREATE TABLE purchase_order (id TEXT PRIMARY KEY);",
          down: "DROP TABLE purchase_order;",
        },
      ],
    },
  ];

  const runner = new TenantMigrationRunner(
    repo,
    secretResolver,
    () => executor,
    migrations,
  );

  // 1. 首次升级：应执行 2 个版本的迁移
  const results = await runner.migrateTenant("org-alpha");
  assert.equal(results.length, 2);
  assert.equal(results[0].version, "202609080001");
  assert.equal(results[0].success, true);
  assert.equal(results[1].version, "202609080002");
  assert.equal(results[1].success, true);

  // 验证 Control DB 租户库状态被同步更新为最新版本
  const updatedDb = repo.dbs.get("org-alpha");
  assert.equal(updatedDb?.schemaVersion, "202609080002");
  assert.equal(updatedDb?.status, "ACTIVE");

  // 2. 幂等性测试：再次执行升级，应检测到已是最新，返回空数组且无重复 SQL
  const secondRun = await runner.migrateTenant("org-alpha");
  assert.equal(secondRun.length, 0);

  // 3. 查看状态报告
  const statusReport = await runner.getTenantStatus("org-alpha");
  assert.equal(statusReport.currentVersion, "202609080002");
  assert.equal(statusReport.pendingMigrationCount, 0);
  assert.equal(statusReport.latestSuccessfulVersion, "202609080002");
  assert.equal(statusReport.history.length, 2);
});

test("TenantMigrationRunner 执行失败时阻断后续并标记 FAILED，且支持修复后重试", async () => {
  const repo = new MockMigrationRepository();
  repo.dbs.set("org-beta", {
    id: "db-beta",
    organizationId: "org-beta",
    clusterCode: "cluster-primary",
    databaseName: "tenant_beta",
    secretRef: "secret-beta",
    schemaVersion: "0",
    status: "ACTIVE",
    createdAt: testTime,
    updatedAt: testTime,
  });

  const executor = new MockSqlExecutor();
  const secretResolver = {
    async resolveDatabaseUrl() {
      return "postgres://mock-tenant";
    },
  };

  let shouldFail = true;
  const migrations: TenantMigrationDefinition[] = [
    {
      version: "202609080001",
      name: "flaky_migration",
      steps: [
        {
          name: "step_one",
          up: async () => {
            if (shouldFail) {
              throw new Error("模拟物理库语法错误");
            }
          },
        },
      ],
    },
  ];

  const runner = new TenantMigrationRunner(
    repo,
    secretResolver,
    () => executor,
    migrations,
  );

  // 首次执行：预期抛出 TenantMigrationError
  await assert.rejects(
    async () => {
      await runner.migrateTenant("org-beta");
    },
    (err: unknown) => {
      if (err instanceof TenantMigrationError) {
        assert.equal(err.version, "202609080001");
        return true;
      }
      return false;
    },
  );

  // 验证失败记录与租户库状态被标记为 FAILED
  const failedDb = repo.dbs.get("org-beta");
  assert.equal(failedDb?.status, "FAILED");
  const failedMigration = await repo.findLatestFailedMigration("org-beta");
  assert.ok(failedMigration);
  assert.equal(failedMigration.status, "FAILED");
  assert.match(failedMigration.errorMessage ?? "", /模拟物理库语法错误/);

  // 修复问题后执行 retryFailedMigration
  shouldFail = false;
  const retryResults = await runner.retryFailedMigration("org-beta");
  assert.equal(retryResults.length, 1);
  assert.equal(retryResults[0].success, true);
  assert.equal(failedDb?.status, "ACTIVE");
});

test("TenantMigrationRunner 支持批量迁移所有活跃租户", async () => {
  const repo = new MockMigrationRepository();
  repo.dbs.set("org-1", {
    id: "db-1",
    organizationId: "org-1",
    clusterCode: "cluster-primary",
    databaseName: "tenant_1",
    secretRef: "secret-1",
    schemaVersion: "0",
    status: "ACTIVE",
    createdAt: testTime,
    updatedAt: testTime,
  });
  repo.dbs.set("org-2", {
    id: "db-2",
    organizationId: "org-2",
    clusterCode: "cluster-primary",
    databaseName: "tenant_2",
    secretRef: "secret-2",
    schemaVersion: "0",
    status: "ACTIVE",
    createdAt: testTime,
    updatedAt: testTime,
  });

  const runner = new TenantMigrationRunner(
    repo,
    {
      async resolveDatabaseUrl() {
        return "postgres://mock";
      },
    },
    () => new MockSqlExecutor(),
    [
      {
        version: "202609080001",
        name: "test_migration",
        steps: [{ name: "s1", up: "SELECT 1" }],
      },
    ],
  );

  const batchSummary = await runner.migrateAllTenants();
  assert.equal(batchSummary.totalTenants, 2);
  assert.equal(batchSummary.successCount, 2);
  assert.equal(batchSummary.failureCount, 0);
  assert.ok(batchSummary.batchId.startsWith("batch_"));
});

test("TenantProvisioner 自动化开通独立物理数据库并执行基线初始化", async () => {
  const repo = new MockMigrationRepository();
  const adminExecutor = new MockSqlExecutor();
  const tenantExecutor = new MockSqlExecutor();

  const secretResolver = {
    async resolveDatabaseUrl() {
      return "postgres://mock-tenant";
    },
  };

  const migrations: TenantMigrationDefinition[] = [
    {
      version: "202609080001",
      name: "baseline",
      steps: [{ name: "init", up: "CREATE TABLE initial (id TEXT);" }],
    },
  ];

  const runner = new TenantMigrationRunner(
    repo,
    secretResolver,
    () => tenantExecutor,
    migrations,
  );

  const provisioner = new TenantProvisioner(repo, () => adminExecutor, runner);

  const result = await provisioner.provisionTenantDatabase({
    organizationId: "company_xyz",
    clusterCode: "cluster-primary",
    adminDatabaseUrl: "postgres://admin@localhost/postgres",
    secretRef: "secret/company_xyz",
  });

  assert.equal(result.organizationId, "company_xyz");
  assert.equal(result.databaseName, "tenant_company_xyz");
  assert.equal(result.status, "ACTIVE");
  assert.equal(result.schemaVersion, "202609080001");
  assert.equal(result.appliedMigrationCount, 1);

  // 验证 CREATE DATABASE 物理指令已在管理库执行
  assert.ok(
    adminExecutor.executedSqls.some((sql) =>
      sql.includes('CREATE DATABASE "tenant_company_xyz"'),
    ),
  );
});
