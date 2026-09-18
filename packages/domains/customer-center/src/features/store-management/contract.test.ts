import test from "node:test";
import assert from "node:assert/strict";
import { customerStoreSearchParams } from "./contract";

test("contract.customerStoreSearchParams：默认字段 + 业务扩展", async () => {
	const parsed = await customerStoreSearchParams.parse(
		Promise.resolve({
			page: "2",
			pageSize: "20",
			keyword: "西湖",
			customerId: "CUST-01",
			status: "ACTIVE",
		}),
	);
	assert.deepEqual(parsed, {
		page: 2,
		pageSize: 20,
		keyword: "西湖",
		customerId: "CUST-01",
		status: "ACTIVE",
	});
});

test("customerStoreSearchParams：非法 page/pageSize 回落默认值", async () => {
	const parsed = await customerStoreSearchParams.parse(
		Promise.resolve({ page: "xyz", pageSize: "-5" }),
	);
	assert.equal(parsed.page, 1);
	assert.equal(parsed.pageSize, 10);
	assert.equal(parsed.keyword, "");
	assert.equal(parsed.customerId, "");
	assert.equal(parsed.status, "");
});
