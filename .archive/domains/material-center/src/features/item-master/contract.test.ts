import test from "node:test";
import assert from "node:assert/strict";
import { itemMasterPageContract } from "./contract";

test("商品档案契约 (SSoT) 完整性校验", () => {
  assert.equal(itemMasterPageContract.subject, "ItemMaster");
  assert.equal(itemMasterPageContract.path, "/materials/items");
  const actions = itemMasterPageContract.actions.map((a) => a.action);
  assert.ok(actions.includes("read"));
  assert.ok(actions.includes("create"));
  assert.ok(actions.includes("update"));
  assert.ok(actions.includes("delete"));
  assert.ok(actions.includes("export"));
  assert.ok(actions.includes("toggle_status"));
});
