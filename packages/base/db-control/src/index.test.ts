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

const defaultTenantDatabaseDelegate = {
  async findUnique() {
    return null;
  },
  async findMany() {
    return [];
  },
  async update() {
    return mapping;
  },
  async upsert() {
    return mapping;
  },
};

const defaultOrganizationRoleDelegate = {
  async findMany() {
    return [];
  },
  async upsert() {
    return {
      id: "role-default",
      organizationId: "org-1",
      role: "default",
      permission: "{}",
      createdAt: now,
      updatedAt: now,
    };
  },
  async delete() {
    return null;
  },
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
    organizationRole: defaultOrganizationRoleDelegate,
    tenantDatabase: defaultTenantDatabaseDelegate,
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
    member: {
      async findUnique() {
        return null;
      },
    },
    organizationRole: defaultOrganizationRoleDelegate,
    tenantDatabase: {
      ...defaultTenantDatabaseDelegate,
      async findUnique(args) {
        received = args;
        return mapping;
      },
    },
  };

  const result = await new PrismaControlDbRepository(client).findTenantDatabase(
    "org-1",
  );

  assert.equal(result, mapping);
  assert.deepEqual(received, { where: { organizationId: "org-1" } });
  assert.equal("databaseUrl" in result!, false);
  assert.equal("password" in result!, false);
});

