import test from "node:test";
import assert from "node:assert/strict";
import { employeeSearchParams } from "./contract";

test("employeeSearchParams: 解析合法查询参数", async () => {
  const parsed = await employeeSearchParams.parse(
    Promise.resolve({
      page: "2",
      pageSize: "25",
      keyword: "张三",
      departmentId: "dept-1",
      includeChildren: "false",
      positionId: "pos-1",
      role: "admin",
      status: "ACTIVE",
    }),
  );

  assert.deepEqual(parsed, {
    page: 2,
    pageSize: 25,
    keyword: "张三",
    departmentId: "dept-1",
    includeChildren: "false",
    positionId: "pos-1",
    role: "admin",
    status: "ACTIVE",
  });
});

test("employeeSearchParams: 非法数值回退默认值", async () => {
  const parsed = await employeeSearchParams.parse(
    Promise.resolve({
      page: "-1",
      pageSize: "bad",
    }),
  );

  assert.equal(parsed.page, 1);
  assert.equal(parsed.pageSize, 10);
  assert.equal(parsed.includeChildren, "true");
});
