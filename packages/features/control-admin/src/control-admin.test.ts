import test from "node:test";
import assert from "node:assert/strict";
import {
  checkIsControlAdmin,
  assertControlAdmin,
  isControlAdminEmail,
} from "./auth/control-guard";
import { ControlAdminService } from "./services/control-admin";
import type { ProvisionTenantInput } from "./types";
import type {
  ControlPrismaClient,
  TenantDatabaseRecord,
  TenantDatabaseStatus,
} from "@chenrun/db-control";

test("控制平面超管鉴权判定与断言守卫", () => {
  // 1. 默认邮箱白名单包含 admin@chenrun.com
  assert.equal(isControlAdminEmail("admin@chenrun.com"), true);
  assert.equal(isControlAdminEmail("ADMIN@CHENRUN.COM"), true); // 大小写不敏感
  assert.equal(isControlAdminEmail("user@example.com"), false);
  assert.equal(isControlAdminEmail(null), false);
  assert.equal(isControlAdminEmail(""), false);

  // 2. checkIsControlAdmin
  assert.equal(checkIsControlAdmin({ email: "admin@chenrun.com" }), true);
  assert.equal(checkIsControlAdmin({ email: "normal@tenant.com" }), false);
  assert.equal(checkIsControlAdmin(null), false);

  // 3. assertControlAdmin
  assert.doesNotThrow(() => {
    assertControlAdmin({ email: "admin@chenrun.com" });
  });

  assert.throws(
    () => {
      assertControlAdmin({ email: "attacker@malicious.com" });
    },
    {
      name: "Error",
      message: /需要控制平面超级管理员权限/,
    },
  );
});

test("ControlAdminService 租户开通逻辑与状态管控", async () => {
  // 模拟 Organization 与 TenantDatabase 内存仓储
  const orgMap = new Map<
    string,
    { id: string; name: string; slug: string; createdAt: Date }
  >();
  const userMap = new Map<
    string,
    { id: string; email: string; name: string }
  >();
  const dbMap = new Map<string, TenantDatabaseRecord>();

  const fakePrisma = {
    organization: {
      async findMany() {
        return Array.from(orgMap.values()).map((org) => ({
          ...org,
          tenantDatabase: dbMap.get(org.id) ?? null,
          members: [{ id: "mem_1" }],
          migrations: [],
        }));
      },
      async findUnique({ where }: { where: { slug: string } }) {
        for (const org of orgMap.values()) {
          if (org.slug === where.slug) return org;
        }
        return null;
      },
      async create({
        data,
      }: {
        data: { id: string; name: string; slug: string };
      }) {
        const org = { ...data, createdAt: new Date() };
        orgMap.set(data.id, org);
        return org;
      },
    },
    user: {
      async findUnique({ where }: { where: { email: string } }) {
        return userMap.get(where.email) ?? null;
      },
      async create({
        data,
      }: {
        data: { id: string; email: string; name: string };
      }) {
        userMap.set(data.email, data);
        return data;
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

  const service = new ControlAdminService(fakePrisma);

  const superAdmin = { email: "admin@chenrun.com" };
  const normalUser = { email: "unauthorized@tenant.com" };

  // 1. 非超管尝试开通应被拦截
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

  // 2. 超管开通新租户
  const provisionResult = await service.provisionTenant(input, superAdmin);
  assert.equal(provisionResult.slug, "tenant-test");
  assert.equal(provisionResult.databaseName, "tenant_tenant_test");
  assert.equal(provisionResult.status, "ACTIVE");

  // 3. 重复 Slug 拦截
  await assert.rejects(
    async () => {
      await service.provisionTenant(input, superAdmin);
    },
    { message: /已存在/ },
  );

  // 4. 非法 Slug 格式拦截
  await assert.rejects(
    async () => {
      await service.provisionTenant(
        {
          ...input,
          slug: "INVALID SLUG!",
        },
        superAdmin,
      );
    },
    { message: /由 2-32 位小写字母/ },
  );

  // 5. 查询列表与统计大盘
  const stats = await service.getStats();
  assert.equal(stats.totalTenants, 1);
  assert.equal(stats.activeTenants, 1);
  assert.equal(stats.suspendedTenants, 0);

  const list = await service.listTenants();
  assert.equal(list.length, 1);
  assert.equal(list[0].name, "测试开通租户");
  assert.equal(list[0].database?.status, "ACTIVE");

  // 6. 超管将租户挂起 (SUSPENDED)
  const toggledStatus = await service.toggleTenantStatus(
    provisionResult.organizationId,
    superAdmin,
  );
  assert.equal(toggledStatus, "SUSPENDED");

  const updatedStats = await service.getStats();
  assert.equal(updatedStats.activeTenants, 0);
  assert.equal(updatedStats.suspendedTenants, 1);

  // 7. 再次切换恢复为 ACTIVE
  const restoredStatus = await service.toggleTenantStatus(
    provisionResult.organizationId,
    superAdmin,
  );
  assert.equal(restoredStatus, "ACTIVE");
});
