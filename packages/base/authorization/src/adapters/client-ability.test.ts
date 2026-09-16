import test from "node:test";
import assert from "node:assert/strict";
import {
  createAbilityFromSnapshot,
  snapshotToRawRules,
} from "./client-ability";

test("snapshotToRawRules：无字段策略时按动作放行", () => {
  const rules = snapshotToRawRules({
    subject: "Customer",
    actions: ["read", "export"],
  });
  assert.deepEqual(rules, [
    { action: "read", subject: "Customer" },
    { action: "export", subject: "Customer" },
  ]);
});

test("snapshotToRawRules：HIDDEN/READONLY 使用 inverted 规则，未声明字段默认放行", () => {
  const rules = snapshotToRawRules({
    subject: "Customer",
    actions: ["read", "update", "delete"],
    fieldPolicies: {
      customerName: "EDITABLE",
      creditLimit: "HIDDEN",
      status: "READONLY",
    },
  });

  // 动作级放行
  assert.ok(rules.some((r) => r.action === "read" && !r.fields));
  assert.ok(rules.some((r) => r.action === "update" && !r.fields));
  assert.ok(rules.some((r) => r.action === "delete" && !r.fields));

  // HIDDEN：read/update inverted
  assert.ok(
    rules.some(
      (r) =>
        r.action === "read" &&
        r.inverted === true &&
        Array.isArray(r.fields) &&
        r.fields.includes("creditLimit"),
    ),
  );
  // READONLY：update inverted
  assert.ok(
    rules.some(
      (r) =>
        r.action === "update" &&
        r.inverted === true &&
        Array.isArray(r.fields) &&
        r.fields.includes("status"),
    ),
  );
  // READONLY 不应挡 read
  assert.ok(
    !rules.some(
      (r) =>
        r.action === "read" &&
        r.inverted === true &&
        Array.isArray(r.fields) &&
        r.fields.includes("status"),
    ),
  );
});

test("createAbilityFromSnapshot：官方 can() 语义与字段三态对齐", () => {
  const ability = createAbilityFromSnapshot({
    subject: "Customer",
    actions: ["read", "update", "export", "toggle_status"],
    fieldPolicies: {
      customerName: "EDITABLE",
      creditLimit: "HIDDEN",
      status: "READONLY",
    },
  });

  assert.equal(ability.can("read", "Customer"), true);
  assert.equal(ability.can("export", "Customer"), true);
  assert.equal(ability.can("toggle_status", "Customer"), true);
  assert.equal(ability.can("delete", "Customer"), false);
  assert.equal(ability.can("read", "Order"), false);

  assert.equal(ability.can("read", "Customer", "customerName"), true);
  assert.equal(ability.can("read", "Customer", "status"), true);
  assert.equal(ability.can("read", "Customer", "unlisted"), true);
  assert.equal(ability.can("read", "Customer", "creditLimit"), false);

  assert.equal(ability.can("update", "Customer", "customerName"), true);
  assert.equal(ability.can("update", "Customer", "status"), false);
  assert.equal(ability.can("update", "Customer", "creditLimit"), false);
});

test("createAbilityFromSnapshot：空 actions Fail-Closed", () => {
  const ability = createAbilityFromSnapshot({
    subject: "Customer",
    actions: [],
  });
  assert.equal(ability.can("read", "Customer"), false);
});
