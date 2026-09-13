import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { TenantAbilityProvider } from "@base/authorization";
import { SalesOrderView } from "./SalesOrderView";
import { salesOrderPageContract, SalesOrderAction } from "../contract";
import type { SalesOrderListItem } from "../types";

const mockOrders: SalesOrderListItem[] = [
  {
    orderId: "SO-20260913-0001",
    customerCode: "CUST-001",
    storeCode: "STOR-001",
    customerName: "好味餐饮连锁",
    storeName: "朝阳一店",
    orderDate: "2026-09-13",
    deliveryDate: "2026-09-14",
    orderSource: "MANUAL",
    orderType: "NORMAL",
    lockStatus: "UNLOCKED",
    status: "DRAFT",
    fulfillmentStatus: "PENDING_SUMMARY",
    settlementStatus: "UNRECONCILED",
    totalAmount: 180.0,
    itemCount: 2,
    createdById: "USER-1",
    createdAt: "2026-09-13T08:00:00.000Z",
    updatedAt: "2026-09-13T08:00:00.000Z",
  },
];

function renderSalesOrderView(
  ui: React.ReactElement,
  permissions: {
    actions: readonly string[];
    fieldPolicies?: Readonly<Record<string, string>>;
  },
) {
  return renderToString(
    <TenantAbilityProvider
      snapshots={{
        subject: salesOrderPageContract.subject,
        actions: permissions.actions,
        fieldPolicies: permissions.fieldPolicies,
      }}
    >
      {ui}
    </TenantAbilityProvider>,
  );
}

function salesOrderViewProps(
  overrides: Partial<React.ComponentProps<typeof SalesOrderView>> = {},
) {
  return {
    initialOrders: mockOrders,
    customers: [],
    stores: [],
    ...overrides,
  };
}

test("SalesOrderView 依据 export 与 create 权限动态控制按钮渲染", () => {
  const htmlWithoutButtons = renderSalesOrderView(
    React.createElement(SalesOrderView, salesOrderViewProps()),
    { actions: ["read"], fieldPolicies: {} },
  );
  assert.ok(htmlWithoutButtons.includes("SO-20260913-0001"));
  assert.ok(htmlWithoutButtons.includes("好味餐饮连锁"));
  assert.doesNotMatch(
    htmlWithoutButtons,
    /导出/,
    "无 export 权限时不应渲染导出",
  );
  assert.doesNotMatch(
    htmlWithoutButtons,
    /新增/,
    "无 create 权限时不应渲染新建",
  );

  const htmlWithButtons = renderSalesOrderView(
    React.createElement(SalesOrderView, salesOrderViewProps()),
    { actions: ["read", "create", "export"], fieldPolicies: {} },
  );
  assert.match(htmlWithButtons, /导出/, "有 export 权限时应渲染导出按钮");
  assert.match(htmlWithButtons, /新增/, "有 create 权限时应渲染新建按钮");
});

test("SalesOrderView 与 salesOrderPageContract 契约 100% 对齐", () => {
  const contractActions = salesOrderPageContract.actions.map((a) => a.action);
  assert.deepEqual(contractActions, [
    "read",
    "create",
    "update",
    "delete",
    "export",
    SalesOrderAction.AUDIT,
    SalesOrderAction.CANCEL,
    SalesOrderAction.ONE_CLICK_SHIP,
    SalesOrderAction.ADD_FEE,
    SalesOrderAction.AUDIT_FEE,
  ]);

  const contractFields = (salesOrderPageContract.configurableFields || []).map(
    (f) => f.field,
  );
  assert.ok(contractFields.includes("orderId"), "契约必须包含销售订单号");
  assert.ok(contractFields.includes("customerCode"), "契约必须包含客户编码");
  assert.ok(contractFields.includes("storeCode"), "契约必须包含门店编码");
  assert.ok(contractFields.includes("totalAmount"), "契约必须包含总金额");

  const fullHtml = renderSalesOrderView(
    React.createElement(SalesOrderView, salesOrderViewProps()),
    { actions: contractActions, fieldPolicies: {} },
  );
  assert.match(fullHtml, /新增/, "具有 create 权限时必须渲染新增按钮");
  assert.match(fullHtml, /导出/, "具有 export 权限时必须渲染导出按钮");
  assert.match(
    fullHtml,
    /打开操作菜单/,
    "具有行级操作权限时必须渲染操作菜单触发器",
  );
});
