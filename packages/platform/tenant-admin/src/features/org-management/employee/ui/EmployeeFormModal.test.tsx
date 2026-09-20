import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { UiAbilityProvider } from "@base/ui";
import { EmployeeFormModal } from "./EmployeeFormModal";
import type { EmployeeItem } from "../types";
import type { PositionItem } from "../../position/types";

const mockDepts = [
  { id: "dept-1", name: "研发中心", depth: 0 },
  { id: "dept-2", name: "前端开发组", depth: 1 },
];

const mockPositions: PositionItem[] = [
  {
    id: "pos-1",
    name: "前端架构师",
    code: "pos_fe_arch",
    description: "前端架构演进",
    sort: 1,
    status: "ACTIVE",
    employeeCount: 1,
    createdAt: new Date(),
  },
];

const mockRoles = [
  { role: "admin", name: "系统管理员" },
  { role: "member", name: "标准成员" },
];

const mockEmployee: EmployeeItem = {
  id: "emp-1",
  memberId: "mem-1",
  userId: "usr-1",
  employeeNo: "CR-0089",
  name: "王小明",
  email: "wang@company.com",
  departmentId: "dept-1",
  departmentName: "研发中心",
  positionId: "pos-1",
  positionName: "前端架构师",
  managerEmployeeId: null,
  managerName: null,
  jobTitle: "高级开发工程师",
  roles: ["admin", "member"],
  status: "ACTIVE",
  joinedAt: new Date(),
  createdAt: new Date(),
};

test("EmployeeFormModal [新建模式]: 渲染新建员工标题、必填字段与初始密码", () => {
  const html = renderToString(
    <EmployeeFormModal
      open={true}
      inline={true}
      mode="create"
      record={null}
      onClose={() => {}}
      flatDepts={mockDepts}
      positions={mockPositions}
      availableRoles={mockRoles}
    />,
  );

  assert.match(html, /新建员工档案/);
  assert.match(html, /员工姓名/);
  assert.match(html, /登录邮箱/);
  assert.match(html, /归属部门/);
  assert.match(html, /员工证件头像/);
  assert.match(html, /初始登录密码/);
  assert.match(html, /立即创建并入职/);
  assert.match(html, /分配系统业务角色/);
});

test("EmployeeFormModal [编辑模式]: 回填员工档案并锁定账号邮箱", () => {
  const html = renderToString(
    <EmployeeFormModal
      open={true}
      inline={true}
      mode="edit"
      record={mockEmployee}
      onClose={() => {}}
      flatDepts={mockDepts}
      positions={mockPositions}
      availableRoles={mockRoles}
    />,
  );

  assert.match(html, /编辑员工: 王小明/);
  assert.match(html, /wang@company.com/);
  assert.match(html, /CR-0089/);
  assert.match(html, /归属部门/);
  assert.match(html, /员工证件头像/);
  assert.match(html, /保存修改/);
});

test("EmployeeFormModal [查看模式]: 只读呈现与关闭按钮", () => {
  const html = renderToString(
    <EmployeeFormModal
      open={true}
      inline={true}
      mode="view"
      record={mockEmployee}
      onClose={() => {}}
      flatDepts={mockDepts}
      positions={mockPositions}
      availableRoles={mockRoles}
    />,
  );

  assert.match(html, /员工详情: 王小明/);
  assert.match(html, /关闭/);
});
