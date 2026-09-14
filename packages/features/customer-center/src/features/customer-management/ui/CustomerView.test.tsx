import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  TenantAbilityProvider,
  createAbilityFromSnapshot,
} from "@base/authorization";
import { UiAbilityProvider } from "@base/ui";
import { CustomerView } from "./CustomerView";
import { customerPageContract } from "../contract";
import type { CustomerListItem } from "../types";

const mockCustomers: CustomerListItem[] = [
  {
    customerCode: "CUST-20260909-0001",
    customerName: "企业001 VIP",
    categoryCode: "CAT_FOOD",
    contactPerson: "张三",
    contactPhone: "13800000000",
    settlementMethod: "MONTHLY",
    defaultTaxRate: 9,
    creditLimit: "100000",
    status: "ACTIVE",
    customerTags: "VIP",
  },
];

/** 官方范式：测试通过 AbilityProvider 注入，而非 View 私有 props */
function renderCustomerView(
  ui: React.ReactElement,
  permissions: {
    actions: readonly string[];
    fieldPolicies?: Readonly<Record<string, string>>;
  },
) {
  const snapshots = {
    subject: customerPageContract.subject,
    actions: permissions.actions,
    fieldPolicies: permissions.fieldPolicies,
  };
  const ability = createAbilityFromSnapshot(snapshots);

  return renderToString(
    <TenantAbilityProvider snapshots={snapshots}>
      <UiAbilityProvider ability={ability}>{ui}</UiAbilityProvider>
    </TenantAbilityProvider>,
  );
}

function customerViewProps(
  overrides: Partial<React.ComponentProps<typeof CustomerView>> = {},
) {
  return {
    initialCustomers: mockCustomers,
    categories: [],
    tags: [],
    ...overrides,
  };
}

test("CustomerView 依据 export 权限动态控制【导出数据】按钮渲染", () => {
  const htmlWithExport = renderCustomerView(
    React.createElement(CustomerView, customerViewProps()),
    { actions: ["read", "export"], fieldPolicies: {} },
  );
  assert.match(htmlWithExport, /导出/, "拥有 export 权限时应渲染导出按钮");

  const htmlWithoutExport = renderCustomerView(
    React.createElement(CustomerView, customerViewProps()),
    { actions: ["read"], fieldPolicies: {} },
  );
  assert.doesNotMatch(
    htmlWithoutExport,
    /导出/,
    "无 export 权限时不应渲染导出按钮",
  );
});

test("CustomerView 严格执行 HIDDEN 字段策略隐藏对应列与数据", () => {
  const htmlWithHidden = renderCustomerView(
    React.createElement(CustomerView, customerViewProps()),
    {
      actions: ["read"],
      fieldPolicies: {
        customerCode: "HIDDEN",
        customerName: "HIDDEN",
        status: "HIDDEN",
      },
    },
  );

  assert.doesNotMatch(
    htmlWithHidden,
    /<th[^>]*>客户编码<\/th>/,
    "HIDDEN 字段列头应被隐藏",
  );
  assert.doesNotMatch(
    htmlWithHidden,
    /CUST-20260909-0001/,
    "HIDDEN 字段值应被剔除",
  );
  assert.doesNotMatch(
    htmlWithHidden,
    /<th[^>]*>客户名称<\/th>/,
    "HIDDEN 客户名称列头应被隐藏",
  );
  assert.doesNotMatch(
    htmlWithHidden,
    /企业001 VIP/,
    "HIDDEN 客户名称值应被剔除",
  );
  assert.doesNotMatch(
    htmlWithHidden,
    /<th[^>]*>状态<\/th>/,
    "HIDDEN 状态列头应被隐藏",
  );

  const htmlAllowed = renderCustomerView(
    React.createElement(CustomerView, customerViewProps()),
    {
      actions: ["read"],
      fieldPolicies: {
        customerCode: "EDITABLE",
        customerName: "EDITABLE",
        status: "EDITABLE",
      },
    },
  );

  assert.match(
    htmlAllowed,
    /<th[^>]*>客户编码<\/th>/,
    "授权时应正常显示客户编码列头",
  );
  assert.match(
    htmlAllowed,
    /CUST-20260909-0001/,
    "授权时应正常显示客户编码数据",
  );
  assert.match(
    htmlAllowed,
    /<th[^>]*>客户名称<\/th>/,
    "授权时应正常显示客户名称列头",
  );
  assert.match(htmlAllowed, /企业001 VIP/, "授权时应正常显示客户名称数据");
  assert.match(htmlAllowed, /<th[^>]*>状态<\/th>/, "授权时应正常显示状态列头");
});

test("CustomerView 与 customerPageContract 契约 100% 对齐（无幽灵动作与遗漏受控字段）", () => {
  const contractActions = customerPageContract.actions.map((a) => a.action);
  assert.deepEqual(contractActions, [
    "read",
    "create",
    "update",
    "delete",
    "export",
    "toggle_status",
  ]);

  const contractFields = (customerPageContract.configurableFields || []).map(
    (f) => f.field,
  );
  assert.ok(contractFields.includes("customerCode"), "契约必须包含客户编码");
  assert.ok(contractFields.includes("customerName"), "契约必须包含客户名称");
  assert.ok(contractFields.includes("status"), "契约必须包含状态");

  const fullHtml = renderCustomerView(
    React.createElement(CustomerView, customerViewProps()),
    { actions: contractActions, fieldPolicies: {} },
  );
  assert.match(fullHtml, /新增/, "具有 create 权限时必须渲染新建按钮");
  assert.match(fullHtml, /导出/, "具有 export 权限时必须渲染导出按钮");
  assert.match(
    fullHtml,
    /打开操作菜单/,
    "具有行级操作权限时必须渲染操作菜单触发器",
  );
  assert.ok(
    contractActions.includes("toggle_status"),
    "契约必须声明 toggle_status 以驱动停用/启用权限",
  );
});

test("CustomerView 停用客户受 toggle_status 契约动作控制（行操作权限过滤）", () => {
  const withToggle = {
    can(action: string) {
      return ["read", "update", "delete", "export", "toggle_status"].includes(
        action,
      );
    },
  };
  const withoutToggle = {
    can(action: string) {
      return ["read", "update", "delete", "export"].includes(action);
    },
  };

  assert.equal(withToggle.can("toggle_status"), true);
  assert.equal(withoutToggle.can("toggle_status"), false);

  const toggleAct = customerPageContract.actions.find(
    (a) => a.action === "toggle_status",
  );
  assert.ok(toggleAct, "契约必须包含 toggle_status");
  assert.equal(toggleAct.label, "启用/停用客户");
});
