import test from "node:test";
import assert from "node:assert/strict";
import type React from "react";
import { renderToString } from "react-dom/server";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import {
	TenantAbilityProvider,
	createAbilityFromSnapshot,
} from "@base/authorization";
import { UiAbilityProvider } from "@base/ui";
import { CategoryView } from "./CategoryView";
import { CustomerCategorySubject } from "../contract";
import type { CustomerCategoryItem } from "../types";

const mockCategories: CustomerCategoryItem[] = [
	{
		categoryCode: "CAT_VIP",
		categoryName: "VIP 战略客户",
		parentCode: null,
		status: "ACTIVE",
		description: "大宗年采客户",
	},
];

function renderWithAbility(ui: React.ReactElement, actions: readonly string[]) {
	const snapshots = [
		{
			subject: CustomerCategorySubject,
			actions,
			fieldPolicies: {},
		},
	];
	const ability = createAbilityFromSnapshot(snapshots);

	return renderToString(
		<TenantAbilityProvider snapshots={snapshots}>
			<UiAbilityProvider ability={ability}>
				<NuqsTestingAdapter>{ui}</NuqsTestingAdapter>
			</UiAbilityProvider>
		</TenantAbilityProvider>,
	);
}

test("CategoryView: 仅拥有 read 权限时隐藏新增/编辑/删除等写操作", () => {
	const html = renderWithAbility(
		<CategoryView data={mockCategories} total={mockCategories.length} />,
		["read"],
	);

	assert.doesNotMatch(html, /新增一级根分类/);
	assert.doesNotMatch(html, />编辑</);
	assert.doesNotMatch(html, /title="删除分类"/);
});

test("CategoryView: 拥有完整 CRUD 权限时展示新增、编辑、停用与删除", () => {
	const html = renderWithAbility(
		<CategoryView data={mockCategories} total={mockCategories.length} />,
		["read", "create", "update", "delete"],
	);

	assert.match(html, /新增一级根分类/);
	assert.match(html, />编辑</);
	assert.match(html, />停用</);
	assert.match(html, /title="删除分类"/);
});
