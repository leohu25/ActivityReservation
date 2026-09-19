import test from "node:test";
import assert from "node:assert/strict";
import {
  createPositionSchema,
  updatePositionSchema,
  parseCreatePositionInput,
  parseUpdatePositionInput,
} from "./schema";

test("schema.createPositionSchema：合法输入通过解析", () => {
  const valid = {
    name: "采购专员",
    code: "pos_buyer",
    description: "负责物料采购",
    sort: 10,
  };
  const parsed = parseCreatePositionInput(valid);
  assert.equal(parsed.name, "采购专员");
  assert.equal(parsed.code, "pos_buyer");
  assert.equal(parsed.sort, 10);
});

test("schema.createPositionSchema：必填名称与编码缺失拦截", () => {
  assert.throws(
    () => parseCreatePositionInput({ name: "" }),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      return true;
    },
  );
});

test("schema.updatePositionSchema：支持部分字段与状态变更", () => {
  const parsed = parseUpdatePositionInput({
    name: "高级采购专员",
    status: "INACTIVE",
  });
  assert.equal(parsed.name, "高级采购专员");
  assert.equal(parsed.status, "INACTIVE");
});
