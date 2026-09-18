import test from "node:test";
import assert from "node:assert/strict";
import {
  UnitConversionEngine,
  type UnitInfo,
  type CustomConversionRule,
} from "./service";

test("多单位换算引擎 - 同类型基准比例换算", () => {
  const jinUnit: UnitInfo = {
    id: "u-jin",
    unitCode: "jin",
    unitName: "斤",
    unitType: "WEIGHT",
    baseRatio: 500,
    isBaseUnit: false,
  };
  const kgUnit: UnitInfo = {
    id: "u-kg",
    unitCode: "kg",
    unitName: "公斤",
    unitType: "WEIGHT",
    baseRatio: 1000,
    isBaseUnit: false,
  };

  // 1. 斤 转 公斤: 10斤 = 5公斤
  const rate = UnitConversionEngine.resolveConversionRate({
    fromUnit: jinUnit,
    toUnit: kgUnit,
  });
  assert.equal(rate.toNumber(), 0.5);

  const converted = UnitConversionEngine.convert({
    quantity: 10,
    fromUnit: jinUnit,
    toUnit: kgUnit,
    precision: 2,
  });
  assert.equal(converted.toNumber(), 5.0);

  // 2. 公斤 转 斤: 2.5公斤 = 5斤
  const convertedReverse = UnitConversionEngine.convert({
    quantity: 2.5,
    fromUnit: kgUnit,
    toUnit: jinUnit,
    precision: 2,
  });
  assert.equal(convertedReverse.toNumber(), 5.0);
});

test("多单位换算引擎 - 物料专属自定义规则优先", () => {
  const pieceUnit: UnitInfo = {
    id: "u-piece",
    unitCode: "piece",
    unitName: "件",
    unitType: "COUNT",
    baseRatio: 1,
    isBaseUnit: true,
  };
  const jinUnit: UnitInfo = {
    id: "u-jin",
    unitCode: "jin",
    unitName: "斤",
    unitType: "WEIGHT",
    baseRatio: 500,
    isBaseUnit: false,
  };

  // 某冬瓜 1件 = 40斤
  const customRules: CustomConversionRule[] = [
    {
      itemCode: "ITM-MELON-01",
      fromUnitId: "u-piece",
      toUnitId: "u-jin",
      conversionRate: 40,
    },
  ];

  const converted = UnitConversionEngine.convert({
    quantity: 3,
    fromUnit: pieceUnit,
    toUnit: jinUnit,
    itemCode: "ITM-MELON-01",
    customRules,
    precision: 2,
  });
  assert.equal(converted.toNumber(), 120);

  // 反向：60斤冬瓜 = 1.5件
  const convertedBack = UnitConversionEngine.convert({
    quantity: 60,
    fromUnit: jinUnit,
    toUnit: pieceUnit,
    itemCode: "ITM-MELON-01",
    customRules,
    precision: 2,
  });
  assert.equal(convertedBack.toNumber(), 1.5);
});
