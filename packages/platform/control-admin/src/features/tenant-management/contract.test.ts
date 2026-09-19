import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  TenantManagementSubject,
  TenantManagementResource,
  tenantManagementPageContract,
  tenantSearchParams,
} from "./contract";

describe("tenant-management.contract", () => {
  it("Subject 与 Resource 定义符合约定", () => {
    assert.equal(TenantManagementSubject, "ControlTenant");
    assert.equal(TenantManagementResource, "control.tenant");
  });

  it("tenantSearchParams 默认值正确解析", async () => {
    const parsed = await tenantSearchParams.parse(Promise.resolve({}));
    assert.equal(parsed.page, 1);
    assert.equal(parsed.pageSize, 10);
    assert.equal(parsed.keyword, "");
    assert.equal(parsed.status, "");
  });

  it("页面契约包含关键 actions", () => {
    const actionNames = tenantManagementPageContract.actions.map((a) => a.action);
    assert.ok(actionNames.includes("read"));
    assert.ok(actionNames.includes("create"));
    assert.ok(actionNames.includes("update"));
  });
});
