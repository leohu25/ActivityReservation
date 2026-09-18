import test from "node:test";
import assert from "node:assert/strict";
import {
	CustomerTagSubject,
	CustomerTagResource,
	CustomerTagField,
	customerTagSearchParams,
	customerTagPageContract,
	CustomerTagAction,
} from "./contract";
import { StandardAction } from "@base/authorization";

test("tag.contract: customerTagSearchParams 解析参数与默认值", async () => {
	const parsed = await customerTagSearchParams.parse(
		Promise.resolve({
			page: "2",
			pageSize: "20",
			keyword: "VIP",
			tagType: "DELIVERY",
			status: "ACTIVE",
		}),
	);
	assert.deepEqual(parsed, {
		page: 2,
		pageSize: 20,
		keyword: "VIP",
		tagType: "DELIVERY",
		status: "ACTIVE",
	});
});

test("tag.contract: 客户标签契约基本元数据完整性", () => {
	assert.equal(CustomerTagSubject, "CustomerTag");
	assert.equal(CustomerTagResource, "customer.tag");
	assert.equal(customerTagPageContract.path, "/customer/tags");

	const actionNames = customerTagPageContract.actions.map((a) => a.action);
	assert.ok(actionNames.includes(StandardAction.READ));
	assert.ok(actionNames.includes(StandardAction.CREATE));
	assert.ok(actionNames.includes(StandardAction.UPDATE));
	assert.ok(actionNames.includes(StandardAction.DELETE));
	assert.ok(actionNames.includes(CustomerTagAction.TOGGLE_STATUS));

	assert.equal(CustomerTagField.NAME, "name");
	assert.equal(CustomerTagField.TAG_TYPE, "tagType");
});
