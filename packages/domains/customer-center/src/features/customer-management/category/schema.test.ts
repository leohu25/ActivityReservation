import test from "node:test";
import assert from "node:assert/strict";
import { parseCreateCategoryInput, parseUpdateCategoryInput } from "./schema";

test("category.schema: parseCreateCategoryInput 校验必填项与处理默认值", () => {
	const parsed = parseCreateCategoryInput({
		name: "连锁餐饮",
		description: "说明文本",
	});
	assert.equal(parsed.name, "连锁餐饮");
	assert.equal(parsed.parentId, null);
	assert.equal(parsed.description, "说明文本");

	assert.throws(() => parseCreateCategoryInput({ name: "" }));
});

test("category.schema: parseUpdateCategoryInput 校验状态与部分更新", () => {
	const parsed = parseUpdateCategoryInput({
		name: "新分类",
		status: "DISABLED",
	});
	assert.equal(parsed.name, "新分类");
	assert.equal(parsed.status, "DISABLED");
});
