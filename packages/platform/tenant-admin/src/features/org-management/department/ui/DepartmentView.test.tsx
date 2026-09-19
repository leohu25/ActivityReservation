import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { createAbilityFromSnapshot } from "@base/authorization";
import { UiAbilityProvider } from "@base/ui";
import { DepartmentView } from "./DepartmentView";
import { DepartmentSubject } from "../contract";
import type { DepartmentTreeNode } from "../types";

const mockTree: DepartmentTreeNode[] = [
  {
    id: "dept-1",
    name: "总经办",
    code: "CEO_OFFICE",
    parentId: null,
    leaderMemberId: "mem-1",
    leaderName: "张总",
    sort: 1,
    status: "ACTIVE",
    employeeCount: 3,
    createdAt: new Date(),
    children: [
      {
        id: "dept-2",
        name: "研发中心",
        code: "DEV_CENTER",
        parentId: "dept-1",
        leaderMemberId: "mem-2",
        leaderName: "李架构师",
        sort: 2,
        status: "ACTIVE",
        employeeCount: 15,
        createdAt: new Date(),
        children: [],
      },
    ],
  },
];

function renderDepartmentView(
  ui: React.ReactElement,
  permissions: {
    actions: readonly string[];
    fieldPolicies?: Readonly<Record<string, string>>;
  },
) {
  const snapshots = {
    subject: DepartmentSubject,
    actions: permissions.actions,
    fieldPolicies: permissions.fieldPolicies,
  };
  const ability = createAbilityFromSnapshot(snapshots);

  return renderToString(
    <UiAbilityProvider ability={ability}>
      <NuqsTestingAdapter>{ui}</NuqsTestingAdapter>
    </UiAbilityProvider>,
  );
}

describe("DepartmentView", () => {
  it("渲染左侧部门树与右侧部门工作台", () => {
    const html = renderDepartmentView(<DepartmentView data={mockTree} />, {
      actions: ["read"],
    });

    assert.ok(html.includes("部门组织拓扑"), "应渲染左侧部门组织拓扑树");
    assert.ok(html.includes("部门档案列表"), "应渲染右侧部门档案列表");
    assert.ok(html.includes("总经办"), "应渲染总经办");
    assert.ok(html.includes("研发中心"), "应渲染研发中心");
    assert.ok(html.includes("CEO_OFFICE"), "应渲染部门编码");
    assert.ok(html.includes("张总"), "应渲染负责人名称");
  });

  it("无 create 权限时隐藏新建部门按钮", () => {
    const htmlWithoutCreate = renderDepartmentView(
      <DepartmentView data={mockTree} />,
      { actions: ["read"] },
    );
    assert.doesNotMatch(htmlWithoutCreate, /新建部门/);

    const htmlWithCreate = renderDepartmentView(
      <DepartmentView data={mockTree} />,
      { actions: ["read", "create"] },
    );
    assert.match(htmlWithCreate, /新建部门/);
  });
});
