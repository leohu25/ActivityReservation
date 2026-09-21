import test from "node:test";
import assert from "node:assert/strict";
import { inspectMigrationSafety } from "./check-migration-safety.mjs";

test("check-migration-safety: 拦截向已有表追加无默认值的 NOT NULL 字段", () => {
	const unsafeSql = `
		-- AlterTable
		ALTER TABLE "customer_tag" DROP COLUMN "tag_type",
		ADD COLUMN "tag_type_id" VARCHAR(60) NOT NULL;
	`;

	const result = inspectMigrationSafety(unsafeSql);
	assert.equal(result.safe, false);
	assert.equal(result.violations.length, 1);
	assert.match(result.violations[0].statement, /ADD COLUMN "tag_type_id"/);
	assert.match(result.violations[0].reason, /contains null values/);
});

test("check-migration-safety: 放行允许为可空的追加字段（标准安全模式）", () => {
	const safeNullableSql = `
		-- AlterTable
		ALTER TABLE "customer_tag" DROP COLUMN "tag_type",
		ADD COLUMN "tag_type_id" VARCHAR(60);
		CREATE INDEX "customer_tag_tag_type_id_idx" ON "customer_tag"("tag_type_id");
	`;

	const result = inspectMigrationSafety(safeNullableSql);
	assert.equal(result.safe, true);
	assert.equal(result.violations.length, 0);
});

test("check-migration-safety: 放行带有 DEFAULT 默认值的必填字段", () => {
	const safeDefaultSql = `
		-- AlterTable
		ALTER TABLE "system_setting" ADD COLUMN "theme" VARCHAR(20) NOT NULL DEFAULT 'DARK';
	`;

	const result = inspectMigrationSafety(safeDefaultSql);
	assert.equal(result.safe, true);
	assert.equal(result.violations.length, 0);
});

test("check-migration-safety: 放行新建表全量建表语句（CREATE TABLE 中的 NOT NULL）", () => {
	const createTableSql = `
		CREATE TABLE "tenant_dict_item" (
			"id" VARCHAR(60) NOT NULL,
			"type" VARCHAR(50) NOT NULL,
			"code" VARCHAR(50) NOT NULL,
			"name" VARCHAR(100) NOT NULL,
			"status" VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
			PRIMARY KEY ("id")
		);
	`;

	const result = inspectMigrationSafety(createTableSql);
	assert.equal(result.safe, true);
	assert.equal(result.violations.length, 0);
});
