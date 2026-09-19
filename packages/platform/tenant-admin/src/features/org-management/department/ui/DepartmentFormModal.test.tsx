import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { DepartmentFormModal } from "./DepartmentFormModal";
import { createDepartmentSchema } from "../schema";
import type { DepartmentTreeNode } from "../types";

const mockParentOptions = [
  { id: "dept-1", name: "总经办", depth: 0 },
  { id: "dept-2", name: "技术研发部", depth: 1 },
];

const mockRecord: DepartmentTreeNode = {
  id: "dept-3",
  name: "前端开发组",
  code: "DEV_FRONTEND",
  parentId: "dept-2",
  leaderMemberId: null,
  leaderName: null,
  sort: 10,
  status: "ACTIVE",
  employeeCount: 8,
  children: [],
  createdAt: new Date("2026-01-01"),
};

test("DepartmentFormModal: create 模式渲染标题与创建字段，驱动 FormModal 规范", () => {
  const html = renderToString(
    <DepartmentFormModal
      open={true}
      mode="create"
      parentOptions={mockParentOptions}
      defaultParentId="dept-1"
      onClose={() => {}}
      inline={true}
    />,
  );

  assert.match(html, /新建部门节点/);
  assert.match(html, /部门名称/);
  assert.match(html, /部门编码/);
  assert.match(html, /上级部门/);
});

test("DepartmentFormModal: edit 模式回填既有部门数据", () => {
  const html = renderToString(
    <DepartmentFormModal
      open={true}
      mode="edit"
      record={mockRecord}
      parentOptions={mockParentOptions}
      onClose={() => {}}
      inline={true}
    />,
  );

  assert.match(html, /编辑部门: 前端开发组/);
  assert.match(html, /DEV_FRONTEND/);
  assert.match(html, /10/);
});

test("createDepartmentSchema: 验证必填字段与默认值拦截", () => {
  const invalid = createDepartmentSchema.safeParse({
    name: "",
    code: "",
  });
  assert.equal(invalid.success, false);

  const valid = createDepartmentSchema.safeParse({
    name: "财务中心",
    code: "FIN_CENTER",
  });
  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.data.sort, 0);
    assert.equal(valid.data.parentId, "");
  }
});
