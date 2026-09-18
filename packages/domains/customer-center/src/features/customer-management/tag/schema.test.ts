import test from "node:test";
import assert from "node:assert/strict";
import { parseCreateTagInput, parseUpdateTagInput } from "./schema";

test("tag.schema: parseCreateTagInput 校验必填项与默认值", () => {
	const parsed = parseCreateTagInput({
		tagName: "VIP专属",
		tagType: "DELIVERY",
	});
	assert.equal(parsed.tagName, "VIP专属");
	assert.equal(parsed.tagType, "DELIVERY");
	assert.equal(parsed.description, null);

	assert.throws(() => parseCreateTagInput({ tagName: "VIP专属" }));
});

test("tag.schema: parseUpdateTagInput 校验更新格式与状态", () => {
	const parsed = parseUpdateTagInput({
		tagName: "高价值客户",
		tagType: "CREDIT",
		status: "ACTIVE",
	});
	assert.equal(parsed.tagName, "高价值客户");
	assert.equal(parsed.tagType, "CREDIT");
	assert.equal(parsed.status, "ACTIVE");
});
