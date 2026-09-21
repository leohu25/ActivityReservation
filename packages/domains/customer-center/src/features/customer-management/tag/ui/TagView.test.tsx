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
		id: "TAG_DELIVERY_COLD",
		name: "冷链专送",
		tagTypeId: "dict_cold_001",
		tagType: {
			id: "dict_cold_001",
			code: "DELIVERY",
			name: "配送策略",
		},
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

test("TagView: 仅拥有 read 权限时隐藏新增、编辑、停用与删除等写操作", () => {
	const html = renderWithAbility(
		<TagView data={mockTags} total={mockTags.length} />,
		["read"],
	);

	assert.doesNotMatch(html, /新增标签/);
	assert.doesNotMatch(html, />编辑</);
	assert.doesNotMatch(html, />停用</);
	assert.doesNotMatch(html, />删除</);
});

test("TagView: 拥有完整 CRUD 与状态变更权限时展示新增、编辑、停用与删除", () => {
	const html = renderWithAbility(
		<TagView data={mockTags} total={mockTags.length} />,
		["read", "create", "update", "delete", "toggle_status"],
	);

	assert.match(html, /新增标签/);
	assert.match(html, />编辑</);
	assert.match(html, />停用</);
	assert.match(html, />删除</);
});

test("TagView: 注入基础档案字典枚举时，正确映射业务类型标签与下拉选项", () => {
	const dynamicTags: CustomerTagItem[] = [
		{
			id: "TAG_CUSTOM",
			name: "夜间配送",
			tagTypeId: "dict_night_001",
			tagType: {
				id: "dict_night_001",
				code: "NIGHT_DELIVERY",
				name: "夜间专属策略",
			},
			status: "ACTIVE",
			description: "夜间窗口配送",
		},
	];
	const tagTypeOptions = [
		{
			id: "dict_night_001",
			value: "dict_night_001",
			code: "NIGHT_DELIVERY",
			label: "夜间专属策略",
		},
		{
			id: "dict_vip_002",
			value: "dict_vip_002",
			code: "VIP_CHANNEL",
			label: "VIP极速通道",
		},
	];

	const html = renderWithAbility(
		<TagView
			data={dynamicTags}
			total={dynamicTags.length}
			tagTypeOptions={tagTypeOptions}
		/>,
		["read"],
	);

	assert.match(html, /夜间专属策略/);
	assert.match(html, /夜间配送/);
});

test("TagView [对象驱动渲染]: 实体自带 tagType 关联对象时，无需外部 options 即可直接渲染业务类型名称", () => {
	const objectTags: CustomerTagItem[] = [
		{
			id: "TAG_DIRECT",
			name: "早市直供",
			tagTypeId: "dict_morning_99",
			tagType: {
				id: "dict_morning_99",
				code: "EARLY_MARKET",
				name: "早市直供策略",
			},
			status: "ACTIVE",
		},
	];

	// tagTypeOptions 为空，依然能直接通过 DTO 的 tagType 对象渲染出“早市直供策略”
	const html = renderWithAbility(
		<TagView data={objectTags} total={objectTags.length} tagTypeOptions={[]} />,
		["read"],
	);

	assert.match(html, /早市直供策略/);
});

test("TagView [零降级原则]: 未传入字典枚举选项且 DTO 无关联对象时，仅回显实际编码ID", () => {
	const tags: CustomerTagItem[] = [
		{
			id: "TAG_1",
			name: "测试标签",
			tagTypeId: "RAW_DICT_ID_999",
			status: "ACTIVE",
		},
	];

	const html = renderWithAbility(
		<TagView data={tags} total={tags.length} tagTypeOptions={[]} />,
		["read"],
	);

	// 零降级：不出现任何写死的“配送策略”等汉字降级，仅展示实际ID
	assert.doesNotMatch(html, /配送策略/);
	assert.match(html, /RAW_DICT_ID_999/);
});
