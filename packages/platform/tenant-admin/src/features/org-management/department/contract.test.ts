import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DepartmentSubject,
  DepartmentResource,
  departmentPageContract,
  departmentSearchParams,
} from "./contract";

describe("department.contract", () => {
  it("导出的常量与 Subject/Resource 符合约定", () => {
    assert.equal(DepartmentSubject, "Department");
    assert.equal(DepartmentResource, "organization.department");
  });

  it("departmentSearchParams 默认值解析正确", async () => {
    const parsed = await departmentSearchParams.parse(Promise.resolve({}));
    assert.equal(parsed.page, 1);
    assert.equal(parsed.pageSize, 10);
    assert.equal(parsed.keyword, "");
    assert.equal(parsed.departmentId, "");
  });

  it("departmentPageContract 动作与字段齐备", () => {
    assert.equal(departmentPageContract.subject, DepartmentSubject);
    const actionNames = departmentPageContract.actions.map((a) => a.action);
    assert.ok(actionNames.includes("read"));
    assert.ok(actionNames.includes("create"));
    assert.ok(actionNames.includes("update"));
    assert.ok(actionNames.includes("delete"));
  });
});
