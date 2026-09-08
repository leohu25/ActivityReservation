import assert from "node:assert/strict";
import test from "node:test";
import { createMongoAbility } from "@casl/ability";
import type { TenantContext } from "@chenrun/auth";
import type {
  AuthorizationRepository,
  OrganizationMemberRecord,
  OrganizationRoleRecord,
} from "@chenrun/db-control";
import { AbilityFactoryError, CaslAbilityFactory } from "./ability-factory";
import { createPermissionCatalog, PermissionCatalogError } from "./catalog";
import { createServerAbilityAdapter } from "./server";

const orderPermission = {
  resource: "test.order",
  subject: "TestOrder",
  actions: ["read", "create", "audit"],
} as const;
const catalog = createPermissionCatalog([orderPermission] as const);
const serverAuthorization = createServerAbilityAdapter(catalog);
const now = new Date("2026-01-01T00:00:00.000Z");
const member: OrganizationMemberRecord = {
  id: "member-1",
  organizationId: "org-1",
  userId: "user-1",
  role: "reader,creator",
  createdAt: now,
};
const context: TenantContext = {
  user: { id: "user-1", email: "user@example.test" },
  session: {
    id: "session-1",
    userId: "user-1",
    activeOrganizationId: "org-1",
    expiresAt: new Date("2030-01-01T00:00:00.000Z"),
  },
  organizationId: "org-1",
  member,
  database: {
    id: "db-1",
    organizationId: "org-1",
    clusterCode: "local",
    databaseName: "tenant_1",
    secretRef: "secret/1",
    schemaVersion: "1",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  },
};

function role(roleName: string, permission: unknown): OrganizationRoleRecord {
  return {
    id: `role-${roleName}`,
    organizationId: "org-1",
    role: roleName,
    permission:
      typeof permission === "string" ? permission : JSON.stringify(permission),
    createdAt: now,
    updatedAt: now,
  };
}

function repository(
  roles: OrganizationRoleRecord[],
  currentMember: OrganizationMemberRecord = member,
): AuthorizationRepository {
  return {
    async findMember() {
      return currentMember;
    },
    async findOrganizationRoles() {
      return roles;
    },
  };
}

test("catalog rejects duplicate resources and actions", () => {
  assert.throws(
    () => createPermissionCatalog([orderPermission, orderPermission] as const),
    PermissionCatalogError,
  );
  assert.throws(
    () =>
      createPermissionCatalog([
        { resource: "x", subject: "X", actions: ["read", "read"] },
      ] as const),
    PermissionCatalogError,
  );
});

test("empty and unknown roles deny by default", async () => {
  const ability = await new CaslAbilityFactory(
    repository([]),
    catalog,
  ).createForTenant(context);
  assert.equal(ability.can("read", orderPermission.subject), false);
});

test("multiple Better Auth roles compile to a CASL permission union", async () => {
  const ability = await new CaslAbilityFactory(
    repository([
      role("reader", { [orderPermission.resource]: ["read"] }),
      role("creator", { [orderPermission.resource]: ["create"] }),
    ]),
    catalog,
  ).createForTenant(context);

  assert.equal(ability.can("read", orderPermission.subject), true);
  assert.equal(ability.can("create", orderPermission.subject), true);
  assert.equal(ability.can("audit", orderPermission.subject), false);
});

test("built-in owner and admin application permissions compile to CASL", async () => {
  for (const builtInRole of ["owner", "admin"]) {
    const builtInMember = { ...member, role: builtInRole };
    const builtInContext = { ...context, member: builtInMember };
    const ability = await new CaslAbilityFactory(
      repository([], builtInMember),
      catalog,
      {
        staticRolePermissions: {
          [builtInRole]: {
            [orderPermission.resource]: orderPermission.actions,
          },
        },
      },
    ).createForTenant(builtInContext);

    assert.equal(ability.can("read", orderPermission.subject), true);
    assert.equal(ability.can("audit", orderPermission.subject), true);
  }
});

test("malformed, unknown and cross-organization role data fail closed", async () => {
  await assert.rejects(
    new CaslAbilityFactory(
      repository([role("reader", "{")]),
      catalog,
    ).createForTenant(context),
    AbilityFactoryError,
  );
  await assert.rejects(
    new CaslAbilityFactory(
      repository([role("reader", { unknown: ["read"] })]),
      catalog,
    ).createForTenant(context),
    AbilityFactoryError,
  );
  await assert.rejects(
    new CaslAbilityFactory(
      repository([{ ...role("reader", {}), organizationId: "org-2" }]),
      catalog,
    ).createForTenant(context),
    AbilityFactoryError,
  );
});

test("server guard and decorator-first wrapper require CASL ability", async () => {
  const ability = createMongoAbility<
    [(typeof orderPermission.actions)[number], typeof orderPermission.subject]
  >([{ action: "read", subject: orderPermission.subject }]);
  assert.doesNotThrow(() =>
    serverAuthorization.assertAbility(ability, "read", orderPermission.subject),
  );
  assert.throws(() =>
    serverAuthorization.assertAbility(
      ability,
      "audit",
      orderPermission.subject,
    ),
  );
  assert.throws(() =>
    serverAuthorization.assertAbility(
      undefined,
      "read",
      orderPermission.subject,
    ),
  );

  const secured = serverAuthorization.RequireAbility(
    "read",
    orderPermission.subject,
    async (_invocation, id: string) => id,
  );
  assert.equal(await secured({ ability }, "order-1"), "order-1");
  await assert.rejects(secured(undefined, "order-1"));
});

test("catalog 支持 Scopes 与 Fields 自描述元数据与 toBetterAuthStatement 导出", () => {
  const customDef = {
    resource: "finance.invoice",
    subject: "Invoice",
    label: "发票管理",
    actions: ["read", "issue"] as const,
    fields: ["invoiceNo", "amount", "taxRate"],
    actionMetadata: {
      read: {
        scopes: ["SELF", "DEPT"] as const,
        fields: ["invoiceNo", "amount", "taxRate"],
      },
      issue: {
        fields: ["amount", "taxRate"],
      },
    },
  } as const;

  const customCatalog = createPermissionCatalog([customDef] as const);

  // 1. 获取显式声明的 scopes 与 fields
  assert.deepEqual(customCatalog.getActionScopes("finance.invoice", "read"), [
    "SELF",
    "DEPT",
  ]);
  assert.deepEqual(customCatalog.getActionFields("finance.invoice", "read"), [
    "invoiceNo",
    "amount",
    "taxRate",
  ]);

  // 2. 未声明特定 scopes 时，安全回退到默认四种常用范围
  assert.deepEqual(customCatalog.getActionScopes("finance.invoice", "issue"), [
    "SELF",
    "DEPT",
    "DEPT_TREE",
    "ALL",
  ]);
  assert.deepEqual(customCatalog.getActionFields("finance.invoice", "issue"), [
    "amount",
    "taxRate",
  ]);

  // 3. 自动转换 Better Auth 语句
  const baStatement = customCatalog.toBetterAuthStatement();
  assert.deepEqual(baStatement, {
    "finance.invoice": ["read", "issue"],
  });
});
