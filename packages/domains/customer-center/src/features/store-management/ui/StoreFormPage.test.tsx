import test from "node:test";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { UiAbilityProvider } from "@base/ui";
import { StoreFormPage } from "./StoreFormPage";
import type { StoreListItem } from "../types";
import type { CustomerListItem } from "../../customer-management/types";

const mockCustomers: CustomerListItem[] = [
	{
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
		customerTags: "TAG_VIP",
		status: "ACTIVE",
		_count: { stores: 1 },
	},
];

const mockStoreRecord: StoreListItem = {
	id: "store-001",
	customerId: "cust-001",
	name: "绿叶餐饮(西湖文化广场店)",
	address: "杭州市拱墅区中山北路西湖文化广场B1",
	contactPerson: "李店长",
	contactPhone: "13800000000",
	regionCode: "REGION_HD_01",
	deliveryPeriod: "MORNING",
	defaultRoute: "ROUTE_01",
	defaultDriver: "张师傅",
	billingContact: "王会计",
	billingPhone: "13811112222",
	status: "ACTIVE",
	customer: { id: "cust-001", name: "绿叶连锁餐饮股份有限公司" },
};

test("StoreFormPage [新增模式]: 渲染全屏单据工作台、多区块卡片与保存按钮", () => {
	const html = renderToString(
		<StoreFormPage
			mode="create"
			customers={mockCustomers}
		/>,
	);

	assert.match(html, /新建门店/);
	assert.match(html, /保存门店/);
	assert.match(html, /基础归属/);
	assert.match(html, /现场联系与配送/);
	assert.match(html, /财务对接/);
	assert.match(html, /返回门店列表/);
});

test("StoreFormPage [编辑模式]: 完整回填门店名称与单据编号，渲染保存更新按钮", () => {
	const html = renderToString(
		<StoreFormPage
			mode="edit"
			record={mockStoreRecord}
			customers={mockCustomers}
		/>,
	);

	assert.match(html, /编辑: 绿叶餐饮\(西湖文化广场店\)/);
	assert.match(html, /STORE-001/);
	assert.match(html, /保存更新/);
	assert.match(html, /绿叶餐饮\(西湖文化广场店\)/);
	assert.match(html, /正常在用/);
});

test("StoreFormPage [CASL 字段权限闭环]: 严格遵循不可读彻底剔除", () => {
	const mockAbility = {
		can: (_action: string, _subject: string, field?: string) => {
			if (field === "billingContact" || field === "billingPhone") return false;
			return true;
		},
	};

	const html = renderToString(
		<UiAbilityProvider ability={mockAbility}>
			<StoreFormPage
				mode="edit"
				record={mockStoreRecord}
				customers={mockCustomers}
			/>
		</UiAbilityProvider>,
	);

	assert.doesNotMatch(html, /财务对账对接人/);
});
