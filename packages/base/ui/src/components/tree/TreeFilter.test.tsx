import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  TreeFilter,
  TreeNav,
  type TreeNode,
} from "./TreeFilter";

const mockFilterNodes: TreeNode[] = [
  {
    id: "DEPT_01",
    name: "总经办",
    code: "EXEC",
    badge: 5,
    children: [
      {
        id: "DEPT_02",
        name: "综合行政部",
        code: "ADMIN",
        badge: 2,
        children: [
          {
            id: "DEPT_03",
            name: "后勤保障组",
            code: "LOGISTICS",
            badge: 1,
          },
        ],
      },
    ],
  },
  {
    id: "DEPT_10",
    name: "研发中心",
    code: "RD",
    badge: 12,
  },
];

const mockRoleNodes: TreeNode[] = [
  {
    id: "admin",
    name: "系统管理员",
    code: "admin",
    description: "具备租户全量系统管理权限",
    badge: "内置",
  },
  {
    id: "buyer",
    name: "采购主管",
    code: "buyer",
    description: "负责供应商与采购订单流转",
    badge: "业务",
  },
];

test("TreeFilter [全量渲染]: 渲染全部根项、子节点与搜索框", () => {
  const html = renderToString(
    <TreeFilter
      title="组织架构筛选"
      allLabel="所有部门"
      totalCount={18}
      nodes={mockFilterNodes}
      selectedId={null}
      onSelect={() => {}}
      showSearch={true}
    />,
  );

  assert.ok(html.includes("组织架构筛选"));
  assert.ok(html.includes("所有部门"));
  assert.ok(html.includes("总经办"));
  assert.ok(html.includes("综合行政部"));
  assert.ok(html.includes("后勤保障组"));
  assert.ok(html.includes("18"));
});

test("TreeFilter [深度搜索与祖先保全]: 搜索孙节点时保留并渲染祖先链", () => {
  const html = renderToString(
    <TreeFilter
      title="架构搜索"
      nodes={mockFilterNodes}
      selectedId={null}
      onSelect={() => {}}
      searchValue="后勤"
    />,
  );

  // 孙节点匹配：祖先“总经办”与“综合行政部”必须同时保留在渲染树中
  assert.ok(html.includes("总经办"), "匹配孙节点时父级总经办应保留在树中");
  assert.ok(
    html.includes("综合行政部"),
    "匹配孙节点时直接父级综合行政部应保留在树中",
  );
  assert.ok(html.includes("后勤保障组"), "目标孙节点应正常渲染");
  assert.ok(!html.includes("研发中心"), "不相关的研发中心分支应被过滤");
});

test("TreeFilter [角色导航主流模式]: 支持 showAll=false 与扁平角色导航", () => {
  const html = renderToString(
    <TreeNav
      title="选择配置角色"
      showAll={false}
      totalCount={2}
      nodes={mockRoleNodes}
      selectedId="admin"
      onSelect={() => {}}
      showSearch={true}
      searchPlaceholder="过滤角色..."
    />,
  );

  assert.ok(html.includes("选择配置角色"));
  assert.ok(!html.includes("全部"), "showAll=false 时不应渲染全部汇总项");
  assert.ok(html.includes("系统管理员"));
  assert.ok(html.includes("admin"));
  assert.ok(html.includes("采购主管"));
});

test("TreeFilter [级联开关]: 正确渲染包含子节点开关", () => {
  const html = renderToString(
    <TreeFilter
      nodes={mockFilterNodes}
      selectedId="DEPT_01"
      onSelect={() => {}}
      cascadeToggle={{
        checked: true,
        onChange: () => {},
        label: "包含下级所有部门",
      }}
    />,
  );

  assert.ok(html.includes("包含下级所有部门"));
});
