import test from "node:test";
import assert from "node:assert/strict";
import {
	parseCreateBomInput,
	parseUpdateBomInput,
	createBomSchema,
} from "./schema";

test("bom.schema: 合规单品加工 BOM 输入成功通过校验", () => {
	const valid = {
		bomType: "PROCESSING",
		code: "BOM_QJ_01",
		name: "青椒段5cm切配BOM",
		productId: "prod-qj-001",
		productionLineId: "line-01",
		description: "标准单品加工配方",
		quantityMode: "FIXED",
		totalYieldEnabled: true,
		totalYieldRate: 0.9,
		isDefault: true,
		inputs: [
			{
				productId: "prod-raw-qj",
				quantity: 1.1,
				unitId: "unit-kg",
				materialRole: "MAIN",
				cookedYieldRate: 0.95,
				normalLossRate: 0.05,
				supplyPolicy: "EXTERNAL",
			},
		],
		outputs: [
			{
				productId: "prod-qj-001",
				quantity: 1.0,
				unitId: "unit-kg",
				outputRole: "PRIMARY",
			},
		],
		operations: [
			{
				operationId: "op-wash",
				sequenceNumber: 10,
				setupMinutes: 5,
				cleanupMinutes: 5,
				standardLaborHours: 0.2,
				qualityCheckpoint: true,
			},
		],
	};

	const parsed = parseCreateBomInput(valid);
	assert.equal(parsed.code, "BOM_QJ_01");
	assert.equal(parsed.bomType, "PROCESSING");
	assert.equal(parsed.inputs.length, 1);
	assert.equal(parsed.outputs.length, 1);
	assert.equal(parsed.operations.length, 1);
});

test("bom.schema: 缺少必填字段时正确拦截抛错", () => {
	// 缺少 code
	assert.throws(() => {
		createBomSchema.parse({
			bomType: "FORMULA",
			name: "测试配方",
			productId: "prod-001",
		});
	});

	// 缺少 name
	assert.throws(() => {
		createBomSchema.parse({
			bomType: "FORMULA",
			code: "BOM_01",
			productId: "prod-001",
		});
	});

	// 缺少 productId
	assert.throws(() => {
		createBomSchema.parse({
			bomType: "FORMULA",
			code: "BOM_01",
			name: "测试配方",
		});
	});
});

test("bom.schema: 更新 BOM 契约支持局部字段扩展", () => {
	const updateData = {
		name: "更新后的BOM名称",
		description: "新工艺调整说明",
		changeReason: "出成率指标优化",
	};

	const parsed = parseUpdateBomInput(updateData);
	assert.equal(parsed.name, "更新后的BOM名称");
	assert.equal(parsed.changeReason, "出成率指标优化");
});
