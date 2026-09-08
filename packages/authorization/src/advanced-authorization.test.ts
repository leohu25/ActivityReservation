import assert from "node:assert/strict";
import test from "node:test";
import type { TenantContext } from "@chenrun/auth";
import type {
  AuthorizationRepository,
  OrganizationMemberRecord,
  OrganizationRoleRecord,
} from "@chenrun/db-control";
import { CaslAbilityFactory } from "./ability-factory";
import { createPermissionCatalog } from "./catalog";
import { getAccessibleWhere } from "./prisma-access";
import {
  getFieldMode,
  getReadableFields,
  getEditableFields,
} from "./field-policy";

const orderPermission = {
  resource: "procurement.order",
  subject: "PurchaseOrder",
  actions: ["read", "create", "update", "audit"],
} as const;

const catalog = createPermissionCatalog([orderPermission] as const);
const now = new Date("2026-01-01T00:00:00.000Z");

const member: OrganizationMemberRecord = {
  id: "member-po-1",
  organizationId: "org-po-1",
  userId: "user-po-1",
  role: "buyer",
  createdAt: now,
};

const context: TenantContext = {
  user: { id: "user-po-1", email: "buyer@example.test" },
  session: {
    id: "session-po-1",
    userId: "user-po-1",
    activeOrganizationId: "org-po-1",
    expiresAt: new Date("2030-01-01T00:00:00.000Z"),
  },
  organizationId: "org-po-1",
  member,
  database: {
    id: "db-po-1",
    organizationId: "org-po-1",
    clusterCode: "local",
    databaseName: "tenant_po_1",
    secretRef: "secret/po-1",
    schemaVersion: "1",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  },
};

function createMockRepository(
  roles: OrganizationRoleRecord[],
): AuthorizationRepository {
  return {
    async findMember() {
      return member;
    },
    async findOrganizationRoles() {
      return roles;
    },
  };
}

test("CaslAbilityFactory 整合生成带数据范围条件与字段限制的 PrismaAbility 并完成查询下推", async () => {
  const repo = createMockRepository([
    {
      id: "role-buyer",
      organizationId: "org-po-1",
      role: "buyer",
      permission: JSON.stringify({
        "procurement.order": ["read", "update"],
      }),
      createdAt: now,
      updatedAt: now,
    },
  ]);

  const factory = new CaslAbilityFactory(repo, catalog, {
    dataScopes: [
      {
        role: "buyer",
        resource: "procurement.order",
        scopeType: "DEPT_TREE",
      },
    ],
    fieldPolicies: [
      {
        role: "buyer",
        subject: "PurchaseOrder",
        field: "supplierName",
        access: "EDITABLE",
      },
      {
        role: "buyer",
        subject: "PurchaseOrder",
        field: "costPrice",
        access: "READONLY",
      },
      {
        role: "buyer",
        subject: "PurchaseOrder",
        field: "internalAuditLog",
        access: "HIDDEN",
      },
    ],
  });

  const topology = {
    userId: "user-po-1",
    departmentId: "dept_procurement",
    departmentTreeIds: ["dept_procurement", "dept_procurement_sub"],
  };

  const prismaAbility = await factory.createPrismaAbilityForTenant(
    context,
    topology,
  );

  // 1. 验证 Prisma where 条件直接下推生成
  const where = getAccessibleWhere(prismaAbility, "PurchaseOrder", "read");
  assert.deepEqual(where, {
    OR: [
      {
        deptId: {
          in: ["dept_procurement", "dept_procurement_sub"],
        },
      },
    ],
  });

  // 2. 验证字段三态推导
  assert.equal(
    getFieldMode(prismaAbility, "PurchaseOrder", "supplierName"),
    "EDITABLE",
  );
  assert.equal(
    getFieldMode(prismaAbility, "PurchaseOrder", "costPrice"),
    "READONLY",
  );
  assert.equal(
    getFieldMode(prismaAbility, "PurchaseOrder", "internalAuditLog"),
    "HIDDEN",
  );

  // 3. 验证读写字段集合
  const readable = getReadableFields(prismaAbility, "PurchaseOrder", [
    "supplierName",
    "costPrice",
    "internalAuditLog",
  ]);
  assert.deepEqual(readable.sort(), ["costPrice", "supplierName"]);

  const editable = getEditableFields(prismaAbility, "PurchaseOrder", [
    "supplierName",
    "costPrice",
    "internalAuditLog",
  ]);
  assert.deepEqual(editable, ["supplierName"]);
});

