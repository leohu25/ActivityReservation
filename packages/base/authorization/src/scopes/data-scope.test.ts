import test from "node:test";
import assert from "node:assert/strict";
import { FAIL_CLOSED_ID } from "@base/shared";
import {
  resolveDataScopeConditions,
  type RoleDataScopeConfig,
  type UserDepartmentTopology,
} from "./data-scope";

test("resolveDataScopeConditions 正确处理 SELF 模式（仅本人）", () => {
  const scopes: RoleDataScopeConfig[] = [
    {
      role: "buyer",
      resource: "procurement.order",
      scopeType: "SELF",
    },
  ];
  const topology: UserDepartmentTopology = {
    userId: "usr_123",
    departmentId: "dept_1",
  };

  const condition = resolveDataScopeConditions(scopes, topology);
  assert.deepEqual(condition, {
    createdById: "usr_123",
  });
});

test("resolveDataScopeConditions 在 SELF 模式下若 userId 为空时严格执行 Fail-Closed 兜底", () => {
  const scopes: RoleDataScopeConfig[] = [
    {
      role: "buyer",
      resource: "procurement.order",
      scopeType: "SELF",
    },
  ];
  const topology: UserDepartmentTopology = {
    userId: "",
  };

  const condition = resolveDataScopeConditions(scopes, topology);
  assert.deepEqual(condition, {
    createdById: FAIL_CLOSED_ID,
  });
});

test("resolveDataScopeConditions 正确处理 DEPT 模式（本部门）", () => {
  const scopes: RoleDataScopeConfig[] = [
    {
      role: "buyer",
      resource: "procurement.order",
      scopeType: "DEPT",
    },
  ];
  const topology: UserDepartmentTopology = {
    userId: "usr_123",
    departmentId: "dept_tech",
  };

  const condition = resolveDataScopeConditions(scopes, topology);
  assert.deepEqual(condition, {
    deptId: "dept_tech",
  });
});

test("resolveDataScopeConditions 在 DEPT 模式下若缺少 departmentId 则 Fail-Closed 拒绝", () => {
  const scopes: RoleDataScopeConfig[] = [
    {
      role: "buyer",
      resource: "procurement.order",
      scopeType: "DEPT",
    },
  ];
  const topology: UserDepartmentTopology = {
    userId: "usr_123",
    departmentId: null,
  };

  const condition = resolveDataScopeConditions(scopes, topology);
  assert.deepEqual(condition, {
    deptId: FAIL_CLOSED_ID,
  });
});

test("resolveDataScopeConditions 正确处理 DEPT_TREE 模式（本部门及下级所有部门）", () => {
  const scopes: RoleDataScopeConfig[] = [
    {
      role: "manager",
      resource: "procurement.order",
      scopeType: "DEPT_TREE",
    },
  ];
  const topology: UserDepartmentTopology = {
    userId: "usr_mgr",
    departmentId: "dept_root",
    departmentTreeIds: ["dept_root", "dept_sub1", "dept_sub2"],
  };

  const condition = resolveDataScopeConditions(scopes, topology);
  assert.deepEqual(condition, {
    deptId: { in: ["dept_root", "dept_sub1", "dept_sub2"] },
  });
});

test("resolveDataScopeConditions 在 DEPT_TREE 模式下若部门树为空则 Fail-Closed 拒绝", () => {
  const scopes: RoleDataScopeConfig[] = [
    {
      role: "manager",
      resource: "procurement.order",
      scopeType: "DEPT_TREE",
    },
  ];
  const topology: UserDepartmentTopology = {
    userId: "usr_mgr",
    departmentId: null,
    departmentTreeIds: [],
  };

  const condition = resolveDataScopeConditions(scopes, topology);
  assert.deepEqual(condition, {
    deptId: { in: [FAIL_CLOSED_ID] },
  });
});

test("resolveDataScopeConditions 正确处理 CUSTOM 自定义枚举部门模式", () => {
  const scopes: RoleDataScopeConfig[] = [
    {
      role: "auditor",
      resource: "procurement.order",
      scopeType: "CUSTOM",
      customDepartmentIds: ["dept_a", "dept_b"],
    },
  ];
  const topology: UserDepartmentTopology = {
    userId: "usr_auditor",
    departmentId: "dept_audit",
  };

  const condition = resolveDataScopeConditions(scopes, topology);
  assert.deepEqual(condition, {
    deptId: { in: ["dept_a", "dept_b"] },
  });
});

test("resolveDataScopeConditions 在 CUSTOM 模式下若枚举列表为空则 Fail-Closed 拒绝", () => {
  const scopes: RoleDataScopeConfig[] = [
    {
      role: "auditor",
      resource: "procurement.order",
      scopeType: "CUSTOM",
      customDepartmentIds: [],
    },
  ];
  const topology: UserDepartmentTopology = {
    userId: "usr_auditor",
    departmentId: "dept_audit",
  };

  const condition = resolveDataScopeConditions(scopes, topology);
  assert.deepEqual(condition, {
    deptId: { in: [FAIL_CLOSED_ID] },
  });
});

test("resolveDataScopeConditions 遇到 ALL 模式时返回 undefined（全量放行不加过滤）", () => {
  const scopes: RoleDataScopeConfig[] = [
    {
      role: "admin",
      resource: "procurement.order",
      scopeType: "ALL",
    },
  ];
  const topology: UserDepartmentTopology = {
    userId: "usr_admin",
  };

  const condition = resolveDataScopeConditions(scopes, topology);
  assert.equal(condition, undefined);
});

test("resolveDataScopeConditions 将多角色数据范围通过 OR 进行并集合并", () => {
  const scopes: RoleDataScopeConfig[] = [
    {
      role: "buyer",
      resource: "procurement.order",
      scopeType: "SELF",
    },
    {
      role: "special_auditor",
      resource: "procurement.order",
      scopeType: "CUSTOM",
      customDepartmentIds: ["dept_vip"],
    },
  ];
  const topology: UserDepartmentTopology = {
    userId: "usr_multi",
    departmentId: "dept_standard",
  };

  const condition = resolveDataScopeConditions(scopes, topology);
  assert.deepEqual(condition, {
    OR: [{ createdById: "usr_multi" }, { deptId: "dept_vip" }],
  });
});

test("resolveDataScopeConditions 支持自定义实体字段映射覆盖", () => {
  const scopes: RoleDataScopeConfig[] = [
    {
      role: "buyer",
      resource: "procurement.order",
      scopeType: "SELF",
    },
  ];
  const topology: UserDepartmentTopology = {
    userId: "usr_custom_field",
  };

  const condition = resolveDataScopeConditions(scopes, topology, {
    userIdField: "ownerId",
    departmentIdField: "teamId",
  });
  assert.deepEqual(condition, {
    ownerId: "usr_custom_field",
  });
});
