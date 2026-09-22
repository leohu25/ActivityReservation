import test from "node:test";
import assert from "node:assert/strict";
import { buildCanonicalSchema } from "./aggregate";
import { findWorkspaceRoot } from "../core/paths";

test("tenant canonical schema merges explicit model extensions", () => {
  const schema = buildCanonicalSchema(findWorkspaceRoot(), "tenant");
  assert.equal(schema.match(/model Department\s*\{/g)?.length, 1);
  assert.match(schema, /employees\s+EmployeeProfile\[\]/);
  assert.match(schema, /stores\s+CustomerStore\[\]/);
});

test("platform canonical schema includes migration ledger", () => {
  const schema = buildCanonicalSchema(findWorkspaceRoot(), "platform");
  assert.match(schema, /model TenantMigration\s*\{/);
  assert.match(schema, /model TenantDatabase\s*\{/);
});
