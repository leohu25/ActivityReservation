import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  assertTenantAccessGate,
  TenantContextError,
} from "@chenrun/auth";
import {
  CaslAbilityFactory,
  getAccessibleWhere,
  type AppPrismaAbility,
} from "@chenrun/authorization";
import { procurementCatalog } from "../index";
import type { ProcurementAction } from "../permissions";

function findMonorepoRoot(startDir: string): string {
  let cur = startDir;
  while (cur !== path.dirname(cur)) {
    if (fs.existsSync(path.join(cur, "pnpm-workspace.yaml"))) {
      return cur;
    }
    cur = path.dirname(cur);
  }
  return startDir;
}

test("工作台页面源码中彻底清除任何硬编码 mock 拓扑数据与 mock 部门字符串", () => {
  const root = findMonorepoRoot(process.cwd());
  const workbenchPagePath = path.resolve(
    root,
    "apps/tenant/src/app/(dashboard)/workbench/page.tsx",
  );
  assert.ok(fs.existsSync(workbenchPagePath), "工作台页面文件必须存在");

  const fileContent = fs.readFileSync(workbenchPagePath, "utf-8");

  // 验证不包含任何写死的 mock 部门字符串
  assert.equal(
    fileContent.includes("dept_procurement_east"),
    false,
    "工作台页面严禁出现写死的 dept_procurement_east mock 标识",
  );
  assert.equal(
    fileContent.includes("dept_procurement_east_sub"),
    false,
    "工作台页面严禁出现写死的 dept_procurement_east_sub mock 标识",
  );

  // 验证工作台接入了真实物理数据库查询与自驱拓扑装配
  assert.ok(
    fileContent.includes("resolveEmployeeTopology"),
    "工作台必须调用 resolveEmployeeTopology 自驱装配真实部门拓扑",
  );
  assert.ok(
    fileContent.includes("assertTenantAccessGate"),
    "工作台必须调用 assertTenantAccessGate 执行租户访问硬门禁",
  );
  assert.ok(
    fileContent.includes("employeeProfile.findUnique"),
    "工作台必须真实直连 Tenant DB 查询员工档案",
  );
});

test("租户准入门禁 (Tenant Access Gate) 严格 Fail-Closed 阻断非 ACTIVE 状态成员", () => {
  // 1. 正常在职员工放行
  assert.doesNotThrow(() => {
    assertTenantAccessGate({ status: "ACTIVE" });
  });

  // 2. 档案不存在拦截
  assert.throws(
    () => assertTenantAccessGate(null),
    (err: unknown) =>
      err instanceof TenantContextError &&
      err.code === "EMPLOYEE_PROFILE_NOT_FOUND",
  );

  // 3. 停用 (SUSPENDED) 严格拦截
  assert.throws(
    () => assertTenantAccessGate({ status: "SUSPENDED" }),
    (err: unknown) =>
      err instanceof TenantContextError &&
      err.code === "EMPLOYEE_SUSPENDED",
  );

  // 4. 离职 (TERMINATED) 严格拦截
  assert.throws(
    () => assertTenantAccessGate({ status: "TERMINATED" }),
    (err: unknown) =>
      err instanceof TenantContextError &&
      err.code === "EMPLOYEE_TERMINATED",
  );

  // 5. 待激活 (INVITED) 或其他异常状态拦截
  assert.throws(
    () => assertTenantAccessGate({ status: "INVITED" }),
    (err: unknown) =>
      err instanceof TenantContextError &&
      err.code === "EMPLOYEE_NOT_ACTIVE",
  );
});

test("员工调换部门后，CASL accessibleBy 数据库下推条件立即由旧部门切换为新部门拓扑", async () => {
  const fakeRepo = {
    async findMember(orgId: string, userId: string) {
      return {
        id: "mem_buyer_1",
        organizationId: orgId,
        userId: userId,
        role: "buyer",
        createdAt: new Date(),
      };
    },
    async findTenantDatabase() {
      return null;
    },
    async listRoles() {
      return [];
    },
    async findOrganizationRoles() {
      return [];
    },
    async listOrganizationRoles() {
      return [];
    },
    async upsertOrganizationRole() {
      return {
        id: "1",
        organizationId: "org_test",
        role: "buyer",
        permission: "{}",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    async deleteOrganizationRole() {},
  };

  const factory = new CaslAbilityFactory(fakeRepo, procurementCatalog, {
    staticRolePermissions: {
      buyer: {
        "procurement.order": ["read", "create"],
      },
    },
  });

  const tenantCtx = {
    organizationId: "org_test",
    user: { id: "usr_buyer_1", email: "buyer@chenrun.com" },
    session: {
      id: "sess_1",
      userId: "usr_buyer_1",
      activeOrganizationId: "org_test",
      expiresAt: new Date("2099-01-01"),
    },
    member: {
      id: "mem_buyer_1",
      organizationId: "org_test",
      userId: "usr_buyer_1",
      role: "buyer",
      createdAt: new Date(),
    },
    database: {
      id: "db_test",
      organizationId: "org_test",
      clusterCode: "local",
      databaseName: "tenant_test",
      secretRef: "secret/test",
      schemaVersion: "1",
      status: "ACTIVE" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  // 场景 A: 员工处于“华东采购一部 (dept_east_1)”
  const oldTopology = {
    userId: "usr_buyer_1",
    departmentId: "dept_east_1",
    departmentTreeIds: ["dept_east_1"],
  };

  const abilityBefore = (await factory.createPrismaAbilityForTenant(
    tenantCtx,
    oldTopology,
    {
      dataScopes: [
        {
          role: "buyer",
          resource: "procurement.order",
          action: "read",
          scopeType: "DEPT",
        },
      ],
    },
  )) as AppPrismaAbility<ProcurementAction, "PurchaseOrder">;

  const whereBefore = getAccessibleWhere(
    abilityBefore,
    "PurchaseOrder",
    "read",
  ) as Record<string, unknown>;

  // 验证变更前仅包含旧部门
  assert.deepEqual(whereBefore, {
    OR: [{ deptId: "dept_east_1" }],
  });

  // 场景 B: 组织人事调动 —— 员工调动至“华南采购中心 (dept_south_root)”及其子部门
  const newTopology = {
    userId: "usr_buyer_1",
    departmentId: "dept_south_root",
    departmentTreeIds: ["dept_south_root", "dept_south_sub_1", "dept_south_sub_2"],
  };

  const abilityAfter = (await factory.createPrismaAbilityForTenant(
    tenantCtx,
    newTopology,
    {
      dataScopes: [
        {
          role: "buyer",
          resource: "procurement.order",
          action: "read",
          scopeType: "DEPT_TREE",
        },
      ],
    },
  )) as AppPrismaAbility<ProcurementAction, "PurchaseOrder">;

  const whereAfter = getAccessibleWhere(
    abilityAfter,
    "PurchaseOrder",
    "read",
  ) as Record<string, unknown>;

  // 验证调部门后下推 SQL Where 立即切换为新部门拓扑树，且彻底不再包含旧部门 dept_east_1
  assert.deepEqual(whereAfter, {
    OR: [
      {
        deptId: {
          in: ["dept_south_root", "dept_south_sub_1", "dept_south_sub_2"],
        },
      },
    ],
  });
  assert.ok(
    !JSON.stringify(whereAfter).includes("dept_east_1"),
    "调部门后下推条件绝不能残留旧部门 ID",
  );
});
