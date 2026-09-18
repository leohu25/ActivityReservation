import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { CategoryFormModal } from "./CategoryFormModal";
import type { CustomerCategoryItem } from "../types";

const mockCategories: CustomerCategoryItem[] = [
	{
		id: "CAT_VIP",
		name: "VIP 战略客户",
		parentId: null,
		status: "ACTIVE",
		description: "大宗年采客户",
	},
];

test("CategoryFormModal [新增模式]: 渲染新增根分类标题与创建按钮", () => {
	const html = renderToString(
		<CategoryFormModal
			open={true}
			inline={true}
			mode="create"
			categories={mockCategories}
			onClose={() => {}}
		/>,
	);

	assert.match(html, /新增一级根分类/);
	assert.match(html, /立即创建/);
});

test("CategoryFormModal [新增下级模式]: 渲染新增下级分类标题", () => {
	const html = renderToString(
		<CategoryFormModal
			open={true}
			inline={true}
			mode="create"
			defaultParentId="CAT_VIP"
			categories={mockCategories}
			onClose={() => {}}
		/>,
	);

	assert.match(html, /新增下级分类/);
	assert.match(html, /立即创建/);
});

test("CategoryFormModal [编辑模式]: 完整回填分类字段，渲染保存修改按钮", () => {
	const html = renderToString(
		<CategoryFormModal
			open={true}
			inline={true}
			mode="edit"
			record={mockCategories[0]}
			categories={mockCategories}
			onClose={() => {}}
		/>,
	);

	assert.match(html, /编辑分类: VIP 战略客户/);
	assert.match(html, /保存修改/);
	assert.match(html, /VIP 战略客户/);
	assert.match(html, /大宗年采客户/);
});

test("CategoryFormModal [查看模式]: 全字段只读置灰，隐藏保存与创建按钮", () => {
	const html = renderToString(
		<CategoryFormModal
			open={true}
			inline={true}
			mode="view"
			record={mockCategories[0]}
			categories={mockCategories}
			onClose={() => {}}
		/>,
	);

	assert.match(html, /查看分类: VIP 战略客户/);
	assert.doesNotMatch(html, /立即创建/);
	assert.doesNotMatch(html, /保存修改/);
	assert.match(html, /关闭/);
});
