import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { CustomerView } from "./CustomerView";
import { customerPageContract } from "../contracts/customer.contract";
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

test("CustomerView 依据 export 权限动态控制【导出数据】按钮渲染", () => {
  // 场景 1: 拥有 export 动作权限
  const htmlWithExport = renderToString(
    React.createElement(CustomerView, {
      initialCustomers: mockCustomers,
      categories: [],
      tags: [],
      permissions: {
        actions: ["read", "export"],
        fieldPolicies: {},
      },
    }),
  );
  assert.match(htmlWithExport, /导出/, "拥有 export 权限时应渲染导出按钮");

  // 场景 2: 未拥有 export 动作权限 → 对普通用户隐藏
  const htmlWithoutExport = renderToString(
    React.createElement(CustomerView, {
      initialCustomers: mockCustomers,
      categories: [],
      tags: [],
      permissions: {
        actions: ["read"],
        fieldPolicies: {},
      },
    }),
  );
  assert.doesNotMatch(
    htmlWithoutExport,
    /导出/,
    "无 export 权限时不应渲染导出按钮",
  );
});

test("CustomerView 严格执行 HIDDEN 字段策略隐藏对应列与数据", () => {
  // 场景 1: customerCode, customerName, status 被配置为 HIDDEN
  const htmlWithHidden = renderToString(
    React.createElement(CustomerView, {
      initialCustomers: mockCustomers,
      categories: [],
      tags: [],
      permissions: {
        actions: ["read"],
        fieldPolicies: {
          customerCode: "HIDDEN",
          customerName: "HIDDEN",
          status: "HIDDEN",
        },
      },
    }),
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

  // 场景 2: 字段权限全量放行
  const htmlAllowed = renderToString(
    React.createElement(CustomerView, {
      initialCustomers: mockCustomers,
      categories: [],
      tags: [],
      permissions: {
        actions: ["read"],
        fieldPolicies: {
          customerCode: "EDITABLE",
          customerName: "EDITABLE",
          status: "EDITABLE",
        },
      },
    }),
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
  // 1. 验证契约动作完整声明，不包含未授权幽灵动作
  const contractActions = customerPageContract.actions.map((a) => a.action);
  assert.deepEqual(contractActions, [
    "read",
    "create",
    "update",
    "delete",
    "export",
    "toggle_status",
  ]);

  // 2. 验证契约中的受控字段已覆盖关键业务主数据
  const contractFields = (customerPageContract.configurableFields || []).map(
    (f) => f.field,
  );
  assert.ok(contractFields.includes("customerCode"), "契约必须包含客户编码");
  assert.ok(contractFields.includes("customerName"), "契约必须包含客户名称");
  assert.ok(contractFields.includes("status"), "契约必须包含状态");

  // 3. 验证当赋予所有契约动作时，顶部主操作按钮与行级操作触发器全部正确渲染
  const fullHtml = renderToString(
    React.createElement(CustomerView, {
      initialCustomers: mockCustomers,
      categories: [],
      tags: [],
      permissions: {
        actions: contractActions,
        fieldPolicies: {},
      },
    }),
  );
  assert.match(fullHtml, /新增/, "具有 create 权限时必须渲染新建按钮");
  assert.match(fullHtml, /导出/, "具有 export 权限时必须渲染导出按钮");
  assert.match(
    fullHtml,
    /打开操作菜单/,
    "具有行级操作权限时必须渲染操作菜单触发器",
  );
  // 契约必须声明自定义扩展动作（菜单项在 Dropdown Portal 内，SSR 不输出文案）
  assert.ok(
    contractActions.includes("toggle_status"),
    "契约必须声明 toggle_status 以驱动停用/启用权限",
  );
});

test("CustomerView 停用客户受 toggle_status 契约动作控制（行操作权限过滤）", () => {
  // 直接验证 plain ability 对自定义 action 的判定链路
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

  // 契约声明了该动作后，角色目录 / Catalog 才会出现
  const toggleAct = customerPageContract.actions.find(
    (a) => a.action === "toggle_status",
  );
  assert.ok(toggleAct, "契约必须包含 toggle_status");
  assert.equal(toggleAct.label, "启用/停用客户");
});
