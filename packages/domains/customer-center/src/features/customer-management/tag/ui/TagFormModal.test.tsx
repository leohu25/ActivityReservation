import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { TagFormModal } from "./TagFormModal";
import type { CustomerTagItem } from "../types";

const mockTag: CustomerTagItem = {
	id: "TAG_COLD",
	name: "冷链专送",
	tagTypeId: "dict_cold_1",
	tagType: {
		id: "dict_cold_1",
		code: "DELIVERY_COLD",
		name: "冷链专送策略",
	},
	status: "ACTIVE",
	description: "全程冷链温控",
};

test("TagFormModal [新增模式]: 渲染新建业务标签标题与创建按钮", () => {
	const html = renderToString(
		<TagFormModal
			open={true}
			inline={true}
			mode="create"
			onClose={() => {}}
		/>,
	);

	assert.match(html, /新建业务标签/);
	assert.match(html, /立即创建/);
});

test("TagFormModal [编辑模式]: 完整回填标签字段，渲染保存修改按钮", () => {
	const html = renderToString(
		<TagFormModal
			open={true}
			inline={true}
			mode="edit"
			record={mockTag}
			onClose={() => {}}
		/>,
	);

	assert.match(html, /编辑标签: 冷链专送/);
	assert.match(html, /保存修改/);
	assert.match(html, /冷链专送/);
	assert.match(html, /全程冷链温控/);
});

test("TagFormModal [查看模式]: 全字段只读置灰，隐藏保存与创建按钮", () => {
	const html = renderToString(
		<TagFormModal
			open={true}
			inline={true}
			mode="view"
			record={mockTag}
			onClose={() => {}}
		/>,
	);

	assert.match(html, /查看标签: 冷链专送/);
	assert.doesNotMatch(html, /立即创建/);
	assert.doesNotMatch(html, /保存修改/);
	assert.match(html, /关闭/);
});

test("TagFormModal [动态字典注入]: 渲染注入的基础档案字典业务类型选项", () => {
	const tagTypeOptions = [
		{ id: "dict_deliv_1", value: "dict_deliv_1", code: "CUSTOM_DELIVERY", label: "定制配送模式" },
		{ id: "dict_fin_2", value: "dict_fin_2", code: "FINANCE_VIP", label: "专属财务结账" },
	];

	const createHtml = renderToString(
		<TagFormModal
			open={true}
			inline={true}
			mode="create"
			tagTypeOptions={tagTypeOptions}
			onClose={() => {}}
		/>,
	);
	// 默认选中第一项，展示包含名称与业务编码
	assert.match(createHtml, /定制配送模式/);
	assert.match(createHtml, /CUSTOM_DELIVERY/);
	assert.match(createHtml, /dict_deliv_1/);

	const editHtml = renderToString(
		<TagFormModal
			open={true}
			inline={true}
			mode="edit"
			record={{
				id: "TAG_FINANCE",
				name: "财务专属标签",
				tagTypeId: "dict_fin_2",
				tagType: {
					id: "dict_fin_2",
					code: "FINANCE_VIP",
					name: "专属财务结账",
				},
			}}
			tagTypeOptions={tagTypeOptions}
			onClose={() => {}}
		/>,
	);
	// 编辑指定项回显对应选项标签与主键ID
	assert.match(editHtml, /专属财务结账/);
	assert.match(editHtml, /FINANCE_VIP/);
	assert.match(editHtml, /dict_fin_2/);
});

test("TagFormModal [对象级回填保护]: 当 record 自带 tagType 对象且 options 未覆盖该项时，从对象精确提取并回填", () => {
	const html = renderToString(
		<TagFormModal
			open={true}
			inline={true}
			mode="edit"
			record={{
				id: "TAG_LEGACY",
				name: "老策略标签",
				tagTypeId: "dict_legacy_999",
				tagType: {
					id: "dict_legacy_999",
					code: "LEGACY_SPEC",
					name: "历史专用策略",
				},
			}}
			tagTypeOptions={[]} // options 为空
			onClose={() => {}}
		/>,
	);

	// 直接从 tagType 对象解析出名称与编码回显
	assert.match(html, /历史专用策略/);
	assert.match(html, /LEGACY_SPEC/);
	assert.match(html, /已停用\/历史/);
});

test("TagFormModal [零降级原则]: 无字典数据时不做硬编码枚举降级，表单项为空", () => {
	const html = renderToString(
		<TagFormModal
			open={true}
			inline={true}
			mode="create"
			tagTypeOptions={[]}
			onClose={() => {}}
		/>,
	);

	assert.doesNotMatch(html, /配送策略/);
	assert.doesNotMatch(html, /结算方式/);
	assert.doesNotMatch(html, /信用分级/);
	assert.match(html, /新建业务标签/);
});
