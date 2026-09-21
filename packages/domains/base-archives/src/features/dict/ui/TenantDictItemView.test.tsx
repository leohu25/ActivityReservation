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
import { TenantDictItemView } from "./TenantDictItemView";
import { TenantDictItemSubject } from "../contract";
import type { TenantDictItemDto } from "../types";

const mockDictItems: TenantDictItemDto[] = [
	{
		id: "dict_1",
		type: "CUSTOMER_LEVEL",
		code: "HIGH",
		name: "核心高价值客户",
		status: "ACTIVE",
		sort: 1,
		isDefault: true,
		remark: "KA大客户",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
];

function renderWithAbility(ui: React.ReactElement, actions: readonly string[]) {
	const snapshots = [
		{
			subject: TenantDictItemSubject,
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

test("TenantDictItemView: 仅拥有 read 权限时隐藏新增、编辑、停用与删除等写操作", () => {
	const html = renderWithAbility(
		<TenantDictItemView data={mockDictItems} total={mockDictItems.length} />,
		["read"],
	);

	assert.match(html, /数据字典管理/);
	assert.match(html, /核心高价值客户/);
	assert.doesNotMatch(html, /新增字典项/);
	assert.doesNotMatch(html, />编辑</);
	assert.doesNotMatch(html, />停用</);
	assert.doesNotMatch(html, />删除</);
});

test("TenantDictItemView: 拥有完整写权限时展示新增、编辑、停用与删除操作", () => {
	const html = renderWithAbility(
		<TenantDictItemView data={mockDictItems} total={mockDictItems.length} />,
		["read", "create", "update", "delete", "toggle_status", "export"],
	);

	assert.match(html, /新增字典项/);
	assert.match(html, />编辑</);
	assert.match(html, />停用</);
	assert.match(html, />删除</);
	assert.match(html, /导出/);
});
