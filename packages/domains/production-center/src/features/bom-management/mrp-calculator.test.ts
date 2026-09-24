import test from "node:test";
import assert from "node:assert/strict";
import {
	calculateMrpRequirementsFromBom,
	resolveUnitConversionFactor,
	type MrpBomVersionDefinition,
	type MrpProductMaterialMaster,
} from "./mrp-calculator";

test("MRP 算力与单位折算引擎: 应该正确解析多级单位换算链 (克 -> 千克 -> 箱)", () => {
	const unitGram = "unit-gram";
	const unitKg = "unit-kg";
	const unitBox = "unit-box";

	const conversions = [
		// 1 kg = 1000 g
		{ fromUnitId: unitKg, toUnitId: unitGram, conversionFactor: 1000 },
		// 1 box = 10 kg
		{ fromUnitId: unitBox, toUnitId: unitKg, conversionFactor: 10 },
	];

	// 克 到 箱：1 g = 0.001 kg = 0.0001 box
	const factor = resolveUnitConversionFactor(
		unitGram,
		unitBox,
		unitKg,
		conversions,
	);
	assert.ok(factor !== null);
	assert.ok(Math.abs(factor - 0.0001) < 1e-6);

	// 箱 到 克：1 box = 10000 g
	const reverseFactor = resolveUnitConversionFactor(
		unitBox,
		unitGram,
		unitKg,
		conversions,
	);
	assert.ok(reverseFactor !== null);
	assert.ok(Math.abs(reverseFactor - 10000) < 1e-2);
});

test("MRP 算力与单位折算引擎: 应该以 BOM 投入量与投入单位为准，正确推导采购毛需求与采购整箱数", () => {
	// 场景：生产 100 份 菜品 (BOM 标准批次为 10 份)
	// BOM 原料投入：青椒段 500 克 (投入单位：克，损耗率 5%)
	// 物料青椒：库存单位为 千克 (kg)，采购单位为 箱 (box)，1 箱 = 10 kg = 10000 g，最小起订 1 箱
	const bom: MrpBomVersionDefinition = {
		bomId: "bom-gbjd",
		bomVersionId: "v1",
		primaryProductId: "prod-gbjd",
		outputQuantity: 10,
		outputUnitId: "unit-portion",
		inputs: [
			{
				productId: "prod-pepper",
				quantity: 500, // 10 份产出耗用 500 克青椒 (即 50克/份)
				unitId: "unit-gram",
				unitName: "克",
				normalLossRate: 0.05, // 5% 正常损耗
			},
		],
	};

	const materialMap = new Map<string, MrpProductMaterialMaster>([
		[
			"prod-pepper",
			{
				productId: "prod-pepper",
				productCode: "RAW-PEPPER",
				productName: "青椒段5cm",
				inventoryUnitId: "unit-kg",
				inventoryUnitName: "千克",
				defaultPurchaseUnitId: "unit-box",
				defaultPurchaseUnitName: "箱",
				minimumPurchaseQuantity: 1, // 最少整箱采购 (MOQ = 1 箱)
				unitConversions: [
					{
						fromUnitId: "unit-kg",
						toUnitId: "unit-gram",
						conversionFactor: 1000,
					},
					{
						fromUnitId: "unit-box",
						toUnitId: "unit-kg",
						conversionFactor: 10,
					},
				],
			},
		],
	]);

	// 计划生产 100 份 (放大 10 倍)
	const results = calculateMrpRequirementsFromBom(100, bom, materialMap);

	assert.equal(results.length, 1);
	const pepperReq = results[0];

	// 1. BOM 投入层验证：
	// 净需求 = 500g * 10 = 5000g
	assert.equal(pepperReq.bomUsage.netRequiredQuantity, 5000);
	// 毛需求 = 5000 / (1 - 0.05) ≈ 5263.1579g
	assert.ok(Math.abs(pepperReq.bomUsage.grossRequiredQuantity - 5263.1579) < 0.01);

	// 2. 采购单位换算验证：
	// 1箱 = 10kg = 10000g，所以 1g = 0.0001箱
	// 精确采购毛需求 = 5263.1579g * 0.0001 = 0.5263箱
	assert.equal(pepperReq.purchaseRequirement.conversionSuccess, true);
	assert.ok(Math.abs(pepperReq.purchaseRequirement.exactPurchaseQuantity - 0.5263) < 0.001);
	// 向上取整至整箱起订量：Math.ceil(0.5263 / 1) * 1 = 1 箱
	assert.equal(pepperReq.purchaseRequirement.suggestedOrderQuantity, 1);
});
