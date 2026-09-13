import { Decimal } from "decimal.js";

export interface UnitInfo {
  id: string;
  unitCode: string;
  unitName: string;
  unitType: string;
  baseRatio: number | string | Decimal;
  isBaseUnit: boolean;
}

export interface CustomConversionRule {
  itemCode?: string | null;
  fromUnitId: string;
  toUnitId: string;
  conversionRate: number | string | Decimal;
}

/**
 * 计量单位与多单位物理换算引擎
 */
export class UnitConversionEngine {
  /**
   * 计算换算系数
   * 查找优先级：
   * 1. 针对具体商品物料的专属换算规则
   * 2. 全局自定义换算规则
   * 3. 同一度量类别下的基准比例线性换算
   */
  static resolveConversionRate(params: {
    fromUnit: UnitInfo;
    toUnit: UnitInfo;
    itemCode?: string | null;
    customRules?: CustomConversionRule[];
  }): Decimal {
    const { fromUnit, toUnit, itemCode, customRules = [] } = params;

    if (fromUnit.id === toUnit.id || fromUnit.unitCode === toUnit.unitCode) {
      return new Decimal(1);
    }

    // 1. 匹配专属物料换算规则
    if (itemCode) {
      const itemRule = customRules.find(
        (r) =>
          r.itemCode === itemCode &&
          r.fromUnitId === fromUnit.id &&
          r.toUnitId === toUnit.id,
      );
      if (itemRule) {
        return new Decimal(itemRule.conversionRate.toString());
      }
      // 反向查找
      const itemReverseRule = customRules.find(
        (r) =>
          r.itemCode === itemCode &&
          r.fromUnitId === toUnit.id &&
          r.toUnitId === fromUnit.id,
      );
      if (itemReverseRule) {
        return new Decimal(1).dividedBy(
          new Decimal(itemReverseRule.conversionRate.toString()),
        );
      }
    }

    // 2. 匹配全局换算规则 (itemCode 为空)
    const globalRule = customRules.find(
      (r) =>
        (!r.itemCode || r.itemCode === "") &&
        r.fromUnitId === fromUnit.id &&
        r.toUnitId === toUnit.id,
    );
    if (globalRule) {
      return new Decimal(globalRule.conversionRate.toString());
    }

    // 3. 同类别基准比例换算 (如重量类：斤与千克通过克基准换算)
    if (fromUnit.unitType === toUnit.unitType) {
      const fromRatio = new Decimal(fromUnit.baseRatio.toString());
      const toRatio = new Decimal(toUnit.baseRatio.toString());
      if (toRatio.isZero()) {
        throw new Error(`目标单位 ${toUnit.unitName} 的基准折算率不能为 0`);
      }
      return fromRatio.dividedBy(toRatio);
    }

    throw new Error(
      `单位 ${fromUnit.unitName} 与 ${toUnit.unitName} 跨度量类别且无专属换算规则`,
    );
  }

  /**
   * 将源数量转换为目标单位数量，并遵循指定精度进行舍入
   */
  static convert(params: {
    quantity: number | string | Decimal;
    fromUnit: UnitInfo;
    toUnit: UnitInfo;
    itemCode?: string | null;
    precision?: number;
    customRules?: CustomConversionRule[];
  }): Decimal {
    const rate = UnitConversionEngine.resolveConversionRate(params);
    const converted = new Decimal(params.quantity.toString()).times(rate);
    if (params.precision !== undefined && params.precision >= 0) {
      return converted.toDecimalPlaces(params.precision, Decimal.ROUND_HALF_UP);
    }
    return converted;
  }
}
