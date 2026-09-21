import test from "node:test";
import assert from "node:assert/strict";
import {
	parseCreateDictItemInput,
	parseUpdateDictItemInput,
} from "./schema";

test("dict.schema: 创建字典项参数校验合法输入", () => {
	const raw = {
		type: "CUSTOMER_LEVEL",
		code: "HIGH",
		name: "高价值客户",
		sort: "10",
		isDefault: true,
		remark: "核心重要客户",
	};

	const parsed = parseCreateDictItemInput(raw);
	assert.equal(parsed.type, "CUSTOMER_LEVEL");
	assert.equal(parsed.code, "HIGH");
	assert.equal(parsed.name, "高价值客户");
	assert.equal(parsed.sort, 10);
	assert.equal(parsed.isDefault, true);
	assert.equal(parsed.remark, "核心重要客户");
	assert.equal(parsed.status, "ACTIVE");
});

test("dict.schema: 创建字典项参数校验非法输入拦截", () => {
	// 缺失必填项
	assert.throws(() => parseCreateDictItemInput({}), /字典类型不能为空/);
	assert.throws(
		() => parseCreateDictItemInput({ type: "CUSTOMER_LEVEL" }),
		/字典项编码不能为空/,
	);
	assert.throws(
		() =>
			parseCreateDictItemInput({
				type: "CUSTOMER_LEVEL",
				code: "HIGH",
			}),
		/字典项名称不能为空/,
	);
	// code 包含非法字符
	assert.throws(
		() =>
			parseCreateDictItemInput({
				type: "CUSTOMER_LEVEL",
				code: "HIGH*LEVEL!",
				name: "高价值客户",
			}),
		/编码仅允许字母、数字、下划线、点与短横线/,
	);
});

test("dict.schema: 修改字典项参数校验", () => {
	const parsed = parseUpdateDictItemInput({
		id: "dict_123",
		name: "更新后名称",
		status: "DISABLED",
		sort: 5,
	});

	assert.equal(parsed.id, "dict_123");
	assert.equal(parsed.name, "更新后名称");
	assert.equal(parsed.status, "DISABLED");
	assert.equal(parsed.sort, 5);
});
