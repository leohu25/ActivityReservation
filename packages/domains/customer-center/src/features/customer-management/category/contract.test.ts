import test from "node:test";
import assert from "node:assert/strict";
import {
	CustomerCategorySubject,
	CustomerCategoryResource,
	CustomerCategoryField,
	customerCategorySearchParams,
	customerCategoryPageContract,
	CustomerCategoryAction,
} from "./contract";
import { StandardAction } from "@base/authorization";

test("category.contract: customerCategorySearchParams 解析参数与默认值", async () => {
	const parsed = await customerCategorySearchParams.parse(
		Promise.resolve({
			page: "1",
			pageSize: "20",
			keyword: "餐饮",
			status: "ACTIVE",
		}),
	);
	assert.deepEqual(parsed, {
		page: 1,
		pageSize: 20,
		keyword: "餐饮",
		status: "ACTIVE",
	});
});

test("category.contract: 客户分类契约基本元数据完整性", () => {
	assert.equal(CustomerCategorySubject, "CustomerCategory");
	assert.equal(CustomerCategoryResource, "customer.category");
	assert.equal(customerCategoryPageContract.path, "/customer/categories");

	const actionNames = customerCategoryPageContract.actions.map((a) => a.action);
	assert.ok(actionNames.includes(StandardAction.READ));
	assert.ok(actionNames.includes(StandardAction.CREATE));
	assert.ok(actionNames.includes(StandardAction.UPDATE));
	assert.ok(actionNames.includes(StandardAction.DELETE));
	assert.ok(actionNames.includes(CustomerCategoryAction.TOGGLE_STATUS));

	assert.equal(CustomerCategoryField.CATEGORY_CODE, "categoryCode");
});
