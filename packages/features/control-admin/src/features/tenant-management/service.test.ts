import test from "node:test";
import assert from "node:assert/strict";
import { TenantManagementService } from "./service";
import type { ProvisionTenantInput } from "./types";
import type {
  ControlPrismaClient,
  TenantDatabaseRecord,
  TenantDatabaseStatus,
} from "@base/db-control";

test("TenantManagementService 租户开通逻辑、初始凭证、预置角色与状态管控", async () => {
  const orgMap = new Map<
    string,
    { id: string; name: string; slug: string; createdAt: Date }
  >();
  const userMap = new Map<
    string,
    { id: string; email: string; name: string }
  >();
  const memberList: Array<{
    id: string;
    organizationId: string;
    userId: string;
    role: string;
  }> = [];
  const accountMap = new Map<
    string,
    {
      id: string;
      accountId: string;
      userId: string;
      providerId: string;
      password?: string | null;
    }
  >();
  const roleMap = new Map<
    string,
    { id: string; organizationId: string; role: string; permission: string }
  >();
  const dbMap = new Map<string, TenantDatabaseRecord>();

  const fakePrisma = {
    organization: {
      async findMany() {
        return Array.from(orgMap.values()).map((org) => ({
          ...org,
          tenantDatabase: dbMap.get(org.id) ?? null,
          members: memberList.filter((m) => m.organizationId === org.id),
          migrations: [],
        }));
      },
      async findUnique({ where }: { where: { slug?: string; id?: string } }) {
        if (where.slug) {
          return (
            Array.from(orgMap.values()).find((o) => o.slug === where.slug) ??
            null
          );
        }
        if (where.id) {
          return orgMap.get(where.id) ?? null;
        }
        return null;
      },
      async create({
        data,
      }: {
        data: {
          id: string;
          name: string;
          slug: string;
          members?: { create?: { id: string; userId: string; role: string } };
        };
      }) {
        orgMap.set(data.id, {
          id: data.id,
          name: data.name,
          slug: data.slug,
          createdAt: new Date(),
        });
        if (data.members?.create) {
          memberList.push({
            id: data.members.create.id,
            organizationId: data.id,
            userId: data.members.create.userId,
            role: data.members.create.role,
          });
        }
        return { ...data, createdAt: new Date() };
      },
    },
    user: {
      async findUnique({ where }: { where: { email: string } }) {
        return userMap.get(where.email) ?? null;
      },
      async create({
        data,
      }: {
        data: {
          id: string;
          email: string;
          name: string;
          emailVerified: boolean;
        };
      }) {
        userMap.set(data.email, data);
        return data;
      },
    },
    account: {
      async findFirst({
        where,
      }: {
        where: { userId: string; providerId: string };
      }) {
        return accountMap.get(`${where.userId}:${where.providerId}`) ?? null;
      },
      async create({
        data,
      }: {
        data: {
          id: string;
          accountId: string;
          providerId: string;
          userId: string;
          password?: string;
        };
      }) {
        accountMap.set(`${data.userId}:${data.providerId}`, data);
        return data;
      },
      async update({
        where,
        data,
      }: {
        where: {
          providerId_accountId: { providerId: string; accountId: string };
        };
        data: { password?: string };
      }) {
        const key = `${where.providerId_accountId.accountId}:${where.providerId_accountId.providerId}`;
        const prev = accountMap.get(key);
        if (prev) {
          const next = { ...prev, password: data.password };
          accountMap.set(key, next);
          return next;
        }
        return null;
      },
    },
    organizationRole: {
      async upsert({
        where,
        create,
        update,
      }: {
        where: {
          organizationId_role: { organizationId: string; role: string };
        };
        create: {
          id: string;
          organizationId: string;
          role: string;
          permission: string;
        };
        update: { permission: string };
      }) {
        const key = `${where.organizationId_role.organizationId}:${where.organizationId_role.role}`;
        roleMap.set(key, { ...create, ...update });
        return { ...create, ...update };
      },
    },
    tenantDatabase: {
      async create({
        data,
      }: {
        data: {
          organizationId: string;
          clusterCode: string;
          databaseName: string;
          secretRef: string;
          schemaVersion: string;
          status: TenantDatabaseStatus;
        };
      }) {
        const record: TenantDatabaseRecord = {
          id: `tdb_${data.organizationId}`,
          organizationId: data.organizationId,
          clusterCode: data.clusterCode,
          databaseName: data.databaseName,
          secretRef: data.secretRef,
          schemaVersion: data.schemaVersion,
          status: data.status,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        dbMap.set(data.organizationId, record);
        return record;
      },
      async findUnique({ where }: { where: { organizationId: string } }) {
        return dbMap.get(where.organizationId) ?? null;
      },
      async update({
        where,
        data,
      }: {
        where: { organizationId: string };
        data: { status?: TenantDatabaseStatus };
      }) {
        const current = dbMap.get(where.organizationId);
        if (!current) throw new Error("not found");
        const updated = {
          ...current,
          ...data,
          updatedAt: new Date(),
        };
        dbMap.set(where.organizationId, updated);
        return updated;
      },
    },
  } as unknown as ControlPrismaClient;

  const service = new TenantManagementService(fakePrisma);

  const superAdmin = { email: "admin@qq.com" };
  const normalUser = { email: "unauthorized@tenant.com" };

  const input: ProvisionTenantInput = {
    name: "测试开通租户",
    slug: "tenant-test",
    adminEmail: "admin@tenant-test.com",
    adminName: "租户总管",
  };

  await assert.rejects(
    async () => {
      await service.provisionTenant(input, normalUser);
    },
    { message: /需要控制平面超级管理员权限/ },
  );

  const provisionResult = await service.provisionTenant(input, superAdmin);
  assert.equal(provisionResult.slug, "tenant-test");
  assert.equal(provisionResult.databaseName, "tenant_tenant_test");
  assert.equal(provisionResult.status, "ACTIVE");
  assert.equal(provisionResult.initialPassword, "Admin123456!");

  const members = memberList.filter(
    (m) => m.organizationId === provisionResult.organizationId,
  );
  assert.equal(members.length, 1);
  assert.equal(members[0]?.role, "owner");

  const toggleRes = await service.toggleTenantStatus(
    provisionResult.organizationId,
    superAdmin,
  );
  assert.equal(toggleRes, "SUSPENDED");
});
