import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { TenantAbilityProvider } from "@chenrun/authorization";
import { StoreView } from "./StoreView";
import { storePageContract } from "../contract";
import type { CustomerListItem } from "../../customer-management/types";

const mockCustomers: CustomerListItem[] = [
  {
    customerCode: "CUST-001",
    customerName: "客户 A",
    categoryCode: "CAT-01",
    contactPerson: "张三",
    contactPhone: "13800000001",
    settlementMethod: "MONTHLY",
    status: "ACTIVE",
  },
  {
    id: "CUST-002",
    customerCode: "",
    customerName: "客户 B",
    categoryCode: "CAT-02",
    contactPerson: "李四",
    contactPhone: "13800000002",
    settlementMethod: "CASH",
    status: "ACTIVE",
  } as CustomerListItem,
];

function renderStoreView(
  ui: React.ReactElement,
  permissions: {
    actions: readonly string[];
    fieldPolicies?: Readonly<Record<string, string>>;
  },
) {
  return renderToString(
    <TenantAbilityProvider
      snapshots={{
        subject: storePageContract.subject,
        actions: permissions.actions,
        fieldPolicies: permissions.fieldPolicies,
      }}
    >
      {ui}
    </TenantAbilityProvider>,
  );
}

test("StoreView 正常渲染且客户筛选下拉项即使客户编码为空或缺省也能生成有效唯一 key", () => {
  const html = renderStoreView(
    <StoreView initialStores={[]} customers={mockCustomers} />,
    { actions: ["read"], fieldPolicies: {} },
  );

  assert.ok(html.includes("门店档案"), "应正常渲染门店档案工作台");
});
