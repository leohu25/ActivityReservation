import assert from "node:assert/strict";
import test from "node:test";
import type pg from "pg";
import type { MigrationRuntimeCatalog } from "../core/types";
import {
  DatabaseInitializationError,
  PlatformMigrationRunner,
} from "./platform-runner";

const catalog: MigrationRuntimeCatalog = {
  scope: "platform",
  baseline: {
    formatVersion: 1,
    scope: "platform",
    version: "100",
    checksum: "baseline-checksum",
    schemaChecksum: "schema-checksum",
    generatedAt: "2026-01-01T00:00:00.000Z",
    sql: "BASELINE SQL",
  },
  migrations: [],
};

class FakeClient {
  readonly queries: Array<{ text: string; values?: readonly unknown[] }> = [];
  tables = new Set<string>();
  baselineRecord:
    | { version: string; migrationName: string; checksum: string }
    | undefined;
  connectError: Error | undefined;

  async connect(): Promise<void> {
    if (this.connectError) throw this.connectError;
  }
  async end(): Promise<void> {}
  async query<T = unknown>(text: string, values?: readonly unknown[]) {
    this.queries.push({ text, values });
    if (text.includes("information_schema.tables")) {
      return {
        rows: [...this.tables].map((tableName) => ({ tableName })) as T[],
      };
    }
    if (text.includes('WHERE "version" = $1')) {
      return {
        rows: (this.baselineRecord ? [this.baselineRecord] : []) as T[],
      };
    }
    if (
      text.includes('FROM "platform_migration"') &&
      text.includes("ORDER BY")
    ) {
      return {
        rows: (this.baselineRecord ? [this.baselineRecord] : []) as T[],
      };
    }
    if (text === "BASELINE SQL") {
      for (const table of [
        "account",
        "member",
        "organization",
        "session",
        "tenant_database",
        "tenant_migration",
        "user",
        "platform_migration",
      ]) {
        this.tables.add(table);
      }
    }
    if (text.includes('INSERT INTO "platform_migration"')) {
      this.baselineRecord = {
        version: String(values?.[0]),
        migrationName: "baseline",
        checksum: String(values?.[1]),
      };
    }
    return { rows: [] as T[] };
  }
}

function runner(client: FakeClient, seed = async () => {}) {
  return new PlatformMigrationRunner("postgresql://unused", catalog, {
    clientFactory: () => client as unknown as pg.Client,
    seedBootstrapAdmin: seed,
  });
}

const bootstrap = {
  email: "admin@example.com",
  name: "Admin",
  password: "strong-password",
};

test("strict empty platform database applies baseline, ledger, and seed with transaction xact lock", async () => {
  const client = new FakeClient();
  let seeded = 0;
  const result = await runner(client, async () => {
    seeded += 1;
  }).ensureInitialized(bootstrap);

  assert.equal(result.status, "INITIALIZED");
  assert.equal(result.appliedBaseline, true);
  assert.equal(seeded, 1);
  assert.equal(client.baselineRecord?.checksum, catalog.baseline.checksum);
  assert.ok(client.queries.some((query) => query.text === "BASELINE SQL"));
  assert.ok(
    client.queries.some(
      (query) => query.text === "SET LOCAL lock_timeout = '15s'",
    ),
  );
  assert.ok(
    client.queries.some((query) =>
      query.text.includes("pg_advisory_xact_lock"),
    ),
  );
});

test("cloud pre-installed extension table does not trigger partial and allows empty baseline", async () => {
  const client = new FakeClient();
  // 云数据库中可能预装了 postgis 扩展表 spatial_ref_sys
  client.tables.add("spatial_ref_sys");

  const inspection = await runner(client).inspect();
  assert.equal(inspection.state, "EMPTY");

  const result = await runner(client).ensureInitialized(bootstrap);
  assert.equal(result.status, "INITIALIZED");
  assert.ok(client.tables.has("platform_migration"));
  assert.ok(client.tables.has("user"));
});

test("ready platform database is idempotent and does not seed", async () => {
  const client = new FakeClient();
  for (const table of [
    "account",
    "member",
    "organization",
    "platform_migration",
    "session",
    "tenant_database",
    "tenant_migration",
    "user",
  ]) {
    client.tables.add(table);
  }
  client.baselineRecord = {
    version: catalog.baseline.version,
    migrationName: "baseline",
    checksum: catalog.baseline.checksum,
  };
  let seeded = 0;
  const result = await runner(client, async () => {
    seeded += 1;
  }).ensureInitialized();

  assert.equal(result.status, "READY");
  assert.equal(result.appliedBaseline, false);
  assert.equal(seeded, 0);
  assert.equal(
    client.queries.some((query) => query.text === "BASELINE SQL"),
    false,
  );
});

test("platform database connection failure is typed", async () => {
  const client = new FakeClient();
  client.connectError = new Error("connection refused");

  await assert.rejects(
    runner(client).inspect(),
    (error: unknown) =>
      error instanceof DatabaseInitializationError &&
      error.code === "DATABASE_UNREACHABLE",
  );
});

test("baseline checksum mismatch fails closed", async () => {
  const client = new FakeClient();
  for (const table of [
    "account",
    "member",
    "organization",
    "platform_migration",
    "session",
    "tenant_database",
    "tenant_migration",
    "user",
  ]) {
    client.tables.add(table);
  }
  client.baselineRecord = {
    version: catalog.baseline.version,
    migrationName: "baseline",
    checksum: "tampered",
  };

  await assert.rejects(
    runner(client).ensureInitialized(bootstrap),
    (error: unknown) =>
      error instanceof DatabaseInitializationError &&
      error.code === "BASELINE_CHECKSUM_MISMATCH",
  );
});

test("non-empty partial platform database fails closed", async () => {
  const client = new FakeClient();
  // 仅有核心表 user 但没有 platform_migration 账本，判定为 PARTIAL 并阻断
  client.tables.add("user");

  await assert.rejects(
    runner(client).ensureInitialized(bootstrap),
    (error: unknown) =>
      error instanceof DatabaseInitializationError &&
      error.code === "DATABASE_PARTIAL",
  );
  assert.equal(
    client.queries.some((query) => query.text === "BASELINE SQL"),
    false,
  );
});
