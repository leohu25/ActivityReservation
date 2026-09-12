import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  CaslAbilityFactory,
  DataScope,
  getAccessibleWhere,
} from "@base/authorization";
import { customerCatalog } from "../../catalog";
import { CustomerSubject } from "../../features/customer-management/contract";
import { CustomerService } from "../../features/customer-management/service";

describe("客户中心行级数据权限端到端下推验证 (Data Scope Integration)", () => {
  const mockTenantContext = {
    organizationId: "org-tenant-01",
    user: { id: "user-alice", email: "alice@example.com" },
    member: { id: "mem-alice", role: "sales_rep" },
    session: { id: "sess-01" },
  } as any;

  function createMockRepo(permissionsObj: any) {
    return {
      findMember: async (orgId: string, userId: string) => ({
        id: userId === "user-super" ? "mem-super" : "mem-alice",
        organizationId: orgId,
        userId: userId,
        role: userId === "user-super" ? "owner" : "sales_rep",
        createdAt: new Date(),
      }),
      findOrganizationRoles: async (orgId: string, roleNames: string[]) => {
        if (roleNames.includes("owner")) return [];
        return [
          {
            id: "role-01",
            organizationId: orgId,
            role: "sales_rep",
            name: "销售员",
            description: null,
            isSystem: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            permission: JSON.stringify(permissionsObj),
          },
        ];
      },
      listOrganizationRoles: async () => [],
    } as any;
  }

  const mockRepo = createMockRepo({
    statement: {
      customer: ["read", "create", "update"],
    },
    dataScopes: [
      {
        role: "sales_rep",
        resource: "customer",
        action: "read",
        scopeType: DataScope.SELF,
      },
    ],
    fieldPolicies: [],
  });

  test("1. '仅本人 (SELF)' 数据范围：下推 createdById = 当前用户ID，并组合 isDeleted: false", async () => {
    const topology = {
      userId: "user-alice",
      departmentId: "dept-sales-1",
      departmentTreeIds: ["dept-sales-1"],
    };

    const factory = new CaslAbilityFactory(mockRepo, customerCatalog);
    const ability = await factory.createPrismaAbilityForTenant(
      mockTenantContext,
      topology,
    );

    const accessibleWhere = getAccessibleWhere(
      ability,
      CustomerSubject,
      "read",
    );
    assert.deepEqual(accessibleWhere, {
      OR: [{ createdById: "user-alice" }],
    });

    let actualWhere: any = null;
    const mockPrisma = {
      customer: {
        count: async ({ where }: { where: any }) => {
          actualWhere = where;
          return 0;
        },
        findMany: async () => [],
      },
    };

    await CustomerService.listCustomers(mockPrisma as any, {}, accessibleWhere);

    assert.ok(actualWhere);
    assert.ok(Array.isArray(actualWhere.AND));
    assert.deepEqual(actualWhere.AND, [
      { isDeleted: false },
      { OR: [{ createdById: "user-alice" }] },
    ]);
  });

  test("2. '本部门 (DEPT)' 数据范围：下推 deptId = 当前部门ID", async () => {
    const deptRepo = createMockRepo({
      statement: {
        customer: ["read"],
      },
      dataScopes: [
        {
          role: "sales_rep",
          resource: "customer",
          action: "read",
          scopeType: DataScope.DEPT,
        },
      ],
      fieldPolicies: [],
    });

    const topology = {
      userId: "user-alice",
      departmentId: "dept-sales-north",
      departmentTreeIds: ["dept-sales-north"],
    };

    const factory = new CaslAbilityFactory(deptRepo, customerCatalog);
    const ability = await factory.createPrismaAbilityForTenant(
      mockTenantContext,
      topology,
    );

    const accessibleWhere = getAccessibleWhere(
      ability,
      CustomerSubject,
      "read",
    );
    assert.deepEqual(accessibleWhere, {
      OR: [{ deptId: "dept-sales-north" }],
    });
  });

  test("3. '部门及下级 (DEPT_TREE)' 数据范围：下推 deptId in (当前部门及所有子孙部门)", async () => {
    const treeRepo = createMockRepo({
      statement: {
        customer: ["read"],
      },
      dataScopes: [
        {
          role: "sales_rep",
          resource: "customer",
          action: "read",
          scopeType: DataScope.DEPT_TREE,
        },
      ],
      fieldPolicies: [],
    });

    const topology = {
      userId: "user-alice",
      departmentId: "dept-headquarter",
      departmentTreeIds: ["dept-headquarter", "dept-sub-1", "dept-sub-2"],
    };

    const factory = new CaslAbilityFactory(treeRepo, customerCatalog);
    const ability = await factory.createPrismaAbilityForTenant(
      mockTenantContext,
      topology,
    );

    const accessibleWhere = getAccessibleWhere(
      ability,
      CustomerSubject,
      "read",
    );
    assert.deepEqual(accessibleWhere, {
      OR: [
        {
          deptId: { in: ["dept-headquarter", "dept-sub-1", "dept-sub-2"] },
        },
      ],
    });
  });

  test("4. '全租户 (ALL)' 或 超级管理员 (owner)：无限制放行且过滤软删除", async () => {
    const ownerContext = {
      organizationId: "org-tenant-01",
      user: { id: "user-super" },
      member: { id: "mem-super", role: "owner" },
      session: { id: "sess-01" },
    } as any;

    const factory = new CaslAbilityFactory(mockRepo, customerCatalog);
    const ability = await factory.createPrismaAbilityForTenant(ownerContext, {
      userId: "user-super",
    });

    const accessibleWhere = getAccessibleWhere(
      ability,
      CustomerSubject,
      "read",
    );
    assert.deepEqual(accessibleWhere, {});

    let actualWhere: any = null;
    const mockPrisma = {
      customer: {
        count: async ({ where }: { where: any }) => {
          actualWhere = where;
          return 0;
        },
        findMany: async () => [],
      },
    };

    await CustomerService.listCustomers(mockPrisma as any, {}, accessibleWhere);

    assert.ok(actualWhere);
    assert.deepEqual(actualWhere.AND, [{ isDeleted: false }]);
  });
});
