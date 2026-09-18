import test from "node:test";
import assert from "node:assert/strict";
import { customerQuoteSearchParams } from "./contract";

test("contract.customerQuoteSearchParams：默认字段 + 业务扩展", async () => {
	const parsed = await customerQuoteSearchParams.parse(
		Promise.resolve({
			page: "3",
			pageSize: "15",
			status: "ACTIVE",
			quoteType: "STANDARD",
		}),
	);
	assert.deepEqual(parsed, {
		page: 3,
		pageSize: 15,
		keyword: "",
		status: "ACTIVE",
		quoteType: "STANDARD",
	});
});

test("customerQuoteSearchParams：非法参数回落默认值", async () => {
	const parsed = await customerQuoteSearchParams.parse(
		Promise.resolve({ page: "bad", pageSize: "0" }),
	);
	assert.equal(parsed.page, 1);
	assert.equal(parsed.pageSize, 10);
	assert.equal(parsed.status, "");
	assert.equal(parsed.quoteType, "");
});
