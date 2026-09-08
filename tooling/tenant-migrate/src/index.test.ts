import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  loadMigrationsFromDirectory,
  generateTimestampVersion,
  generateMigrationFromSchema,
} from "./index";

const packageRoot = path.resolve(import.meta.dirname, "..");
const workspaceRoot = path.resolve(packageRoot, "../..");

test("generateTimestampVersion 生成符合 14 位自然时间戳格式的版本号", () => {
  const d = new Date("2026-09-08T15:30:45.000Z");
  const version = generateTimestampVersion(d);
  assert.equal(version.length, 14);
  assert.match(version, /^[0-9]{14}$/);
});

test("loadMigrationsFromDirectory 正确扫描并加载版本化迁移文件与校验和", () => {
  const migrationsDir = path.join(packageRoot, "migrations");
  const migrations = loadMigrationsFromDirectory(migrationsDir);

  assert.ok(migrations.length >= 1);
  const baseline = migrations.find((m) => m.name === "initial_tenant_schema");
  assert.ok(baseline);
  assert.equal(baseline.version, "202609080001");
  assert.ok(baseline.checksum && baseline.checksum.length === 64);
  assert.equal(baseline.steps.length, 1);
  assert.ok(typeof baseline.steps[0].up === "string");
  assert.match(
    baseline.steps[0].up as string,
    /CREATE TABLE IF NOT EXISTS "department"/,
  );
  assert.match(
    baseline.steps[0].up as string,
    /CREATE TABLE IF NOT EXISTS "purchase_order"/,
  );
  assert.ok(typeof baseline.steps[0].down === "string");
});

test("generateMigrationFromSchema 自动比对 Prisma 实体生成新迁移脚手架", () => {
  const tempTestDir = path.join(packageRoot, `.test_migrations_${Date.now()}`);
  fs.mkdirSync(tempTestDir, { recursive: true });

  try {
    const schemaPath = path.join(
      workspaceRoot,
      "packages/db-tenant/prisma/schema.prisma",
    );

    const result = generateMigrationFromSchema({
      name: "test_auto_gen",
      schemaPath,
      migrationsDir: tempTestDir,
    });

    assert.ok(result.version.length === 14);
    assert.ok(result.folderName.includes("test_auto_gen"));
    assert.ok(fs.existsSync(result.sqlFilePath));

    const content = fs.readFileSync(result.sqlFilePath, "utf-8");
    assert.match(content, /自动生成的租户数据库迁移/);
    assert.ok(fs.existsSync(path.join(result.folderPath, "down.sql")));
  } finally {
    fs.rmSync(tempTestDir, { recursive: true, force: true });
  }
});
