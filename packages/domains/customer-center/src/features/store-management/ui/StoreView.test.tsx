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
import { StoreView } from "./StoreView";
import { storePageContract } from "../contract";
import type { CustomerListItem } from "../../customer-management/types";
import type { StoreListItem } from "../types";

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

const mockStores: StoreListItem[] = [
	{
		id: "store-001",
		name: "门店 A",
		customerId: "CUST-001",
		regionCode: "REGION_HD_01",
		deliveryPeriod: "MORNING",
		address: "延安路1号",
		contactPerson: "王五",
		contactPhone: "13800000003",
		status: "ACTIVE",
		customer: {
			name: "客户 A",
			status: "ACTIVE",
		},
	},
];

function renderStoreView(
	ui: React.ReactElement,
	permissions: {
		actions: readonly string[];
		fieldPolicies?: Readonly<Record<string, string>>;
	},
) {
	const snapshots = {
		subject: storePageContract.subject,
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

test("StoreView 正常渲染门店档案工作台与客户筛选下拉项", () => {
	const html = renderStoreView(
		<StoreView
			data={mockStores}
			total={1}
			customerOptions={mockCustomers}
		/>,
		{ actions: ["read"], fieldPolicies: {} },
	);

	assert.ok(html.includes("门店档案"), "应正常渲染门店档案工作台");
	assert.ok(html.includes("门店 A"), "应正常渲染门店列表数据");
});

test("StoreView 依据 export 权限动态控制【导出数据】按钮渲染", () => {
	const htmlWithExport = renderStoreView(
		<StoreView
			data={mockStores}
			total={1}
			customerOptions={mockCustomers}
		/>,
		{ actions: ["read", "export"], fieldPolicies: {} },
	);
	assert.match(htmlWithExport, /导出/, "拥有 export 权限时应渲染导出按钮");

	const htmlWithoutExport = renderStoreView(
		<StoreView
			data={mockStores}
			total={1}
			customerOptions={mockCustomers}
		/>,
		{ actions: ["read"], fieldPolicies: {} },
	);
	assert.doesNotMatch(
		htmlWithoutExport,
		/导出/,
		"无 export 权限时不应渲染导出按钮",
	);
});
