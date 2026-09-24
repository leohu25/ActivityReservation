/**
 * MRP (物料需求计划) 核心算力引擎：
 * 严格按照 BOM 投入单位与数量为实际基准展开，并根据商品单位换算链折算为供应链采购单位。
 */

export interface UnitConversionRule {
	readonly fromUnitId: string;
	readonly toUnitId: string;
	/** 换算倍率：1 fromUnit = conversionFactor toUnit */
	readonly conversionFactor: number;
}

export interface MrpProductMaterialMaster {
	readonly productId: string;
	readonly productCode: string;
	readonly productName: string;
	readonly inventoryUnitId: string;
	readonly inventoryUnitName?: string;
	readonly defaultPurchaseUnitId?: string | null;
	readonly defaultPurchaseUnitName?: string | null;
	/** 最小采购起订量/包装量 (以默认采购单位计) */
	readonly minimumPurchaseQuantity?: number | null;
	/** 商品维护的单位换算规则库 */
	readonly unitConversions?: readonly UnitConversionRule[];
}

export interface MrpBomInputItem {
	readonly productId: string;
	readonly quantity: number;
	readonly unitId: string;
	readonly unitName?: string;
	/** 损耗率 (0~1) */
	readonly normalLossRate?: number | null;
	readonly materialRole?: string;
}

export interface MrpBomVersionDefinition {
	readonly bomId: string;
	readonly bomVersionId: string;
	readonly primaryProductId: string;
	/** 标准批次产出量 */
	readonly outputQuantity: number;
	readonly outputUnitId: string;
	/** 原料投入清单 */
	readonly inputs: readonly MrpBomInputItem[];
}

export interface MrpMaterialRequirementResult {
	readonly productId: string;
	readonly productCode: string;
	readonly productName: string;
	/** 投入行在 BOM 中的实际配方单位与毛耗用量 */
	readonly bomUsage: {
		readonly unitId: string;
		readonly unitName?: string;
		readonly standardUnitRatio: number; // 单件耗用比 (投入量 / 产出量)
		readonly netRequiredQuantity: number; // 净需求
		readonly grossRequiredQuantity: number; // 计入损耗后的毛需求
		readonly lossRate: number;
	};
	/** 换算至供应链采购单位的采购需求 */
	readonly purchaseRequirement: {
		readonly purchaseUnitId: string;
		readonly purchaseUnitName?: string;
		/** 是否成功找到换算系数并完成换算 */
		readonly conversionSuccess: boolean;
		/** 1 BOM投入单位 对应多少 采购单位 的换算率 */
		readonly conversionFactorToPurchase: number;
		/** 严格换算后的实际采购毛需求 */
		readonly exactPurchaseQuantity: number;
		/** 结合最小起订量 (MOQ) 向上取整后的建议采购订单量 */
		readonly suggestedOrderQuantity: number;
		readonly minimumPurchaseQuantity?: number | null;
	};
}

/**
 * 在商品的单位换算库中解析从源单位到目标单位的有效换算系数：
 * 1 sourceUnit = factor targetUnit
 */
export function resolveUnitConversionFactor(
	sourceUnitId: string,
	targetUnitId: string,
	inventoryUnitId: string,
	conversions: readonly UnitConversionRule[] = [],
): number | null {
	if (sourceUnitId === targetUnitId) return 1;

	// 1. 直连匹配: fromUnitId === sourceUnitId && toUnitId === targetUnitId
	const directForward = conversions.find(
		(c) => c.fromUnitId === sourceUnitId && c.toUnitId === targetUnitId,
	);
	if (directForward && directForward.conversionFactor > 0) {
		return directForward.conversionFactor;
	}

	// 2. 直连逆向: fromUnitId === targetUnitId && toUnitId === sourceUnitId
	const directReverse = conversions.find(
		(c) => c.fromUnitId === targetUnitId && c.toUnitId === sourceUnitId,
	);
	if (directReverse && directReverse.conversionFactor > 0) {
		return 1 / directReverse.conversionFactor;
	}

	// 3. 通过库存基准单位 (inventoryUnitId) 间接两步桥接换算
	if (sourceUnitId !== inventoryUnitId && targetUnitId !== inventoryUnitId) {
		const sourceToBase = resolveUnitConversionFactor(
			sourceUnitId,
			inventoryUnitId,
			inventoryUnitId,
			conversions,
		);
		const baseToTarget = resolveUnitConversionFactor(
			inventoryUnitId,
			targetUnitId,
			inventoryUnitId,
			conversions,
		);
		if (sourceToBase !== null && baseToTarget !== null) {
			return sourceToBase * baseToTarget;
		}
	}

	return null;
}

