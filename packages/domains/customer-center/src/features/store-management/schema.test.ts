import test from "node:test";
import assert from "node:assert/strict";
import {
	createStoreSchema,
	updateStoreSchema,
	parseCreateStoreInput,
	parseUpdateStoreInput,
} from "./schema";

test("schema.createStoreSchema：选填字段为 null 时能正常通过解析", () => {
	const validWithNulls = {
		customerId: "CUST-001",
		name: "杭州总店",
		regionCode: "REGION_HD_01",
		deliveryPeriod: "MORNING",
		address: "西湖区文三路100号",
		contactPerson: "李四",
		contactPhone: "13912345678",
		defaultRoute: null,
		defaultDriver: null,
		billingContact: null,
		billingPhone: null,
		storeTags: null,
	};
	const parsed = parseCreateStoreInput(validWithNulls);
	assert.equal(parsed.name, "杭州总店");
	assert.equal(parsed.defaultRoute, null);
	assert.equal(parsed.billingPhone, null);
});

test("schema.createStoreSchema：必填字段缺失校验拦截", () => {
	assert.throws(
		() => parseCreateStoreInput({ name: "" }),
		(err: unknown) => {
			assert.ok(err instanceof Error);
			return true;
		},
	);
});

test("schema.createStoreSchema：手机号不合法拦截", () => {
	assert.throws(
		() =>
			parseCreateStoreInput({
				customerId: "CUST-001",
				name: "杭州总店",
				regionCode: "REGION_HD_01",
				deliveryPeriod: "MORNING",
				address: "西湖区文三路100号",
				contactPerson: "李四",
				contactPhone: "12345",
			}),
		(err: unknown) => {
			assert.ok(err instanceof Error);
			return true;
		},
	);
});

test("schema.updateStoreSchema：支持部分字段更新与状态变更", () => {
	const parsed = parseUpdateStoreInput({
		name: "杭州二店",
		status: "DISABLED",
	});
	assert.equal(parsed.name, "杭州二店");
	assert.equal(parsed.status, "DISABLED");
});
