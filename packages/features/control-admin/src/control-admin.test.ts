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
import { TenantDatabaseSeeder } from "@chenrun/db-tenant";
import type {
  ProvisionTenantDatabaseInput,
  ProvisionTenantDatabaseResult,
  TenantDatabaseProvisioner,
} from "@chenrun/db-migrate";

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

test("ControlAdminService 租户开通逻辑、初始凭证、预置角色与状态管控", async () => {
  // 模拟 Organization 与 TenantDatabase 内存仓储
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
    { id: string; userId: string; password?: string | null }
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
      async findUnique({ where }: { where: { slug: string } }) {
        for (const org of orgMap.values()) {
          if (org.slug === where.slug) return org;
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
        const org = {
          id: data.id,
          name: data.name,
          slug: data.slug,
          createdAt: new Date(),
        };
        orgMap.set(data.id, org);
        if (data.members?.create) {
          memberList.push({
            id: data.members.create.id,
            organizationId: data.id,
            userId: data.members.create.userId,
            role: data.members.create.role,
          });
        }
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
        const current = accountMap.get(key);
        if (!current) throw new Error("not found");
        const updated = { ...current, ...data };
        accountMap.set(key, updated);
        return updated;
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
        const item = { ...create, ...update };
        roleMap.set(key, item);
        return item;
      },
    },
    member: {
      async findMany({ where }: { where: { organizationId: string } }) {
        return memberList.filter(
          (m) => m.organizationId === where.organizationId,
        );
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
  assert.equal(provisionResult.initialPassword, "Admin123456!");

  // 验证 R-01 规则：超管绝对不成为租户 Member，Owner User 才是唯一 Member
  const members = memberList.filter(
    (m) => m.organizationId === provisionResult.organizationId,
  );
  assert.equal(members.length, 1);
  assert.equal(members[0]?.role, "owner");
  const ownerUser = userMap.get("admin@tenant-test.com");
  assert.ok(ownerUser);
  assert.equal(members[0]?.userId, ownerUser.id);
  assert.notEqual(ownerUser.email, superAdmin.email);

  // 验证 Account credential 与加密密码已写入
  const ownerAccount = accountMap.get(`${ownerUser.id}:credential`);
  assert.ok(ownerAccount);
  assert.ok(ownerAccount.password && ownerAccount.password.includes(":"));

  // 验证 Control DB 角色初始化 (owner, admin, buyer)
  assert.ok(roleMap.has(`${provisionResult.organizationId}:owner`));
  assert.ok(roleMap.has(`${provisionResult.organizationId}:admin`));
  assert.ok(roleMap.has(`${provisionResult.organizationId}:buyer`));

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

test("ControlAdminService 开通租户串联物理库创建、基线迁移与数据种子初始化", async () => {
  let capturedProvisionInput: ProvisionTenantDatabaseInput | undefined;

  const mockProvisioner = {
    async provision(
      input: ProvisionTenantDatabaseInput,
    ): Promise<ProvisionTenantDatabaseResult> {
      capturedProvisionInput = input;
      return {
        organizationId: input.organizationId,
        databaseName: `tenant_${input.organizationId}`,
        schemaVersion: "202609100001",
        status: "ACTIVE",
        appliedMigrationCount: 0,
        seedResult: {
          rootDepartmentId: "dept_root",
          seededPositionsCount: 3,
          ownerEmployeeProfileId: `emp_${input.organizationId}_owner`,
        },
      };
    },
  } as unknown as TenantDatabaseProvisioner;

  const orgMap = new Map<string, { id: string; name: string; slug: string }>();
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
    { id: string; userId: string; password?: string | null }
  >();
  const roleMap = new Map<string, unknown>();

  const fakePrisma = {
    organization: {
      async findUnique() {
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
        orgMap.set(data.id, data);
        if (data.members?.create) {
          memberList.push({ ...data.members.create, organizationId: data.id });
        }
        return { ...data, createdAt: new Date() };
      },
    },
    user: {
      async findUnique() {
        return null;
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
    account: {
      async findFirst() {
        return null;
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
    member: {
      async findMany({ where }: { where: { organizationId: string } }) {
        return memberList.filter(
          (m) => m.organizationId === where.organizationId,
        );
      },
    },
    tenantDatabase: {
      async findUnique() {
        return null;
      },
    },
  } as unknown as ControlPrismaClient;

  const service = new ControlAdminService(
    fakePrisma,
    mockProvisioner,
    new TenantDatabaseSeeder(),
  );

  const superAdmin = { email: "admin@chenrun.com" };
  const input: ProvisionTenantInput = {
    name: "新开通制造工厂",
    slug: "factory-chenrun",
    adminEmail: "factory_owner@chenrun.com",
    adminName: "李厂长",
    initialPassword: "CustomPassword2026!",
  };

  const result = await service.provisionTenant(input, superAdmin);

  assert.equal(result.slug, "factory-chenrun");
  assert.equal(result.status, "ACTIVE");
  assert.equal(result.initialPassword, "CustomPassword2026!");

  // 断言 TenantProvisioner 被调用且带上了完整的 seedInput
  assert.ok(capturedProvisionInput);
  assert.equal(capturedProvisionInput.organizationId, result.organizationId);
  assert.equal(capturedProvisionInput.databaseName, "tenant_factory_chenrun");
  assert.ok(capturedProvisionInput.seedInput);
  assert.equal(
    capturedProvisionInput.seedInput.organizationName,
    "新开通制造工厂",
  );
  assert.equal(
    capturedProvisionInput.seedInput.ownerEmail,
    "factory_owner@chenrun.com",
  );
  assert.equal(capturedProvisionInput.seedInput.ownerName, "李厂长");
});
