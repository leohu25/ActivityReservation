import test from "node:test";
import assert from "node:assert/strict";
import { BomCalculatorEngine } from "./service";

test("BOM计算引擎 - 工序连乘出成率计算与毛料反推", () => {
  // 对齐 PROC-ITEM-002-示例数据 场景1：土豆丝500g
  // 分拣(损耗10% -> 出成90%) -> 清洗(损耗1% -> 99%) -> 去皮(损耗4% -> 96%) -> 切丝(损耗5% -> 95%) -> 包装(损耗0% -> 100%)
  const processes = [
    { seqNo: 10, lossRate: 10, yieldRate: 90 },
    { seqNo: 20, lossRate: 1, yieldRate: 99 },
    { seqNo: 30, lossRate: 4, yieldRate: 96 },
    { seqNo: 40, lossRate: 5, yieldRate: 95 },
    { seqNo: 50, lossRate: 0, yieldRate: 100 },
  ];

  const totalYield = BomCalculatorEngine.calculateTotalYieldRate({
    overrideTotalYield: false,
    processes,
  });

  // 0.9 * 0.99 * 0.96 * 0.95 * 1.0 = 0.812592 -> 81.2592%
  assert.equal(totalYield.toNumber(), 81.2592);

  // 反推投料：产出 90.29kg 土豆丝，反推需要多少土豆毛料
  const inputQty = BomCalculatorEngine.calculateTheoreticalInput(
    90.29,
    totalYield,
    2,
  );
  // 90.29 / 0.8126304 ≈ 111.11kg
  assert.equal(inputQty.toNumber(), 111.11);
});

test("BOM计算引擎 - 开启总出成率强覆盖", () => {
  const processes = [
    { seqNo: 10, lossRate: 10, yieldRate: 90 },
    { seqNo: 20, lossRate: 10, yieldRate: 90 },
  ];

  const totalYield = BomCalculatorEngine.calculateTotalYieldRate({
    overrideTotalYield: true,
    totalYieldRate: 85,
    processes,
  });

  // 强覆盖为 85%
  assert.equal(totalYield.toNumber(), 85);
});

test("BOM计算引擎 - DFS 循环依赖检测拦截", () => {
  // 构造闭环: BOM-A -> BOM-B -> BOM-C -> BOM-A
  const graph = new Map<string, string[]>([
    ["BOM-A", ["BOM-B"]],
    ["BOM-B", ["BOM-C"]],
    ["BOM-C", ["BOM-A"]],
  ]);

  assert.throws(
    () => BomCalculatorEngine.assertNoCyclicDependency("BOM-A", graph),
    /检测到 BOM 循环引用依赖闭环: BOM-A -> BOM-B -> BOM-C -> BOM-A/,
  );

  // 构造无闭环 DAG: BOM-A -> [BOM-B, BOM-C]; BOM-B -> BOM-D; BOM-C -> BOM-D
  const dag = new Map<string, string[]>([
    ["BOM-A", ["BOM-B", "BOM-C"]],
    ["BOM-B", ["BOM-D"]],
    ["BOM-C", ["BOM-D"]],
    ["BOM-D", []],
  ]);

  assert.doesNotThrow(() =>
    BomCalculatorEngine.assertNoCyclicDependency("BOM-A", dag),
  );
});
