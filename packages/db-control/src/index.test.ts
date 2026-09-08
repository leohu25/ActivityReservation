import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  PrismaControlDbRepository,
  type ControlPrismaRepositoryClient,
  type OrganizationMemberRecord,
  type TenantDatabaseRecord,
} from "./index";

const now = new Date("2026-01-01T00:00:00.000Z");
const member: OrganizationMemberRecord = {
  id: "member-1",
  organizationId: "org-1",
  userId: "user-1",
  role: "member",
  createdAt: now,
};
const mapping: TenantDatabaseRecord = {
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

test("queries membership by the organization and user compound key", async () => {
  let received: unknown;
  const client: ControlPrismaRepositoryClient = {
    member: {
      async findUnique(args) {
        received = args;
        return member;
      },
    },
    organizationRole: { async findMany() { return []; } },
    tenantDatabase: { async findUnique() { return null; } },
  };

  const result = await new PrismaControlDbRepository(client).findMember(
    "org-1",
    "user-1",
  );

  assert.equal(result, member);
  assert.deepEqual(received, {
    where: {
      organizationId_userId: {
        organizationId: "org-1",
        userId: "user-1",
      },
    },
  });
});

test("queries the database mapping only by trusted organization id", async () => {
  let received: unknown;
  const client: ControlPrismaRepositoryClient = {
    member: { async findUnique() { return null; } },
    organizationRole: { async findMany() { return []; } },
    tenantDatabase: {
      async findUnique(args) {
        received = args;
        return mapping;
      },
    },
  };

  const result = await new PrismaControlDbRepository(
    client,
  ).findTenantDatabase("org-1");

  assert.equal(result, mapping);
  assert.deepEqual(received, { where: { organizationId: "org-1" } });
  assert.equal("databaseUrl" in result!, false);
  assert.equal("password" in result!, false);
});

test("queries dynamic roles by trusted organization and member role names", async () => {
  let received: unknown;
  const client: ControlPrismaRepositoryClient = {
    member: { async findUnique() { return null; } },
    organizationRole: {
      async findMany(args) {
        received = args;
        return [];
      },
    },
    tenantDatabase: { async findUnique() { return null; } },
  };

  await new PrismaControlDbRepository(client).findOrganizationRoles(
    "org-1",
    ["buyer", "auditor"],
  );
  assert.deepEqual(received, {
    where: {
      organizationId: "org-1",
      role: { in: ["buyer", "auditor"] },
    },
  });
});

test("Prisma schema exposes Better Auth Organization tenant contracts", () => {
  const schema = readFileSync(
    new URL("../prisma/schema.prisma", import.meta.url),
    "utf8",
  );

  assert.match(schema, /model Organization\s*{/);
  assert.match(schema, /model Member\s*{/);
  assert.match(schema, /model OrganizationRole\s*{/);
  assert.match(
    schema,
    /model OrganizationRole\s*{[\s\S]*?organizationId\s+String[\s\S]*?role\s+String[\s\S]*?permission\s+String/,
  );
  assert.match(
    schema,
    /model Session\s*{[\s\S]*?activeOrganizationId\s+String\?/,
  );
  assert.match(
    schema,
    /model Member\s*{[\s\S]*?organizationId\s+String[\s\S]*?userId\s+String/,
  );
  const tenantDatabase = schema.match(
    /model TenantDatabase\s*{([\s\S]*?)\n}/,
  )?.[1];
  assert.ok(tenantDatabase);
  assert.match(tenantDatabase, /organizationId\s+String\s+@unique/);
  assert.match(tenantDatabase, /secretRef\s+String/);
  assert.doesNotMatch(tenantDatabase, /databaseUrl|password/i);
});
