import test from "node:test";
import assert from "node:assert/strict";
import { parseCreateTagInput, parseUpdateTagInput } from "./schema";

test("tag.schema: parseCreateTagInput 校验必填项与默认值", () => {
	const parsed = parseCreateTagInput({
		name: "VIP专属",
		tagTypeId: "dict_deliv_1",
	});
	assert.equal(parsed.name, "VIP专属");
	assert.equal(parsed.tagTypeId, "dict_deliv_1");
	assert.equal(parsed.description, null);

	assert.throws(() => parseCreateTagInput({ name: "VIP专属" }));
});

test("tag.schema: parseUpdateTagInput 校验更新格式与状态", () => {
	const parsed = parseUpdateTagInput({
		name: "高价值客户",
		tagTypeId: "dict_credit_2",
		status: "ACTIVE",
	});
	assert.equal(parsed.name, "高价值客户");
	assert.equal(parsed.tagTypeId, "dict_credit_2");
	assert.equal(parsed.status, "ACTIVE");
});
