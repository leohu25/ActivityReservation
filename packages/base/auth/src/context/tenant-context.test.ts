import assert from "node:assert/strict";
import test from "node:test";
import type {
  OrganizationMemberRecord,
  TenantContextRepository,
  TenantDatabaseRecord,
} from "@base/db-control";
import {
  assertTenantAccessGate,
  assertEmployeeActive,
  resolveTenantContext,
  TenantContextError,
  type AuthSessionInput,
  type TenantContextErrorCode,
} from "./tenant-context";
import { createTrustedTenantContextResolver } from "./trusted-tenant-context";

const now = new Date("2026-01-01T00:00:00.000Z");
const member: OrganizationMemberRecord = {
  id: "member-1",
  organizationId: "org-1",
  userId: "user-1",
  role: "member",
  createdAt: now,
};
const database: TenantDatabaseRecord = {
  id: "database-1",
  organizationId: "org-1",
  clusterCode: "cluster-a",
  databaseName: "tenant_1",
  secretRef: "secret/tenant-1",
  schemaVersion: "1",
  status: "ACTIVE",
  createdAt: now,
  updatedAt: now,
};
const authenticated: AuthSessionInput = {
  user: { id: "user-1", email: "user@example.com" },
  session: {
    id: "session-1",
    userId: "user-1",
    activeOrganizationId: "org-1",
    expiresAt: new Date("2099-01-01T00:00:00.000Z"),
  },
};

function repository(
  memberResult: OrganizationMemberRecord | null = member,
  databaseResult: TenantDatabaseRecord | null = database,
): TenantContextRepository {
  return {
    async findMember() {
      return memberResult;
    },
    async findTenantDatabase() {
      return databaseResult;
    },
  };
}

async function rejectsWithCode(
  action: Promise<unknown>,
  code: TenantContextErrorCode,
): Promise<void> {
  await assert.rejects(action, (error: unknown) => {
    return error instanceof TenantContextError && error.code === code;
  });
}

test("rejects unauthenticated and mismatched sessions", async () => {
  await rejectsWithCode(
    resolveTenantContext(null, repository()),
    "UNAUTHENTICATED",
  );
  await rejectsWithCode(
    resolveTenantContext(
      {
        ...authenticated,
        session: { ...authenticated.session!, userId: "other-user" },
      },
      repository(),
    ),
    "UNAUTHENTICATED",
  );
});

test("rejects a session without an active organization", async () => {
  await rejectsWithCode(
    resolveTenantContext(
      {
        ...authenticated,
        session: { ...authenticated.session!, activeOrganizationId: null },
      },
      repository(),
    ),
    "ACTIVE_ORGANIZATION_REQUIRED",
  );
});

test("rejects a user who is not a member", async () => {
  await rejectsWithCode(
    resolveTenantContext(authenticated, repository(null)),
    "ORGANIZATION_MEMBERSHIP_REQUIRED",
  );
});

test("rejects a missing tenant database mapping", async () => {
  await rejectsWithCode(
    resolveTenantContext(authenticated, repository(member, null)),
    "TENANT_DATABASE_NOT_FOUND",
  );
});

test("rejects an inactive tenant database mapping", async () => {
  await rejectsWithCode(
    resolveTenantContext(
      authenticated,
      repository(member, { ...database, status: "SUSPENDED" }),
    ),
    "TENANT_DATABASE_INACTIVE",
  );
});

test("returns the verified member and active database", async () => {
  const context = await resolveTenantContext(authenticated, repository());

  assert.equal(context.organizationId, "org-1");
  assert.equal(context.member, member);
  assert.equal(context.database, database);
});

test("trusted request resolver obtains the session from Better Auth headers", async () => {
  const headers = new Headers({ cookie: "better-auth.session_token=signed" });
  let receivedHeaders: Headers | undefined;
  const resolver = createTrustedTenantContextResolver({
    sessionReader: {
      async getSession(input) {
        receivedHeaders = input.headers;
        return authenticated;
      },
    },
    repository: repository(),
  });

  const context = await resolver(headers);

  assert.equal(receivedHeaders, headers);
  assert.equal(context.organizationId, "org-1");
});

test("trusted request resolver fails closed when Better Auth finds no session", async () => {
  const resolver = createTrustedTenantContextResolver({
    sessionReader: {
      async getSession() {
        return null;
      },
    },
    repository: repository(),
  });

  await rejectsWithCode(resolver(new Headers()), "UNAUTHENTICATED");
});

test("assertTenantAccessGate allows ACTIVE employee profile", () => {
  assert.doesNotThrow(() => {
    assertTenantAccessGate({ status: "ACTIVE" });
  });
  assert.doesNotThrow(() => {
    assertEmployeeActive({ status: "ACTIVE" });
  });
});

test("assertTenantAccessGate rejects null or undefined profile", () => {
  assert.throws(
    () => assertTenantAccessGate(null),
    (err: unknown) =>
      err instanceof TenantContextError &&
      err.code === "EMPLOYEE_PROFILE_NOT_FOUND",
  );
  assert.throws(
    () => assertTenantAccessGate(undefined),
    (err: unknown) =>
      err instanceof TenantContextError &&
      err.code === "EMPLOYEE_PROFILE_NOT_FOUND",
  );
});

test("assertTenantAccessGate rejects SUSPENDED employee profile", () => {
  assert.throws(
    () => assertTenantAccessGate({ status: "SUSPENDED" }),
    (err: unknown) =>
      err instanceof TenantContextError && err.code === "EMPLOYEE_SUSPENDED",
  );
});

test("assertTenantAccessGate rejects TERMINATED employee profile", () => {
  assert.throws(
    () => assertTenantAccessGate({ status: "TERMINATED" }),
    (err: unknown) =>
      err instanceof TenantContextError && err.code === "EMPLOYEE_TERMINATED",
  );
});

test("assertTenantAccessGate rejects unactivated employee profile", () => {
  assert.throws(
    () => assertTenantAccessGate({ status: "INVITED" }),
    (err: unknown) =>
      err instanceof TenantContextError && err.code === "EMPLOYEE_NOT_ACTIVE",
  );
});
