import test from "node:test";
import assert from "node:assert/strict";
import { processingSpecificationSchema } from "./schema";

test("specification.schema: 校验合法工艺规格参数", () => {
	const result = processingSpecificationSchema.safeParse({
		code: "CUT_SLICE_3MM",
		name: "切片3mm",
		description: "厚度均匀，厚度3±0.5mm",
		defaultYieldRate: "95",
		status: "ACTIVE",
	});

	assert.equal(result.success, true);
	if (result.success) {
		assert.equal(result.data.code, "CUT_SLICE_3MM");
		assert.equal(result.data.name, "切片3mm");
		assert.equal(result.data.defaultYieldRate, 95);
		assert.equal(result.data.status, "ACTIVE");
	}
});

test("specification.schema: 规格编码或名称为空时拦截", () => {
	const resCodeEmpty = processingSpecificationSchema.safeParse({
		code: "",
		name: "切丝5mm",
	});
	assert.equal(resCodeEmpty.success, false);

	const resNameEmpty = processingSpecificationSchema.safeParse({
		code: "CUT_STRIP_5MM",
		name: "",
	});
	assert.equal(resNameEmpty.success, false);
});

test("specification.schema: 出成率超出 0-100% 范围时拦截", () => {
	const resNegative = processingSpecificationSchema.safeParse({
		code: "SPEC_01",
		name: "规格01",
		defaultYieldRate: -5,
	});
	assert.equal(resNegative.success, false);

	const resOver100 = processingSpecificationSchema.safeParse({
		code: "SPEC_01",
		name: "规格01",
		defaultYieldRate: 105,
	});
	assert.equal(resOver100.success, false);
});
