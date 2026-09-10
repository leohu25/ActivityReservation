import test from "node:test";
import assert from "node:assert/strict";
import type {
  AuthorizationRepository,
  OrganizationMemberRecord,
  OrganizationRoleRecord,
} from "@chenrun/db-control";
import {
  TenantRoleService,
  TenantRoleServiceError,
  deriveBuiltInRoleDefaults,
} from "./tenant-role-service";

const now = new Date("2026-09-08T00:00:00.000Z");

function createMockRepo(initialRoles: OrganizationRoleRecord[] = []): {
  repo: AuthorizationRepository;
  roles: OrganizationRoleRecord[];
} {
  const roles = [...initialRoles];
  return {
    roles,
    repo: {
      async findMember(): Promise<OrganizationMemberRecord | null> {
        return null;
      },
      async findOrganizationRoles(
        orgId: string,
        roleNames: readonly string[],
      ): Promise<OrganizationRoleRecord[]> {
        return roles.filter(
          (r) => r.organizationId === orgId && roleNames.includes(r.role),
        );
      },
      async listOrganizationRoles(
        orgId: string,
      ): Promise<OrganizationRoleRecord[]> {
        return roles.filter((r) => r.organizationId === orgId);
      },
      async upsertOrganizationRole(input: {
        organizationId: string;
        role: string;
        permission: string;
      }): Promise<OrganizationRoleRecord> {
        const existingIdx = roles.findIndex(
          (r) =>
            r.organizationId === input.organizationId && r.role === input.role,
        );
        const record: OrganizationRoleRecord = {
          id:
            existingIdx >= 0
              ? roles[existingIdx].id
              : `role_${roles.length + 1}`,
          organizationId: input.organizationId,
          role: input.role,
          permission: input.permission,
          createdAt: now,
          updatedAt: now,
        };
        if (existingIdx >= 0) {
          roles[existingIdx] = record;
        } else {
          roles.push(record);
        }
        return record;
      },
      async deleteOrganizationRole(orgId: string, role: string): Promise<void> {
        const idx = roles.findIndex(
          (r) => r.organizationId === orgId && r.role === role,
        );
        if (idx >= 0) {
          roles.splice(idx, 1);
        }
      },
    },
  };
}

test("listTenantRoles 对于未持久化配置的角色严格返回空权限 (Fail-Closed) 并支持加载已持久化角色", async () => {
  const { repo } = createMockRepo([
    {
      id: "role_custom_1",
      organizationId: "org_test",
      role: "procurement_auditor",
      permission: JSON.stringify({
        statement: { "procurement.order": ["read", "audit"] },
        dataScopes: [{ resource: "procurement.order", scopeType: "DEPT" }],
        fieldPolicies: [],
      }),
      createdAt: now,
      updatedAt: now,
    },
  ]);

  const service = new TenantRoleService(repo);
  const list = await service.listTenantRoles("org_test");

  assert.equal(list.length, 3);
  assert.equal(list[0].role, "admin");
  assert.equal(list[0].isSystem, true);
  // 未在数据库中持久化配置的内置角色，必须为空权限与 null updatedAt，严禁虚假回显
  assert.deepEqual(list[0].permissions.statement, {});
  assert.deepEqual(list[0].permissions.dataScopes, []);
  assert.deepEqual(list[0].permissions.fieldPolicies, []);
  assert.equal(list[0].updatedAt, null);

  assert.equal(list[1].role, "member");
  assert.equal(list[1].isSystem, true);
  assert.deepEqual(list[1].permissions.statement, {});
  assert.deepEqual(list[1].permissions.dataScopes, []);
  assert.deepEqual(list[1].permissions.fieldPolicies, []);
  assert.equal(list[1].updatedAt, null);

  assert.equal(list[2].role, "procurement_auditor");
  assert.equal(list[2].isSystem, false);
  assert.deepEqual(list[2].permissions.statement["procurement.order"], [
    "read",
    "audit",
  ]);
  assert.ok(list[2].updatedAt);
});

test("deriveBuiltInRoleDefaults 动态自驱推导核心内置角色的推荐权限模板", () => {
  const defaults = deriveBuiltInRoleDefaults();

  // 1. admin 模板拥有各业务切片的全部权限
  assert.ok(defaults.admin.statement["procurement.order"]);
  assert.ok(defaults.admin.statement["customer"]);
  assert.ok(defaults.admin.statement["organization.employee"]);

  // 2. member 模板默认获得 read 权限及敏感字段保护
  assert.deepEqual(defaults.member.statement["procurement.order"], ["read"]);
  assert.deepEqual(defaults.member.statement["customer"], ["read"]);
  const memberCostPricePolicy = defaults.member.fieldPolicies?.find(
    (fp) => fp.subject === "PurchaseOrder" && fp.field === "costPrice",
  );
  assert.ok(memberCostPricePolicy);
  assert.equal(memberCostPricePolicy.access, "READONLY");
});

test("saveRolePermissions 正确持久化角色四层权限并反序列化回显", async () => {
  const { repo } = createMockRepo();
  const service = new TenantRoleService(repo);

  const saved = await service.saveRolePermissions({
    organizationId: "org_test",
    role: "buyer",
    payload: {
      statement: {
        "procurement.order": ["read", "create"],
      },
      dataScopes: [
        {
          resource: "procurement.order",
          action: "read",
          scopeType: "SELF",
        },
      ],
      fieldPolicies: [
        {
          subject: "PurchaseOrder",
          field: "costPrice",
          access: "READONLY",
        },
      ],
    },
  });

  assert.equal(saved.role, "buyer");
  assert.ok(saved.permissions.dataScopes);
  assert.deepEqual(saved.permissions.dataScopes[0].scopeType, "SELF");
  assert.ok(saved.permissions.fieldPolicies);
  assert.equal(saved.permissions.fieldPolicies[0].access, "READONLY");
});

test("createRole 校验角色编码格式并禁止覆盖内置角色", async () => {
  const { repo } = createMockRepo();
  const service = new TenantRoleService(repo);

  // 1. 非法编码拒绝
  await assert.rejects(
    service.createRole({
      organizationId: "org_test",
      roleCode: "123_invalid",
    }),
    TenantRoleServiceError,
  );

  // 2. 覆盖内置角色拒绝
  await assert.rejects(
    service.createRole({
      organizationId: "org_test",
      roleCode: "admin",
    }),
    TenantRoleServiceError,
  );

  // 3. 合法创建
  const created = await service.createRole({
    organizationId: "org_test",
    roleCode: "senior_buyer",
    roleName: "资深采购专员",
  });
  assert.equal(created.role, "senior_buyer");
  assert.equal(created.name, "资深采购专员");
});

test("deleteRole 严禁删除系统核心内置角色", async () => {
  const { repo } = createMockRepo();
  const service = new TenantRoleService(repo);

  await assert.rejects(
    service.deleteRole("org_test", "owner"),
    /严禁删除系统核心内置角色/,
  );
  await assert.rejects(
    service.deleteRole("org_test", "admin"),
    /严禁删除系统核心内置角色/,
  );
  await assert.rejects(
    service.deleteRole("org_test", "member"),
    /严禁删除系统核心内置角色/,
  );

  // 允许删除自定义角色
  await service.deleteRole("org_test", "custom_role");
});