/**
 * 依据 BOM 投入实际数据，运行 MRP 原料需求与采购折算算法
 *
 * @param plannedOutputQuantity 计划生产产出数量
 * @param bom BOM 版本快照定义
 * @param materialMasterMap 投入物料商品的主数据及换算表映射 (Key: productId)
 */
export function calculateMrpRequirementsFromBom(
	plannedOutputQuantity: number,
	bom: MrpBomVersionDefinition,
	materialMasterMap: ReadonlyMap<string, MrpProductMaterialMaster>,
): readonly MrpMaterialRequirementResult[] {
	if (plannedOutputQuantity <= 0 || bom.outputQuantity <= 0) {
		return [];
	}

	// 产出缩放系数 = 计划生产量 / BOM标准产出批量
	const batchScale = plannedOutputQuantity / bom.outputQuantity;

	return bom.inputs.map((inp) => {
		const master = materialMasterMap.get(inp.productId);
		const productCode = master?.productCode || "-";
		const productName = master?.productName || "未知物料";

		// 1. BOM 投入层实际耗用计算 (以 BOM 投入单位为准)
		const standardUnitRatio = inp.quantity / bom.outputQuantity;
		const netRequired = inp.quantity * batchScale;
		const lossRate = Math.min(Math.max(inp.normalLossRate ?? 0, 0), 0.9999);
		const grossRequired = netRequired / (1 - lossRate);

		// 2. 确定采购单位：优先使用物料定义的默认采购单位，无默认采购单位时降级使用库存基准单位，再无则直接使用投入单位
		const targetPurchaseUnitId =
			master?.defaultPurchaseUnitId ||
			master?.inventoryUnitId ||
			inp.unitId;

		const targetPurchaseUnitName =
			master?.defaultPurchaseUnitName ||
			master?.inventoryUnitName ||
			inp.unitName;

		// 3. 换算至采购单位
		let conversionSuccess = true;
		let factorToPurchase = 1;

		if (inp.unitId !== targetPurchaseUnitId && master) {
			const resolvedFactor = resolveUnitConversionFactor(
				inp.unitId,
				targetPurchaseUnitId,
				master.inventoryUnitId,
				master.unitConversions || [],
			);

			if (resolvedFactor !== null && resolvedFactor > 0) {
				factorToPurchase = resolvedFactor;
			} else {
				// 未维护换算比时，无法精准折算，回退 1:1 并标记失败
				conversionSuccess = false;
				factorToPurchase = 1;
			}
		}

		const exactPurchaseQty = grossRequired * factorToPurchase;

		// 4. 结合起订量 (MOQ) 或最小包装规整
		const moq = master?.minimumPurchaseQuantity ?? null;
		let suggestedOrderQty = exactPurchaseQty;
		if (moq && moq > 0) {
			// 如果有起订量/整包要求，向上取整至起订量的整数倍
			const packCount = Math.ceil(exactPurchaseQty / moq);
			suggestedOrderQty = packCount * moq;
		}

		return {
			productId: inp.productId,
			productCode,
			productName,
			bomUsage: {
				unitId: inp.unitId,
				unitName: inp.unitName,
				standardUnitRatio,
				netRequiredQuantity: Number(netRequired.toFixed(4)),
				grossRequiredQuantity: Number(grossRequired.toFixed(4)),
				lossRate,
			},
			purchaseRequirement: {
				purchaseUnitId: targetPurchaseUnitId,
				purchaseUnitName: targetPurchaseUnitName,
				conversionSuccess,
				conversionFactorToPurchase: factorToPurchase,
				exactPurchaseQuantity: Number(exactPurchaseQty.toFixed(4)),
				suggestedOrderQuantity: Number(suggestedOrderQty.toFixed(4)),
				minimumPurchaseQuantity: moq,
			},
		};
	});
}
