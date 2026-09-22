import test from "node:test";
import assert from "node:assert/strict";
import { rewriteDropAddColumnsToRenames } from "./rename-columns";

test("同名 DROP+ADD 改写为 ALTER COLUMN SET DATA TYPE（禁止误判为 RENAME）", () => {
  const sql = `ALTER TABLE "customer" DROP COLUMN "created_by_id", ADD COLUMN "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000';`;
  const result = rewriteDropAddColumnsToRenames(sql);
  assert.match(result, /SET DATA TYPE UUID USING/);
  assert.match(result, /SET DEFAULT '00000000-0000-7000-8000-000000000000'/);
  assert.match(result, /SET NOT NULL/);
  assert.ok(!result.includes("RENAME COLUMN"));
  // 完整 UUID 正则必须保留（含结尾 $），不得被 String.replace 的 $' 模式吃掉
  assert.ok(
    result.includes("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"),
  );
});

test("可空列类型变更非法值映射为 NULL", () => {
  const sql = `ALTER TABLE "customer" DROP COLUMN "dept_id", ADD COLUMN "dept_id" UUID;`;
  const result = rewriteDropAddColumnsToRenames(sql);
  assert.match(result, /ELSE NULL/);
  assert.ok(!result.includes("SET NOT NULL"));
});

test("*_snapshot 列名仍按 RENAME 处理以保住存量数据", () => {
  const sql = `ALTER TABLE "employee_profile" DROP COLUMN "name_snapshot", ADD COLUMN "name" TEXT;`;
  const result = rewriteDropAddColumnsToRenames(sql);
  assert.match(result, /RENAME COLUMN "name_snapshot" TO "name"/);
  assert.ok(!result.includes("SET DATA TYPE"));
});

test("非 snapshot 的异名 DROP+ADD 不会被误改写为 RENAME", () => {
  const sql = `ALTER TABLE "t" DROP COLUMN "old_col", ADD COLUMN "new_col" TEXT;`;
  const result = rewriteDropAddColumnsToRenames(sql);
  assert.ok(!result.includes("RENAME COLUMN"));
  assert.match(result, /DROP COLUMN "old_col"/);
  assert.match(result, /ADD COLUMN "new_col"/);
});
