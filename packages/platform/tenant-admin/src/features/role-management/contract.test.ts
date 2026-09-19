import test from "node:test";
import assert from "node:assert/strict";
import { roleSearchParams } from "./contract";

test("contract.roleSearchParams: 解析合法分页与关键字", async () => {
  const parsed = await roleSearchParams.parse(
    Promise.resolve({
      page: "2",
      pageSize: "25",
      keyword: "admin",
    }),
  );

  assert.deepEqual(parsed, {
    page: 2,
    pageSize: 25,
    keyword: "admin",
  });
});

test("contract.roleSearchParams: 非法数值安全回退默认值", async () => {
  const parsed = await roleSearchParams.parse(
    Promise.resolve({
      page: "invalid",
      pageSize: "-10",
    }),
  );

  assert.equal(parsed.page, 1);
  assert.equal(parsed.pageSize, 10);
  assert.equal(parsed.keyword, "");
});
