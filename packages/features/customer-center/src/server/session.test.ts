import test from "node:test";
import assert from "node:assert/strict";
import { createMongoAbility } from "@casl/ability";
import { ForbiddenError } from "@casl/ability";
import type { AppAbility } from "@chenrun/authorization";
import { assertCustomerAbility } from "./session";
import { customerCatalog } from "../catalog";
import { CustomerSubject } from "../contracts";

test("assertCustomerAbility：有权限放行，无权限抛 ForbiddenError", () => {
  const allowed = createMongoAbility([
    { action: "create", subject: CustomerSubject },
  ]) as unknown as AppAbility<string, string>;
  assert.doesNotThrow(() =>
    assertCustomerAbility(allowed, "create", CustomerSubject),
  );
  assert.throws(
    () => assertCustomerAbility(allowed, "delete", CustomerSubject),
    ForbiddenError,
  );
});

test("customerCatalog 从契约派生 Customer 动作（含 toggle_status）", () => {
  const def = customerCatalog.resolveBySubject(CustomerSubject);
  assert.ok(def);
  assert.ok(def.actions.includes("toggle_status"));
  assert.ok(def.actions.includes("create"));
  assert.ok(def.actions.includes("export"));
});
