import test from "node:test";
import assert from "node:assert/strict";
import { customerSearchParams } from "./contract";

test("contract.customerSearchParams：默认字段 + 业务扩展", async () => {
  const parsed = await customerSearchParams.parse(
    Promise.resolve({
      page: "2",
      pageSize: "20",
      keyword: "绿叶",
      category: "CAT-01",
      status: "ACTIVE",
    }),
  );
  assert.deepEqual(parsed, {
    page: 2,
    pageSize: 20,
    keyword: "绿叶",
    category: "CAT-01",
    status: "ACTIVE",
  });
});

test("非法 page/pageSize 回落默认值", async () => {
  const parsed = await customerSearchParams.parse(
    Promise.resolve({ page: "abc", pageSize: "-1" }),
  );
  assert.equal(parsed.page, 1);
  assert.equal(parsed.pageSize, 10);
  assert.equal(parsed.keyword, "");
});
