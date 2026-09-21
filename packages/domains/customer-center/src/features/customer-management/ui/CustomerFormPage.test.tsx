import test from "node:test";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { UiAbilityProvider } from "@base/ui";
import { CustomerFormPage } from "./CustomerFormPage";
import type { CustomerListItem, CustomerTagItem } from "../types";

const mockCategories = [
	{ id: "CAT_RETAIL", name: "零售餐饮" },
	{ id: "CAT_HOTEL", name: "酒店连锁" },
];

const mockTags: CustomerTagItem[] = [
	{ id: "TAG_VIP", name: "重要客户", tagType: "OTHER" },
	{ id: "TAG_KA", name: "战略大客户", tagType: "OTHER" },
];

const mockCustomerRecord: CustomerListItem = {
	id: "cust-001",
	name: "绿叶连锁餐饮股份有限公司",
	categoryId: "CAT_RETAIL",
	contactPerson: "王总",
	contactPhone: "13912345678",
	settlementMethod: "MONTHLY",
	defaultTaxRate: 9,
	creditLimit: 80000,
	salesPerson: "李销售",
	serviceTime: "上午 8:00 - 10:00",
	customerTags: "TAG_VIP,TAG_KA",
	status: "ACTIVE",
	_count: { stores: 5 },
};

test("CustomerFormPage [新增模式]: 渲染全屏单据工作台、多区块卡片与保存按钮", () => {
	const html = renderToString(
		<CustomerFormPage
			mode="create"
			categoryOptions={mockCategories}
			tagOptions={mockTags}
		/>,
	);

	assert.match(html, /新建客户/);
	assert.match(html, /保存客户/);
	assert.match(html, /基础信息/);
	assert.match(html, /结算与授信/);
	assert.match(html, /业务归属/);
	assert.match(html, /返回客户列表/);
});

test("CustomerFormPage [编辑模式]: 完整回填客户名称与单据编号，渲染保存更新按钮", () => {
	const html = renderToString(
		<CustomerFormPage
			mode="edit"
			record={mockCustomerRecord}
			categoryOptions={mockCategories}
			tagOptions={mockTags}
		/>,
	);

	assert.match(html, /编辑: 绿叶连锁餐饮股份有限公司/);
	assert.match(html, /CUST-CUST-001/);
	assert.match(html, /保存更新/);
	assert.match(html, /绿叶连锁餐饮股份有限公司/);
	assert.match(html, /正常在用/);
});

test("CustomerFormPage [CASL 字段权限闭环]: 严格遵循不可读彻底剔除", () => {
	const mockAbility = {
		can: (_action: string, _subject: string, field?: string) => {
			if (field === "creditLimit") return false;
			return true;
		},
	};

	const html = renderToString(
		<UiAbilityProvider ability={mockAbility}>
			<CustomerFormPage
				mode="edit"
				record={mockCustomerRecord}
				categoryOptions={mockCategories}
				tagOptions={mockTags}
			/>
		</UiAbilityProvider>,
	);

	assert.doesNotMatch(html, /信用额度\(元\)/);
});
