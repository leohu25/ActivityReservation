import test from "node:test";
import assert from "node:assert/strict";
import {
  createSubjectAbility,
  isFieldAllowedForAction,
} from "./index";

test("isFieldAllowedForAction：HIDDEN 剥离，READONLY 仅挡写", () => {
  const policies = { secret: "HIDDEN", remark: "READONLY", name: "EDITABLE" };
  assert.equal(isFieldAllowedForAction(policies, "read", "secret"), false);
  assert.equal(isFieldAllowedForAction(policies, "read", "remark"), true);
  assert.equal(isFieldAllowedForAction(policies, "update", "remark"), false);
  assert.equal(isFieldAllowedForAction(policies, "update", "name"), true);
  assert.equal(isFieldAllowedForAction(policies, "read", "unlisted"), true);
  assert.equal(isFieldAllowedForAction(policies, "read", undefined), true);
});

test("createSubjectAbility：subject 不匹配 / action 未授权一律拒绝", () => {
  const ability = createSubjectAbility(
    { actions: ["read", "export"], fieldPolicies: { creditLimit: "HIDDEN" } },
    "Customer",
  );
  assert.ok(ability);
  assert.equal(ability.can("read", "Customer"), true);
  assert.equal(ability.can("export", "Customer"), true);
  assert.equal(ability.can("delete", "Customer"), false);
  assert.equal(ability.can("read", "Order"), false);
  assert.equal(ability.can("read", "Customer", "creditLimit"), false);
  assert.equal(ability.can("read", "Customer", "customerName"), true);
});

test("createSubjectAbility：permissions 缺失返回 undefined（Fail-Closed）", () => {
  assert.equal(createSubjectAbility(undefined, "Customer"), undefined);
  assert.equal(createSubjectAbility(null, "Customer"), undefined);
});

test("createSubjectAbility：空 actions 白名单拒绝一切动作", () => {
  const ability = createSubjectAbility({ actions: [] }, "Customer");
  assert.ok(ability);
  assert.equal(ability.can("read", "Customer"), false);
  assert.equal(ability.can("create", "Customer"), false);
});
