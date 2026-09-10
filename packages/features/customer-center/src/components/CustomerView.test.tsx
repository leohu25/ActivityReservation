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
  assert.match(htmlWithExport, /导出数据/, "拥有 export 权限时应渲染导出按钮");

  // 场景 2: 未拥有 export 动作权限
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
    /导出数据/,
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
  assert.match(fullHtml, /新建客户/, "具有 create 权限时必须渲染新建按钮");
  assert.match(fullHtml, /导出数据/, "具有 export 权限时必须渲染导出按钮");
  assert.match(
    fullHtml,
    /打开操作菜单/,
    "具有行级操作权限时必须渲染操作菜单触发器",
  );
});
