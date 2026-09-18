import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { TagFormModal } from "./TagFormModal";
import type { CustomerTagItem } from "../types";

const mockTag: CustomerTagItem = {
	id: "TAG_COLD",
	name: "冷链专送",
	tagType: "DELIVERY",
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
