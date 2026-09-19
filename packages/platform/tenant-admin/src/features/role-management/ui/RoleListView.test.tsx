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
import { RoleListView } from "./RoleListView";
import { RoleSubject } from "../contract";
import type { TenantRoleItem } from "../types";

const mockRoles: TenantRoleItem[] = [
  {
    id: "role-1",
    role: "admin",
    name: "系统管理员",
    description: "具备租户全量管理权限",
    isSystem: true,
    permissions: {
      statement: { "customer.customers": ["read", "create"] },
      dataScopes: [],
      fieldPolicies: [],
    },
    updatedAt: new Date(),
  },
  {
    id: "role-2",
    role: "custom_sales",
    name: "销售代表",
    description: "负责业务开拓",
    isSystem: false,
    permissions: {
      statement: {},
      dataScopes: [],
      fieldPolicies: [],
    },
    updatedAt: null,
  },
];

function renderRoleListView(
  ui: React.ReactElement,
  permissions: {
    actions: readonly string[];
    fieldPolicies?: Readonly<Record<string, string>>;
  },
) {
  const snapshots = {
    subject: RoleSubject,
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

test("RoleListView: 正常渲染企业角色管理工作台与角色列表", () => {
  const html = renderRoleListView(
    <RoleListView data={mockRoles} total={2} />,
    { actions: ["read"], fieldPolicies: {} },
  );

  assert.ok(html.includes("企业角色管理"), "应渲染角色管理标题");
  assert.ok(html.includes("系统管理员"), "应渲染角色名称");
  assert.ok(html.includes("admin"), "应渲染角色代码");
  assert.ok(html.includes("内置受保护"), "系统角色应渲染内置徽标");
  assert.ok(html.includes("销售代表"), "自定义角色应正常渲染");
  assert.ok(html.includes("自定义"), "自定义角色应渲染自定义徽标");
});

test("RoleListView: 权限感知与新建角色按钮控制", () => {
  const htmlWithCreate = renderRoleListView(
    <RoleListView data={mockRoles} total={2} />,
    { actions: ["read", "create"], fieldPolicies: {} },
  );
  assert.match(htmlWithCreate, /新建业务角色/);

  const htmlWithoutCreate = renderRoleListView(
    <RoleListView data={mockRoles} total={2} />,
    { actions: ["read"], fieldPolicies: {} },
  );
  assert.doesNotMatch(htmlWithoutCreate, /新建业务角色/);
});
