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
import { TagView } from "./TagView";
import { CustomerTagSubject } from "../contract";
import type { CustomerTagItem } from "../types";

const mockTags: CustomerTagItem[] = [
	{
		tagCode: "TAG_DELIVERY_COLD",
		tagName: "冷链专送",
		tagType: "DELIVERY",
		status: "ACTIVE",
		description: "需全程冷链",
	},
];

function renderWithAbility(ui: React.ReactElement, actions: readonly string[]) {
	const snapshots = [
		{
			subject: CustomerTagSubject,
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

test("TagView: 仅拥有 read 权限时隐藏新增/编辑/删除等写操作", () => {
	const html = renderWithAbility(
		<TagView data={mockTags} total={mockTags.length} />,
		["read"],
	);

	assert.doesNotMatch(html, /新增标签/);
	assert.doesNotMatch(html, />编辑</);
	assert.doesNotMatch(html, /title="删除标签"/);
});

test("TagView: 拥有完整 CRUD 权限时展示新增、编辑、停用与删除", () => {
	const html = renderWithAbility(
		<TagView data={mockTags} total={mockTags.length} />,
		["read", "create", "update", "delete"],
	);

	assert.match(html, /新增标签/);
	assert.match(html, />编辑</);
	assert.match(html, />停用</);
	assert.match(html, /title="删除标签"/);
});
