import test from "node:test";
import assert from "node:assert/strict";
import { positionSearchParams } from "./contract";

test("contract.positionSearchParams：默认字段 + 业务扩展", async () => {
  const parsed = await positionSearchParams.parse(
    Promise.resolve({
      page: "2",
      pageSize: "20",
      keyword: "经理",
      status: "ACTIVE",
    }),
  );
  assert.deepEqual(parsed, {
    page: 2,
    pageSize: 20,
    keyword: "经理",
    status: "ACTIVE",
  });
});

test("positionSearchParams：非法 page/pageSize 回落默认值", async () => {
  const parsed = await positionSearchParams.parse(
    Promise.resolve({ page: "bad", pageSize: "-1" }),
  );
  assert.equal(parsed.page, 1);
  assert.equal(parsed.pageSize, 10);
  assert.equal(parsed.keyword, "");
  assert.equal(parsed.status, "");
});
