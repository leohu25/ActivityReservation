import test from "node:test";
import assert from "node:assert/strict";
import {
	createQuoteSchema,
	updateQuoteSchema,
	parseCreateQuoteInput,
	parseUpdateQuoteInput,
} from "./schema";

test("schema.createQuoteSchema：合法输入通过解析", () => {
	const valid = {
		customerId: "cust-001",
		quoteDate: "2026-03-30",
		effectiveDate: "2026-04-01",
		items: [
			{
				itemCode: "ITEM-001",
				itemName: "生鲜青菜",
				salesUnit: "kg",
				unitPriceExclTax: 10,
				unitPriceInclTax: 10.9,
				taxRate: 9,
			},
		],
	};
	const parsed = parseCreateQuoteInput(valid);
	assert.equal(parsed.customerId, "cust-001");
	assert.equal(parsed.items.length, 1);
	assert.equal(parsed.items[0].itemName, "生鲜青菜");
});

test("schema.createQuoteSchema：明细行空列表被拦截", () => {
	assert.throws(
		() =>
			parseCreateQuoteInput({
				quoteDate: "2026-03-30",
				effectiveDate: "2026-04-01",
				items: [],
			}),
		(err: unknown) => {
			assert.ok(err instanceof Error);
			return true;
		},
	);
});

test("schema.updateQuoteSchema：更新报价单明细与生效日期", () => {
	const parsed = parseUpdateQuoteInput({
		effectiveDate: "2026-05-01",
		displayName: "五月特惠价",
		items: [
			{
				itemCode: "ITEM-002",
				itemName: "优质白菜",
				salesUnit: "kg",
				unitPriceExclTax: 5,
				unitPriceInclTax: 5.45,
				taxRate: 9,
			},
		],
	});
	assert.equal(parsed.effectiveDate, "2026-05-01");
	assert.equal(parsed.displayName, "五月特惠价");
	assert.equal(parsed.items.length, 1);
});
