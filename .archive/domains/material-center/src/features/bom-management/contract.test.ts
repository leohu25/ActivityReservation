import test from "node:test";
import assert from "node:assert/strict";
import { bomManagementPageContract } from "./contract";

test("工艺BOM契约 (SSoT) 完整性校验", () => {
  assert.equal(bomManagementPageContract.subject, "BomHeader");
  assert.equal(bomManagementPageContract.path, "/materials/boms");
  const actions = bomManagementPageContract.actions.map((a) => a.action);
  assert.ok(actions.includes("read"));
  assert.ok(actions.includes("create"));
  assert.ok(actions.includes("update"));
  assert.ok(actions.includes("delete"));
  assert.ok(actions.includes("publish"));
  assert.ok(actions.includes("archive"));
  assert.ok(actions.includes("create_new_version"));
});
