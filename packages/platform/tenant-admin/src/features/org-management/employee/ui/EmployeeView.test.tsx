import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import {
  TenantAbilityProvider,
  createAbilityFromSnapshot,
} from "@base/authorization";
import { UiAbilityProvider } from "@base/ui";
import { EmployeeView } from "./EmployeeView";
import { EmployeeSubject } from "../contract";
import type { EmployeeItem } from "../types";
import type { DepartmentTreeNode } from "../../department/types";
import type { PositionItem } from "../../position/types";

const mockEmployees: EmployeeItem[] = [
  {
    id: "emp-1",
    memberId: "mem-1",
    userId: "usr-1",
    employeeNo: "EMP-001",
    name: "张三",
    loginAccount: "E0001",
    email: "zhangsan@company.com",
    phone: "13800000001",
    departmentId: "dept-1",
    departmentName: "研发中心",
    positionId: "pos-1",
    positionName: "前端架构师",
    managerEmployeeId: null,
    managerName: null,
    jobTitle: "资深工程师",
    roles: ["admin"],
    status: "ACTIVE",
    joinedAt: new Date(),
    createdAt: new Date(),
  },
];

const mockDeptTree: DepartmentTreeNode[] = [
  {
    id: "dept-1",
    name: "研发中心",
    code: "RD",
    parentId: null,
    leaderMemberId: null,
    leaderName: null,
    sort: 1,
    status: "ACTIVE",
    employeeCount: 1,
    children: [],
    createdAt: new Date(),
  },
];

const mockPositions: PositionItem[] = [
  {
    id: "pos-1",
    name: "前端架构师",
    code: "pos_fe_arch",
    description: "前端架构",
    sort: 1,
    status: "ACTIVE",
    employeeCount: 1,
    createdAt: new Date(),
  },
];

const mockRoles = [{ role: "admin", name: "系统管理员" }];

function renderEmployeeView(
  ui: React.ReactElement,
  permissions: {
    actions: readonly string[];
    fieldPolicies?: Readonly<Record<string, string>>;
  },
) {
  const snapshots = {
    subject: EmployeeSubject,
    actions: permissions.actions,
    fieldPolicies: permissions.fieldPolicies,
  };
  const ability = createAbilityFromSnapshot(snapshots);

  return renderToString(
    <TenantAbilityProvider snapshots={snapshots}>
      <UiAbilityProvider ability={ability}>
        <NuqsTestingAdapter>{ui}</NuqsTestingAdapter>
      </UiAbilityProvider>
    </TenantAbilityProvider>,
  );
}

test("EmployeeView: 正常渲染左侧部门树与右侧员工工作台", () => {
  const html = renderEmployeeView(
    <EmployeeView
      data={mockEmployees}
      total={1}
      departmentTree={mockDeptTree}
      positions={mockPositions}
      availableRoles={mockRoles}
    />,
    { actions: ["read"], fieldPolicies: {} },
  );

  assert.ok(html.includes("部门架构过滤"), "应渲染左侧部门架构过滤树");
  assert.ok(html.includes("企业员工档案"), "应渲染员工档案工作台标题");
  assert.ok(html.includes("张三"), "应渲染员工姓名");
  assert.ok(html.includes("EMP-001"), "应渲染员工工号");
  assert.ok(html.includes("研发中心"), "应渲染部门名称");
});

test("EmployeeView: 具备 update/toggleStatus 权限时渲染停用操作按钮", () => {
  const htmlWithUpdate = renderEmployeeView(
    <EmployeeView
      data={mockEmployees}
      total={1}
      departmentTree={mockDeptTree}
      positions={mockPositions}
      availableRoles={mockRoles}
    />,
    { actions: ["read", "update"], fieldPolicies: {} },
  );
  assert.match(htmlWithUpdate, /停用/);
});

test("EmployeeView: 权限感知控制新建员工按钮显隐", () => {
  const htmlWithCreate = renderEmployeeView(
    <EmployeeView
      data={mockEmployees}
      total={1}
      departmentTree={mockDeptTree}
      positions={mockPositions}
      availableRoles={mockRoles}
    />,
    { actions: ["read", "create"], fieldPolicies: {} },
  );
  assert.match(htmlWithCreate, /新建员工/);

  const htmlWithoutCreate = renderEmployeeView(
    <EmployeeView
      data={mockEmployees}
      total={1}
      departmentTree={mockDeptTree}
      positions={mockPositions}
      availableRoles={mockRoles}
    />,
    { actions: ["read"], fieldPolicies: {} },
  );
  assert.doesNotMatch(htmlWithoutCreate, /新建员工/);
});
