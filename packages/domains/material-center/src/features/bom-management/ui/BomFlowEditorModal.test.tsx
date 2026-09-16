import test from "node:test";
import assert from "node:assert/strict";
import type {
  CreateBomInput,
  CreateBomProcessInput,
  ProcessTemplateItem,
} from "../types";
import { BomCalculatorEngine } from "../service";

test("BOM流程编排数据契约 - 工序步骤与多物料投入产出契约组装", () => {
  // 模拟工序库模板
  const mockTemplates: ProcessTemplateItem[] = [
    {
      id: "proc-1",
      processCode: "PROC-CLEAN",
      processName: "分拣清洗",
      category: "CLEAN",
      defaultLossRate: 5,
      stdLaborHours: 0.5,
      specs: [
        {
          id: "spec-1",
          specCode: "SPEC-CLEAN-FINE",
          specName: "精洗去泥",
          defaultLossRate: 4,
        },
      ],
    },
    {
      id: "proc-2",
      processCode: "PROC-CUT",
      processName: "机械切丝",
      category: "CUT",
      defaultLossRate: 3,
      stdLaborHours: 0.25,
      specs: [
        {
          id: "spec-2",
          specCode: "SPEC-CUT-5MM",
          specName: "切丝5MM",
          defaultLossRate: 3,
        },
      ],
    },
  ];

  // 构造编排流程：步骤 10 分拣清洗 -> 步骤 20 机械切丝
  const step1: CreateBomProcessInput = {
    seqNo: 10,
    processId: mockTemplates[0].id,
    specId: mockTemplates[0].specs[0].id,
    lossRate: 5,
    yieldRate: 95,
    stdLaborHours: 0.5,
    qcCheckpoint: true,
    inputs: [
      {
        itemCode: "RAW-POTATO-01",
        quantity: 100,
        uom: "kg",
        materialRole: "PURCHASE",
      },
    ],
    outputs: [
      {
        itemCode: "SEMI-CLEAN-POTATO",
        quantity: 95,
        uom: "kg",
        outputType: "MAIN",
        materialRole: "FLOW",
        nextProcessSeq: 20,
      },
      {
        itemCode: "BYPRODUCT-SCRAP-01",
        quantity: 5,
        uom: "kg",
        outputType: "BYPRODUCT",
        materialRole: "FLOW",
      },
    ],
  };

  const step2: CreateBomProcessInput = {
    seqNo: 20,
    processId: mockTemplates[1].id,
    specId: mockTemplates[1].specs[0].id,
    lossRate: 3,
    yieldRate: 97,
    stdLaborHours: 0.25,
    qcCheckpoint: false,
    inputs: [
      {
        itemCode: "SEMI-CLEAN-POTATO",
        quantity: 95,
        uom: "kg",
        materialRole: "FLOW",
        prevProcessSeq: 10,
      },
      {
        itemCode: "PKG-BOX-01",
        quantity: 190,
        uom: "盒",
        materialRole: "PURCHASE",
      },
    ],
    outputs: [
      {
        itemCode: "FIN-POTATO-STRIPS",
        quantity: 92.15,
        uom: "kg",
        outputType: "MAIN",
        materialRole: "FINAL",
      },
    ],
  };

  const fullBomPayload: CreateBomInput = {
    bomCode: "BOM-POTATO-STRIPS-001",
    bomName: "鲜切土豆丝 盒装标准工艺BOM",
    bomType: "SINGLE",
    outputItemCode: "FIN-POTATO-STRIPS",
    batchQty: 1,
    batchUnit: "kg",
    productionLineId: "line-veg-01",
    overrideTotalYield: false,
    processes: [step1, step2],
  };

  // 1. 验证表头与步骤完整性
  assert.equal(fullBomPayload.processes?.length, 2);
  assert.equal(fullBomPayload.processes?.[0].seqNo, 10);
  assert.equal(fullBomPayload.processes?.[1].seqNo, 20);

  // 2. 验证投入产出关系
  assert.equal(fullBomPayload.processes?.[0].inputs?.length, 1);
  assert.equal(fullBomPayload.processes?.[0].outputs?.length, 2);
  assert.equal(
    fullBomPayload.processes?.[0].outputs?.[1].outputType,
    "BYPRODUCT",
  );

  // 3. 验证计算引擎连乘核算
  const calcProcesses = (fullBomPayload.processes || []).map((p) => ({
    seqNo: p.seqNo,
    lossRate: p.lossRate,
    yieldRate: p.yieldRate,
  }));

  const totalYield = BomCalculatorEngine.calculateTotalYieldRate({
    overrideTotalYield: false,
    processes: calcProcesses,
  });

  // 95% * 97% = 0.95 * 0.97 = 0.9215 -> 92.15%
  assert.equal(totalYield.toNumber(), 92.15);
});

test("BOM流程编排数据契约 - 人工覆盖总出成率设定生效", () => {
  const steps: CreateBomProcessInput[] = [
    {
      seqNo: 10,
      processId: "proc-1",
      lossRate: 10,
      yieldRate: 90,
      inputs: [
        {
          itemCode: "RAW-1",
          quantity: 10,
          uom: "kg",
          materialRole: "PURCHASE",
        },
      ],
      outputs: [
        {
          itemCode: "FIN-1",
          quantity: 9,
          uom: "kg",
          outputType: "MAIN",
          materialRole: "FINAL",
        },
      ],
    },
  ];

  const totalYield = BomCalculatorEngine.calculateTotalYieldRate({
    overrideTotalYield: true,
    totalYieldRate: 88.8,
    processes: steps,
  });

  assert.equal(totalYield.toNumber(), 88.8);
});

test("BOM流程编排数据契约 - 工序编码代码规范化与预设映射", () => {
  const defaultNameMap: Record<string, { name: string; category: string }> = {
    "PROC-CLEAN": { name: "分拣清洗", category: "CLEAN" },
    "PROC-PEEL": { name: "去皮精修", category: "PRE_TREAT" },
    "PROC-CUT": { name: "切割切丝", category: "CUT" },
    "PROC-SEASON": { name: "配方调理", category: "SEASON" },
    "PROC-COOK": { name: "熟化加工", category: "COOK" },
    "PROC-PACK": { name: "定量分装", category: "PACK" },
  };

  const rawInputCodes = ["proc-clean", "PROC-CUT", "season", "custom-op"];
  const normalized = rawInputCodes.map((raw) => {
    const candidate = raw.toUpperCase().startsWith("PROC-")
      ? raw.toUpperCase()
      : `PROC-${raw.toUpperCase()}`;
    return candidate.slice(0, 30);
  });

  assert.equal(normalized[0], "PROC-CLEAN");
  assert.equal(normalized[1], "PROC-CUT");
  assert.equal(normalized[2], "PROC-SEASON");
  assert.equal(normalized[3], "PROC-CUSTOM-OP");

  assert.equal(defaultNameMap[normalized[0]]?.name, "分拣清洗");
  assert.equal(defaultNameMap[normalized[1]]?.category, "CUT");
});
