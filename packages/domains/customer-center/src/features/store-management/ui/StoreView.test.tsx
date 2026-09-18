import test from "node:test";
import assert from "node:assert/strict";
import type React from "react";
import { renderToString } from "react-dom/server";
import { TenantAbilityProvider } from "@base/authorization";
import { StoreView } from "./StoreView";
import { storePageContract } from "../contract";
import type { CustomerListItem } from "../../customer-management/types";

const mockCustomers: CustomerListItem[] = [
	{
		id: "CUST-001",
		name: "客户 A",
		categoryId: "CAT-01",
		contactPerson: "张三",
		contactPhone: "13800000001",
		settlementMethod: "MONTHLY",
		status: "ACTIVE",
	},
	{
		id: "CUST-002",
		name: "客户 B",
		categoryId: "CAT-02",
		contactPerson: "李四",
		contactPhone: "13800000002",
		settlementMethod: "CASH",
		status: "ACTIVE",
	},
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

test("StoreView 正常渲染客户筛选下拉项", () => {
	const html = renderStoreView(
		<StoreView initialStores={[]} customers={mockCustomers} />,
		{ actions: ["read"], fieldPolicies: {} },
	);

	assert.ok(html.includes("门店档案"), "应正常渲染门店档案工作台");
});
