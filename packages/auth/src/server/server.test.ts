import assert from "node:assert/strict";
import test from "node:test";
import {
  GET,
  POST,
} from "../../../../apps/tenant/src/app/api/auth/[...all]/route";
import {
  createServerAuth,
  getCurrentTenantContext,
  getServerAuth,
} from "../index";

test("createServerAuth constructs Better Auth with session and organization APIs", async () => {
  const runtime = createServerAuth({
    databaseUrl: "postgresql://user:pass@127.0.0.1:5432/saas_control",
    secret: "test-secret-with-at-least-32-characters",
    baseURL: "http://localhost:3000",
  });

  try {
    assert.equal(typeof runtime.auth.api.getSession, "function");
    assert.equal(typeof runtime.auth.api.createOrganization, "function");
    assert.equal(typeof runtime.auth.api.setActiveOrganization, "function");
    assert.ok(runtime.tenantContextRepository);
  } finally {
    await runtime.prisma.$disconnect();
  }
});

test("server entry points are exported without eager environment access", () => {
  assert.equal(typeof getServerAuth, "function");
  assert.equal(typeof getCurrentTenantContext, "function");
  assert.equal(typeof GET, "function");
  assert.equal(typeof POST, "function");
});
