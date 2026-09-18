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
import { QuoteView } from "./QuoteView";
import { quotePageContract } from "../contract";
import type { QuoteListItem } from "../types";

const mockQuotes: QuoteListItem[] = [
	{
		id: "quote-001",
		quoteNo: "QU-2026-0001",
		displayName: "春季阶梯报价",
		customerId: "cust-001",
		customer: { id: "cust-001", name: "绿叶连锁" },
		quoteDate: "2026-03-30",
		effectiveDate: "2026-04-01",
		status: "ACTIVE",
		itemCount: 3,
	},
];

function renderQuoteView(
	ui: React.ReactElement,
	permissions: {
		actions: readonly string[];
		fieldPolicies?: Readonly<Record<string, string>>;
	},
) {
	const snapshots = {
		subject: quotePageContract.subject,
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

test("QuoteView 正常渲染客户阶梯价与报价单工作台", () => {
	const html = renderQuoteView(
		<QuoteView data={mockQuotes} total={1} />,
		{ actions: ["read"], fieldPolicies: {} },
	);

	assert.ok(html.includes("客户阶梯价与报价单"), "应正常渲染报价单工作台");
	assert.ok(html.includes("QU-2026-0001"), "应正常渲染报价单号");
	assert.ok(html.includes("春季阶梯报价"), "应正常渲染报价简称");
});

test("QuoteView 依据 export 权限动态控制【导出数据】按钮渲染", () => {
	const htmlWithExport = renderQuoteView(
		<QuoteView data={mockQuotes} total={1} />,
		{ actions: ["read", "export"], fieldPolicies: {} },
	);
	assert.match(htmlWithExport, /导出/, "拥有 export 权限时应渲染导出按钮");

	const htmlWithoutExport = renderQuoteView(
		<QuoteView data={mockQuotes} total={1} />,
		{ actions: ["read"], fieldPolicies: {} },
	);
	assert.doesNotMatch(
		htmlWithoutExport,
		/导出/,
		"无 export 权限时不应渲染导出按钮",
	);
});