test("CaslAbilityFactory 隔离不同 Action 的数据范围，防止写操作被读范围越权放大", async () => {
  const repo = createMockRepository([
    {
      id: "role-buyer",
      organizationId: "org-po-1",
      role: "buyer",
      permission: JSON.stringify({
        "procurement.order": ["read", "update"],
      }),
      createdAt: now,
      updatedAt: now,
    },
  ]);

  const factory = new CaslAbilityFactory(repo, catalog, {
    dataScopes: [
      // read 动作授权整棵部门树
      {
        role: "buyer",
        resource: "procurement.order",
        action: "read",
        scopeType: "DEPT_TREE",
      },
      // update 动作严格收敛为仅本人
      {
        role: "buyer",
        resource: "procurement.order",
        action: "update",
        scopeType: "SELF",
      },
    ],
  });

  const topology = {
    userId: "user-po-1",
    departmentId: "dept_procurement",
    departmentTreeIds: ["dept_procurement", "dept_procurement_sub"],
  };

  const prismaAbility = await factory.createPrismaAbilityForTenant(
    context,
    topology,
  );

  // 验证 read 动作精确下推 DEPT_TREE 范围
  const readWhere = getAccessibleWhere(prismaAbility, "PurchaseOrder", "read");
  assert.deepEqual(readWhere, {
    OR: [
      {
        deptId: {
          in: ["dept_procurement", "dept_procurement_sub"],
        },
      },
    ],
  });

  // 验证 update 动作精确下推 SELF 范围，未被 read 的 DEPT_TREE 污染扩大
  const updateWhere = getAccessibleWhere(
    prismaAbility,
    "PurchaseOrder",
    "update",
  );
  assert.deepEqual(updateWhere, {
    OR: [
      {
        createdById: "user-po-1",
      },
    ],
  });
});

test("CaslAbilityFactory 自动解析角色持久化的四层权限 (statement + dataScopes + fieldPolicies)", async () => {
  const fullPayload = {
    statement: {
      "procurement.order": ["read", "create", "update"],
    },
    dataScopes: [
      {
        resource: "procurement.order",
        action: "read",
        scopeType: "DEPT",
      },
    ],
    fieldPolicies: [
      {
        subject: "PurchaseOrder",
        field: "costPrice",
        access: "READONLY",
      },
      {
        subject: "PurchaseOrder",
        field: "supplierName",
        access: "EDITABLE",
      },
    ],
  };

  const repo = createMockRepository([
    {
      id: "role-buyer-full",
      organizationId: "org-po-1",
      role: "buyer",
      permission: JSON.stringify(fullPayload),
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // 构建工厂时无需外部传参注入 dataScopes 或 fieldPolicies
  const factory = new CaslAbilityFactory(repo, catalog);

  const topology = {
    userId: "user-po-1",
    departmentId: "dept_procurement_east",
    departmentTreeIds: ["dept_procurement_east"],
  };

  const prismaAbility = await factory.createPrismaAbilityForTenant(
    context,
    topology,
  );

  // 1. 验证持久化中的 DEPT 数据范围自动生效
  const readWhere = getAccessibleWhere(prismaAbility, "PurchaseOrder", "read");
  assert.deepEqual(readWhere, {
    OR: [
      {
        deptId: "dept_procurement_east",
      },
    ],
  });

  // 2. 验证持久化中的字段策略自动生效
  assert.equal(
    getFieldMode(prismaAbility, "PurchaseOrder", "costPrice"),
    "READONLY",
  );
  assert.equal(
    getFieldMode(prismaAbility, "PurchaseOrder", "supplierName"),
    "EDITABLE",
  );
  assert.equal(
    getFieldMode(prismaAbility, "PurchaseOrder", "unknownSecret"),
    "HIDDEN",
  );
});
