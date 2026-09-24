import test from "node:test";
import assert from "node:assert/strict";
import {
	parseCreateOperationInput,
	parseUpdateOperationInput,
	createOperationSchema,
} from "./schema";

test("process.schema: parseCreateOperationInput 校验必填项并正确换算出成率", () => {
	const parsed = parseCreateOperationInput({
		code: "OP_CUT",
		name: "切配工序",
		operationCategoryDictItemId: "550e8400-e29b-41d4-a716-446655440000",
		defaultSetupMinutes: 10,
		defaultCleanupMinutes: 15,
		defaultYieldRate: 98, // 98%
		specifications: [
			{
				code: "CUT_SLICE_3MM",
				name: "切片3mm",
				defaultYieldRate: 95,
				description: "厚度3mm",
			},
			{
				code: "CUT_DICE_10MM",
				name: "切丁10mm",
				defaultYieldRate: 92,
			},
		],
	});

	assert.equal(parsed.code, "OP_CUT");
	assert.equal(parsed.name, "切配工序");
	assert.equal(parsed.defaultSetupMinutes, 10);
	assert.equal(parsed.defaultCleanupMinutes, 15);
	assert.equal(parsed.defaultYieldRate, 0.98); // 换算为 0-1 小数
	assert.equal(parsed.specifications.length, 2);
	assert.equal(parsed.specifications[0].code, "CUT_SLICE_3MM");
	assert.equal(parsed.specifications[0].defaultYieldRate, 0.95);
	assert.equal(parsed.specifications[1].code, "CUT_DICE_10MM");
	assert.equal(parsed.specifications[1].defaultYieldRate, 0.92);
});

test("process.schema: 工艺规格编码重复时 refine 拦截", () => {
	const res = createOperationSchema.safeParse({
		code: "OP_CUT",
		name: "切配工序",
		operationCategoryDictItemId: "550e8400-e29b-41d4-a716-446655440000",
		specifications: [
			{ code: "SPEC_01", name: "规格A" },
			{ code: "SPEC_01", name: "规格B" }, // 编码重复
		],
	});

	assert.equal(res.success, false);
});

test("process.schema: parseUpdateOperationInput 正常支持部分更新", () => {
	const parsed = parseUpdateOperationInput({
		name: "精细切配工序",
		defaultYieldRate: 96.5,
		status: "DISABLED",
	});

	assert.equal(parsed.name, "精细切配工序");
	assert.equal(parsed.defaultYieldRate, 0.965);
	assert.equal(parsed.status, "DISABLED");
});
