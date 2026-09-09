import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadPlatformMigrationsFromDirectory } from "./loader";

test("loadPlatformMigrationsFromDirectory 能够正确扫描并加载平台迁移脚本", () => {
  const migrationsDir = path.join(import.meta.dirname, "../migrations");
  const migrations = loadPlatformMigrationsFromDirectory(migrationsDir);

  assert.ok(migrations.length >= 1);
  const baseline = migrations[0];
  assert.equal(baseline.version, "202609100001");
  assert.equal(baseline.name, "initial_platform_schema");
  assert.ok(baseline.upSql.includes('CREATE TABLE IF NOT EXISTS "user"'));
  assert.ok(baseline.checksum && baseline.checksum.length === 64);
  assert.ok(
    baseline.downSql &&
      baseline.downSql.includes('DROP TABLE IF EXISTS "user"'),
  );
});