test("queries dynamic roles by trusted organization and member role names", async () => {
  let received: unknown;
  const client: ControlPrismaRepositoryClient = {
    member: {
      async findUnique() {
        return null;
      },
    },
    organizationRole: {
      ...defaultOrganizationRoleDelegate,
      async findMany(args) {
        received = args;
        return [];
      },
    },
    tenantDatabase: defaultTenantDatabaseDelegate,
  };

  await new PrismaControlDbRepository(client).findOrganizationRoles("org-1", [
    "buyer",
    "auditor",
  ]);
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

  // 验证租户迁移账本模型契约
  assert.match(
    schema,
    /enum TenantMigrationStatus\s*{[\s\S]*?PENDING[\s\S]*?RUNNING[\s\S]*?SUCCESS[\s\S]*?FAILED[\s\S]*?ROLLED_BACK/,
  );
  const tenantMigration = schema.match(
    /model TenantMigration\s*{([\s\S]*?)\n}/,
  )?.[1];
  assert.ok(tenantMigration);
  assert.match(tenantMigration, /organizationId\s+String/);
  assert.match(tenantMigration, /migrationName\s+String/);
  assert.match(tenantMigration, /version\s+String/);
  assert.match(tenantMigration, /status\s+TenantMigrationStatus/);
  assert.match(tenantMigration, /appliedSteps\s+Int/);
});

test("tenant migration repository records lifecycle from start to success", async () => {
  let createdData: unknown;
  let updatedData: unknown;
  let updatedTenantDb: unknown;

  const mockMigration = {
    id: "mig-1",
    organizationId: "org-1",
    migrationName: "0001_init",
    version: "1.0.0",
    batchId: "batch-1",
    status: "RUNNING" as const,
    appliedSteps: 0,
    errorMessage: null,
    executionTimeMs: null,
    startedAt: now,
    finishedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const client: ControlPrismaRepositoryClient = {
    member: {
      async findUnique() {
        return null;
      },
    },
    organizationRole: defaultOrganizationRoleDelegate,
    tenantDatabase: {
      ...defaultTenantDatabaseDelegate,
      async update(args) {
        updatedTenantDb = args;
        return {
          ...mapping,
          schemaVersion: args.data.schemaVersion ?? mapping.schemaVersion,
          status: args.data.status ?? mapping.status,
        };
      },
    },
    tenantMigration: {
      async create(args) {
        createdData = args;
        return mockMigration;
      },
      async update(args) {
        updatedData = args;
        return {
          ...mockMigration,
          status: "SUCCESS" as const,
          appliedSteps: 3,
          executionTimeMs: 120,
          finishedAt: now,
        };
      },
      async findMany() {
        return [];
      },
      async findFirst() {
        return null;
      },
    },
  };

  const repo = new PrismaControlDbRepository(client);

  // 1. 记录迁移开始
  const startResult = await repo.recordMigrationStart({
    organizationId: "org-1",
    migrationName: "0001_init",
    version: "1.0.0",
    batchId: "batch-1",
  });
  assert.equal(startResult.id, "mig-1");
  assert.equal(startResult.status, "RUNNING");
  assert.deepEqual(
    (createdData as { data: { organizationId: string; version: string } }).data
      .organizationId,
    "org-1",
  );

  // 2. 记录迁移成功
  const successResult = await repo.recordMigrationSuccess({
    migrationId: "mig-1",
    organizationId: "org-1",
    appliedSteps: 3,
    executionTimeMs: 120,
    schemaVersion: "1.0.0",
  });
  assert.equal(successResult.status, "SUCCESS");
  assert.deepEqual(updatedData, {
    where: { id: "mig-1" },
    data: {
      status: "SUCCESS",
      appliedSteps: 3,
      executionTimeMs: 120,
      finishedAt: (updatedData as { data: { finishedAt: Date } }).data
        .finishedAt,
    },
  });
  assert.deepEqual(updatedTenantDb, {
    where: { organizationId: "org-1" },
    data: {
      schemaVersion: "1.0.0",
      status: "ACTIVE",
    },
  });
});

test("tenant migration repository records failure and queries history", async () => {
  let updatedFailure: unknown;
  const failedMigration = {
    id: "mig-err",
    organizationId: "org-1",
    migrationName: "0002_fail",
    version: "2.0.0",
    batchId: null,
    status: "FAILED" as const,
    appliedSteps: 1,
    errorMessage: "syntax error at or near TABLE",
    executionTimeMs: 45,
    startedAt: now,
    finishedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const client: ControlPrismaRepositoryClient = {
    member: {
      async findUnique() {
        return null;
      },
    },
    organizationRole: defaultOrganizationRoleDelegate,
    tenantDatabase: defaultTenantDatabaseDelegate,
    tenantMigration: {
      async create() {
        return failedMigration;
      },
      async update(args) {
        updatedFailure = args;
        return failedMigration;
      },
      async findMany() {
        return [failedMigration];
      },
      async findFirst() {
        return failedMigration;
      },
    },
  };

  const repo = new PrismaControlDbRepository(client);

  const failResult = await repo.recordMigrationFailure({
    migrationId: "mig-err",
    errorMessage: "syntax error at or near TABLE",
    appliedSteps: 1,
    executionTimeMs: 45,
  });
  assert.equal(failResult.status, "FAILED");
  assert.equal(failResult.errorMessage, "syntax error at or near TABLE");
  assert.deepEqual(
    (updatedFailure as { where: { id: string } }).where.id,
    "mig-err",
  );

  const history = await repo.findMigrationHistory("org-1");
  assert.equal(history.length, 1);
  assert.equal(history[0].id, "mig-err");

  const latestFailed = await repo.findLatestFailedMigration("org-1");
  assert.equal(latestFailed?.id, "mig-err");
});

test("organizationRole repository supports listing, upserting and deleting roles", async () => {
  let findManyArgs: unknown;
  let upsertArgs: unknown;
  let deleteArgs: unknown;

  const mockRoleRecord = {
    id: "role-1",
    organizationId: "org-test",
    role: "custom_auditor",
    permission: JSON.stringify({ statement: { "customer.customer": ["read"] } }),
    createdAt: now,
    updatedAt: now,
  };

  const client: ControlPrismaRepositoryClient = {
    member: {
      async findUnique() {
        return null;
      },
    },
    organizationRole: {
      async findMany(args) {
        findManyArgs = args;
        return [mockRoleRecord];
      },
      async upsert(args) {
        upsertArgs = args;
        return mockRoleRecord;
      },
      async delete(args) {
        deleteArgs = args;
        return mockRoleRecord;
      },
    },
    tenantDatabase: defaultTenantDatabaseDelegate,
  };

  const repo = new PrismaControlDbRepository(client);

  // 1. listOrganizationRoles
  const roles = await repo.listOrganizationRoles("org-test");
  assert.equal(roles.length, 1);
  assert.equal(roles[0].role, "custom_auditor");
  assert.deepEqual(findManyArgs, {
    where: { organizationId: "org-test" },
    orderBy: { role: "asc" },
  });

  // 2. upsertOrganizationRole
  const upserted = await repo.upsertOrganizationRole({
    organizationId: "org-test",
    role: "custom_auditor",
    permission: mockRoleRecord.permission,
  });
  assert.equal(upserted.id, "role-1");
  const actualUpsert = upsertArgs as {
    where: unknown;
    create: { id?: string; organizationId: string; role: string; permission: string };
    update: unknown;
  };
  assert.ok(actualUpsert.create.id);
  assert.equal(actualUpsert.create.organizationId, "org-test");
  assert.equal(actualUpsert.create.role, "custom_auditor");
  assert.equal(actualUpsert.create.permission, mockRoleRecord.permission);
  assert.deepEqual(actualUpsert.update, {
    permission: mockRoleRecord.permission,
  });

  // 3. deleteOrganizationRole
  await repo.deleteOrganizationRole("org-test", "custom_auditor");
  assert.deepEqual(deleteArgs, {
    where: {
      organizationId_role: {
        organizationId: "org-test",
        role: "custom_auditor",
      },
    },
  });
});
