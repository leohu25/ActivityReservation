"use client";

import React, { useState, useMemo } from "react";
import {
  Button,
  Badge,
  Input,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  toast,
} from "@base/ui";
import {
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Package,
  Wrench,
  CheckCircle2,
  X,
} from "lucide-react";
import type {
  BomListItem,
  ProcessTemplateItem,
  CreateBomProcessInput,
} from "../types";
import { createBomAction } from "../actions";

interface BomFlowEditorModalProps {
  open: boolean;
  onClose: () => void;
  productionLines: Array<{ id: string; lineName: string }>;
  items: Array<{ itemCode: string; itemName: string; baseUnit?: string }>;
  processTemplates: ProcessTemplateItem[];
  onSuccess: (createdBom: BomListItem) => void;
}

interface StepFormState {
  id: string; // 本地唯一 key
  seqNo: number;
  processId: string;
  processName: string;
  specId: string | null;
  lossRate: number;
  yieldRate: number;
  stdLaborHours: number | null;
  qcCheckpoint: boolean;
  inputs: Array<{
    id: string;
    itemCode: string;
    quantity: number;
    uom: string;
    materialRole: "FLOW" | "SUB_BOM" | "PURCHASE";
  }>;
  outputs: Array<{
    id: string;
    itemCode: string;
    quantity: number;
    uom: string;
    outputType: "MAIN" | "BYPRODUCT" | "SCRAP";
    materialRole: "FLOW" | "FINAL";
  }>;
}

// 预设默认工序候选（当数据库暂无工序模板时降级兜底）
const DEFAULT_PRESET_PROCESSES = [
  { processCode: "PROC-CLEAN", processName: "分拣清洗", defaultLossRate: 3 },
  { processCode: "PROC-PEEL", processName: "去皮精修", defaultLossRate: 5 },
  { processCode: "PROC-CUT", processName: "切割切丝", defaultLossRate: 4 },
  { processCode: "PROC-SEASON", processName: "配方调理", defaultLossRate: 1 },
  { processCode: "PROC-PACK", processName: "定量分装", defaultLossRate: 0 },
];

export function BomFlowEditorModal({
  open,
  onClose,
  productionLines,
  items,
  processTemplates,
  onSuccess,
}: BomFlowEditorModalProps) {
  // 1. 基础信息状态
  const [bomCode, setBomCode] = useState(
    () => `BOM-${Math.floor(1000 + Math.random() * 9000)}`,
  );
  const [bomName, setBomName] = useState("");
  const [bomType, setBomType] = useState<"SINGLE" | "COMPOSITE" | "PACKAGING">(
    "SINGLE",
  );
  const [outputItemCode, setOutputItemCode] = useState(
    items[0]?.itemCode || "",
  );
  const [batchQty, setBatchQty] = useState(1);
  const [batchUnit, setBatchUnit] = useState(items[0]?.baseUnit || "kg");
  const [productionLineId, setProductionLineId] = useState(
    productionLines[0]?.id || "",
  );
  const [overrideTotalYield, setOverrideTotalYield] = useState(false);
  const [customTotalYieldRate, setCustomTotalYieldRate] = useState<number>(85);
  const [loading, setLoading] = useState(false);

  // 2. 工序流程步骤状态（默认初始一个标准步骤）
  const [steps, setSteps] = useState<StepFormState[]>(() => {
    const firstTpl = processTemplates[0];
    const initialLoss = firstTpl?.defaultLossRate ?? 5;
    const initialYield = 100 - initialLoss;
    return [
      {
        id: "step-init-1",
        seqNo: 10,
        processId: firstTpl?.id || "proc-clean",
        processName: firstTpl?.processName || "分拣清洗",
        specId: firstTpl?.specs[0]?.id || null,
        lossRate: initialLoss,
        yieldRate: initialYield,
        stdLaborHours: firstTpl?.stdLaborHours ?? 0.5,
        qcCheckpoint: false,
        inputs: [
          {
            id: "inp-init-1",
            itemCode: items[0]?.itemCode || "RAW-001",
            quantity: 1,
            uom: items[0]?.baseUnit || "kg",
            materialRole: "PURCHASE",
          },
        ],
        outputs: [
          {
            id: "out-init-1",
            itemCode: items[0]?.itemCode || "RAW-001",
            quantity: 0.95,
            uom: items[0]?.baseUnit || "kg",
            outputType: "MAIN",
            materialRole: "FINAL",
          },
        ],
      },
    ];
  });

  // 3. 实时核算综合出成率 (连乘公式: ∏(yieldRate/100) * 100)
  const computedTotalYieldRate = useMemo(() => {
    if (overrideTotalYield) {
      return customTotalYieldRate;
    }
    if (steps.length === 0) return 100;
    const product = steps.reduce(
      (acc, s) => acc * (Math.max(0, s.yieldRate) / 100),
      1,
    );
    return Math.round(product * 10000) / 100; // 保留 2 位小数
  }, [overrideTotalYield, customTotalYieldRate, steps]);

  // 4. 物料总投入数统计
  const totalInputsCount = useMemo(() => {
    return steps.reduce((sum, s) => sum + s.inputs.length, 0);
  }, [steps]);

  // 当选择产出物料时自动填充 BOM 名称和基准单位
  const handleOutputItemChange = (code: string) => {
    setOutputItemCode(code);
    const itm = items.find((i) => i.itemCode === code);
    if (itm) {
      if (itm.baseUnit) setBatchUnit(itm.baseUnit);
      if (!bomName || bomName.endsWith("工艺BOM")) {
        setBomName(`${itm.itemName} 工艺BOM`);
      }
    }
  };

  // 添加工序步骤
  const handleAddStep = () => {
    const nextSeq = (steps.length + 1) * 10;
    const tpl = processTemplates[steps.length % (processTemplates.length || 1)];
    const loss = tpl?.defaultLossRate ?? 5;
    const newStep: StepFormState = {
      id: `step-${Date.now()}-${Math.random()}`,
      seqNo: nextSeq,
      processId: tpl?.id || `proc-${nextSeq}`,
      processName: tpl?.processName || `工序 #${nextSeq}`,
      specId: tpl?.specs[0]?.id || null,
      lossRate: loss,
      yieldRate: 100 - loss,
      stdLaborHours: tpl?.stdLaborHours ?? 0.5,
      qcCheckpoint: false,
      inputs: [
        {
          id: `inp-${Date.now()}`,
          itemCode: items[0]?.itemCode || "",
          quantity: 1,
          uom: "kg",
          materialRole: "FLOW",
        },
      ],
      outputs: [
        {
          id: `out-${Date.now()}`,
          itemCode: outputItemCode,
          quantity: 1,
          uom: batchUnit,
          outputType: "MAIN",
          materialRole: "FLOW",
        },
      ],
    };
    setSteps((prev) => [...prev, newStep]);
  };

  // 移除工序步骤
  const handleRemoveStep = (stepId: string) => {
    if (steps.length <= 1) {
      toast.error("至少保留一道工艺工序");
      return;
    }
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
  };

  // 选择模板时联动带出默认损耗和规格
  const handleSelectTemplate = (stepId: string, templateId: string) => {
    const tpl = processTemplates.find((t) => t.id === templateId);
    if (!tpl) return;
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        const loss = tpl.defaultLossRate;
        return {
          ...s,
          processId: tpl.id,
          processName: tpl.processName,
          lossRate: loss,
          yieldRate: 100 - loss,
          stdLaborHours: tpl.stdLaborHours ?? s.stdLaborHours,
          specId: tpl.specs[0]?.id || null,
        };
      }),
    );
  };

  // 修改损耗率联动出成率
  const handleLossRateChange = (stepId: string, loss: number) => {
    const safeLoss = Math.max(0, Math.min(100, loss));
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? { ...s, lossRate: safeLoss, yieldRate: 100 - safeLoss }
          : s,
      ),
    );
  };

  // 修改出成率联动损耗率
  const handleYieldRateChange = (stepId: string, yieldRate: number) => {
    const safeYield = Math.max(0, Math.min(100, yieldRate));
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? { ...s, yieldRate: safeYield, lossRate: 100 - safeYield }
          : s,
      ),
    );
  };

  // 添加投入项
  const handleAddInput = (stepId: string) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        return {
          ...s,
          inputs: [
            ...s.inputs,
            {
              id: `inp-${Date.now()}-${Math.random()}`,
              itemCode: items[0]?.itemCode || "",
              quantity: 1,
              uom: "kg",
              materialRole: "PURCHASE",
            },
          ],
        };
      }),
    );
  };

  // 移除投入项
  const handleRemoveInput = (stepId: string, inputId: string) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        return {
          ...s,
          inputs: s.inputs.filter((i) => i.id !== inputId),
        };
      }),
    );
  };

  // 更新投入项字段
  const handleUpdateInput = (
    stepId: string,
    inputId: string,
    field: string,
    val: unknown,
  ) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        return {
          ...s,
          inputs: s.inputs.map((inp) => {
            if (inp.id !== inputId) return inp;
            return { ...inp, [field]: val };
          }),
        };
      }),
    );
  };

  // 添加产出项
  const handleAddOutput = (stepId: string) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        return {
          ...s,
          outputs: [
            ...s.outputs,
            {
              id: `out-${Date.now()}-${Math.random()}`,
              itemCode: outputItemCode,
              quantity: 1,
              uom: batchUnit,
              outputType: "BYPRODUCT",
              materialRole: "FLOW",
            },
          ],
        };
      }),
    );
  };

  // 移除产出项
  const handleRemoveOutput = (stepId: string, outputId: string) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        return {
          ...s,
          outputs: s.outputs.filter((o) => o.id !== outputId),
        };
      }),
    );
  };

  // 更新产出项字段
  const handleUpdateOutput = (
    stepId: string,
    outputId: string,
    field: string,
    val: unknown,
  ) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        return {
          ...s,
          outputs: s.outputs.map((out) => {
            if (out.id !== outputId) return out;
            return { ...out, [field]: val };
          }),
        };
      }),
    );
  };

  // 提交完整 BOM 与工序流转
  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!bomCode.trim() || !bomName.trim() || !outputItemCode) {
      toast.error("请完整填写 BOM 编码、名称和产出商品");
      return;
    }

    setLoading(true);
    try {
      const payloadProcesses: CreateBomProcessInput[] = steps.map((s, idx) => ({
        seqNo: (idx + 1) * 10,
        processId: s.processId,
        specId: s.specId,
        lossRate: Number(s.lossRate),
        yieldRate: Number(s.yieldRate),
        stdLaborHours: s.stdLaborHours ? Number(s.stdLaborHours) : null,
        qcCheckpoint: s.qcCheckpoint,
        inputs: s.inputs.map((inp) => ({
          itemCode: inp.itemCode,
          quantity: Number(inp.quantity),
          uom: inp.uom,
          materialRole: inp.materialRole,
        })),
        outputs: s.outputs.map((out) => ({
          itemCode: out.itemCode,
          quantity: Number(out.quantity),
          uom: out.uom,
          outputType: out.outputType,
          materialRole: out.materialRole,
        })),
      }));

      const res = await createBomAction({
        bomCode: bomCode.trim(),
        bomName: bomName.trim(),
        bomType,
        outputItemCode,
        batchQty: Number(batchQty),
        batchUnit,
        productionLineId: productionLineId || null,
        overrideTotalYield,
        totalYieldRate: overrideTotalYield
          ? Number(customTotalYieldRate)
          : null,
        processes: payloadProcesses,
      });

      if (res.success && res.data) {
        const itemObj = items.find((i) => i.itemCode === outputItemCode);
        const lineObj = productionLines.find((l) => l.id === productionLineId);

        const newBom: BomListItem = {
          id: res.data.id,
          bomCode: res.data.bomCode,
          bomName: res.data.bomName,
          bomType: res.data.bomType,
          version: res.data.version,
          isResearch: res.data.isResearch,
          isDefault: res.data.isDefault,
          outputItemCode: res.data.outputItemCode,
          outputItemName: itemObj?.itemName || res.data.outputItemCode,
          batchQty: Number(res.data.batchQty),
          batchUnit: res.data.batchUnit,
          productionLineId: res.data.productionLineId,
          productionLineName: lineObj?.lineName || null,
          totalYieldRate: res.data.totalYieldRate
            ? Number(res.data.totalYieldRate)
            : computedTotalYieldRate,
          overrideTotalYield: res.data.overrideTotalYield,
          processCount: payloadProcesses.length,
          inputItemSummary:
            Array.from(
              new Set(
                payloadProcesses.flatMap((p) =>
                  (p.inputs || []).map((i) => i.itemCode),
                ),
              ),
            )
              .slice(0, 3)
              .join(", ") || "-",
          status: res.data.status,
          effectiveDate: res.data.effectiveDate,
          updatedAt: res.data.updatedAt,
          processes: payloadProcesses.map((p) => {
            const tpl = processTemplates.find((t) => t.id === p.processId);
            const spec = tpl?.specs.find((sp) => sp.id === p.specId);
            return {
              seqNo: p.seqNo,
              processId: p.processId,
              processName: tpl?.processName || `工序 #${p.seqNo}`,
              specId: p.specId,
              specName: spec?.specName || null,
              lossRate: p.lossRate,
              yieldRate: p.yieldRate,
              stdLaborHours: p.stdLaborHours,
              inputs: p.inputs || [],
              outputs: p.outputs || [],
            };
          }),
        };

        toast.success("工艺 BOM 及工序流转编排成功 (草稿)");
        onSuccess(newBom);
        onClose();
      } else if (!res.success) {
        toast.error(res.error || "创建工艺 BOM 失败");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-5xl! w-full max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-background"
      >
        {/* 对话框头部 */}
        <div className="flex justify-between items-center border-b border-border px-6 py-4 bg-muted/30">
          <div>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              工艺 BOM 编排设计器 (BOM Flow Editor)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              按先后时序编排加工工序、原料投料明细与各环节产出，自动核算综合出成率并点亮流程图
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 滚动内容区 */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {/* 1. 基本信息卡片 */}
          <div className="border border-border rounded-xl p-5 bg-card shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2.5">
              <Package className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                基础信息配置
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* BOM 编号 */}
              <div>
                <label className="text-xs font-semibold text-foreground flex justify-between items-center">
                  <span>BOM 编号 *</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setBomCode(
                        `BOM-${Math.floor(1000 + Math.random() * 9000)}`,
                      )
                    }
                    className="h-5 px-1.5 text-[11px] text-primary hover:text-primary hover:underline cursor-pointer font-normal"
                  >
                    重新生成
                  </Button>
                </label>
                <Input
                  type="text"
                  value={bomCode}
                  onChange={(e) => setBomCode(e.target.value)}
                  className="mt-1 font-mono text-sm"
                  placeholder="如 BOM-TDS-001"
                  required
                />
              </div>

              {/* 交付目标物料 */}
              <div>
                <label className="text-xs font-semibold text-foreground">
                  交付产出商品 *
                </label>
                <Select
                  value={outputItemCode}
                  onValueChange={handleOutputItemChange}
                >
                  <SelectTrigger className="mt-1 w-full text-sm">
                    <SelectValue placeholder="选择产出商品" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((i) => (
                      <SelectItem key={i.itemCode} value={i.itemCode}>
                        {i.itemName} ({i.itemCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* BOM 名称 */}
              <div>
                <label className="text-xs font-semibold text-foreground">
                  BOM 描述名称 *
                </label>
                <Input
                  type="text"
                  value={bomName}
                  onChange={(e) => setBomName(e.target.value)}
                  className="mt-1 text-sm"
                  placeholder="如 土豆丝500g 标品工艺BOM"
                  required
                />
              </div>

              {/* BOM 分类 */}
              <div>
                <label className="text-xs font-semibold text-foreground">
                  BOM 分类类型 *
                </label>
                <div className="mt-1 flex gap-2">
                  {[
                    { key: "SINGLE", label: "单品初加工" },
                    { key: "COMPOSITE", label: "组合调理" },
                    { key: "PACKAGING", label: "定量包装" },
                  ].map((t) => (
                    <Button
                      key={t.key}
                      type="button"
                      size="sm"
                      variant={bomType === t.key ? "default" : "outline"}
                      className="flex-1 text-xs cursor-pointer py-1 h-8"
                      onClick={() => setBomType(t.key as any)}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 基准批量与单位 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    基准批量
                  </label>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={batchQty}
                    onChange={(e) => setBatchQty(Number(e.target.value))}
                    className="mt-1 font-mono tabular-nums text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    批量单位
                  </label>
                  <Input
                    type="text"
                    value={batchUnit}
                    onChange={(e) => setBatchUnit(e.target.value)}
                    className="mt-1 text-sm"
                    placeholder="kg / 份 / 包"
                  />
                </div>
              </div>

              {/* 生产产线 */}
              <div>
                <label className="text-xs font-semibold text-foreground">
                  生产车间产线
                </label>
                <Select
                  value={productionLineId || "NONE"}
                  onValueChange={(val) =>
                    setProductionLineId(val === "NONE" ? "" : val)
                  }
                >
                  <SelectTrigger className="mt-1 w-full text-sm">
                    <SelectValue placeholder="未指定固定产线" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">未指定固定产线</SelectItem>
                    {productionLines.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.lineName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 2. 工序流程步骤列表卡片 */}
          <div className="border border-border rounded-xl p-5 bg-card shadow-xs space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">
                    工序步骤与投料流转编排
                  </h3>
                  <Badge variant="outline" className="text-xs font-mono">
                    已编排 {steps.length} 道工序
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  工序按时序从前往后流转，综合出成率实时累乘核算
                </p>
              </div>

              {/* 出成率 KPI 徽章 */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    核算综合出成率:
                  </div>
                  <div className="text-xl font-black text-primary tabular-nums tracking-tight">
                    {computedTotalYieldRate}%
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={handleAddStep}
                >
                  <Plus className="w-4 h-4 mr-1 text-primary" />
                  添加加工工序
                </Button>
              </div>
            </div>

            {/* 人工覆盖选项 */}
            <div className="flex items-center gap-3 bg-muted/40 border border-border p-2.5 rounded-lg text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={overrideTotalYield}
                  onChange={(e) => setOverrideTotalYield(e.target.checked)}
                  className="rounded text-primary focus:ring-0"
                />
                开启人工总出成率强行覆盖（不采用工序连乘）
              </label>
              {overrideTotalYield && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">设定出成率:</span>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    step="0.1"
                    value={customTotalYieldRate}
                    onChange={(e) =>
                      setCustomTotalYieldRate(Number(e.target.value))
                    }
                    className="w-20 h-7 text-xs font-mono tabular-nums text-center"
                  />
                  <span>%</span>
                </div>
              )}
            </div>

            {/* 工序卡片流 */}
            <div className="space-y-4">
              {steps.map((step, sIdx) => {
                const availableSpecs =
                  processTemplates.find((t) => t.id === step.processId)
                    ?.specs || [];

                return (
                  <div
                    key={step.id}
                    className="border border-border rounded-xl p-4 bg-background space-y-4 relative shadow-2xs hover:border-primary/50 transition-colors"
                  >
                    {/* 工序头 */}
                    <div className="flex flex-wrap justify-between items-center gap-3 border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          步骤 #{sIdx + 1}
                        </span>

                        {/* 工序选择 */}
                        <select
                          value={step.processId}
                          onChange={(e) =>
                            handleSelectTemplate(step.id, e.target.value)
                          }
                          className="px-2.5 py-1 text-sm font-semibold border rounded-lg bg-background"
                        >
                          {processTemplates.length > 0
                            ? processTemplates.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.processName} ({t.processCode})
                                </option>
                              ))
                            : DEFAULT_PRESET_PROCESSES.map((p) => (
                                <option
                                  key={p.processCode}
                                  value={p.processCode}
                                >
                                  {p.processName}
                                </option>
                              ))}
                        </select>

                        {/* 规格选择 */}
                        {availableSpecs.length > 0 && (
                          <select
                            value={step.specId || ""}
                            onChange={(e) => {
                              const spec = availableSpecs.find(
                                (sp) => sp.id === e.target.value,
                              );
                              setSteps((prev) =>
                                prev.map((s) =>
                                  s.id === step.id
                                    ? {
                                        ...s,
                                        specId: e.target.value || null,
                                        lossRate:
                                          spec?.defaultLossRate ?? s.lossRate,
                                        yieldRate: spec?.defaultLossRate
                                          ? 100 - spec.defaultLossRate
                                          : s.yieldRate,
                                      }
                                    : s,
                                ),
                              );
                            }}
                            className="px-2 py-1 text-xs border rounded-lg bg-background text-muted-foreground"
                          >
                            <option value="">常规无特殊规格</option>
                            {availableSpecs.map((sp) => (
                              <option key={sp.id} value={sp.id}>
                                {sp.specName}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* 工序指标配置 */}
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">损耗率:</span>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={step.lossRate}
                            onChange={(e) =>
                              handleLossRateChange(
                                step.id,
                                Number(e.target.value),
                              )
                            }
                            className="w-16 h-7 text-xs font-mono tabular-nums text-center"
                          />
                          <span>%</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-700 font-medium">
                            出成率:
                          </span>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={step.yieldRate}
                            onChange={(e) =>
                              handleYieldRateChange(
                                step.id,
                                Number(e.target.value),
                              )
                            }
                            className="w-16 h-7 text-xs font-mono tabular-nums text-center font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10"
                          />
                          <span className="text-emerald-700 dark:text-emerald-400">
                            %
                          </span>
                        </div>

                        <label className="flex items-center gap-1 cursor-pointer text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={step.qcCheckpoint}
                            onChange={(e) =>
                              setSteps((prev) =>
                                prev.map((s) =>
                                  s.id === step.id
                                    ? { ...s, qcCheckpoint: e.target.checked }
                                    : s,
                                ),
                              )
                            }
                            className="rounded text-primary"
                          />
                          质检点
                        </label>

                        {steps.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 h-7 px-2 cursor-pointer"
                            onClick={() => handleRemoveStep(step.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* 投入与产出双列面板 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 投入原料 */}
                      <div className="border border-border rounded-lg p-3 bg-muted/20 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1">
                            投入物料明细 (Inputs)
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddInput(step.id)}
                            className="h-6 px-2 text-[11px] text-primary hover:text-primary hover:bg-primary/10 flex items-center gap-0.5 cursor-pointer font-medium"
                          >
                            <Plus className="w-3 h-3" /> 添加原料
                          </Button>
                        </div>

                        {step.inputs.map((inp) => (
                          <div
                            key={inp.id}
                            className="flex items-center gap-2 bg-background p-2 border border-border rounded-md text-xs shadow-2xs"
                          >
                            {/* 选择物料 */}
                            <select
                              value={inp.itemCode}
                              onChange={(e) =>
                                handleUpdateInput(
                                  step.id,
                                  inp.id,
                                  "itemCode",
                                  e.target.value,
                                )
                              }
                              className="flex-1 px-1.5 py-1 border rounded bg-background text-xs truncate"
                            >
                              {items.map((it) => (
                                <option key={it.itemCode} value={it.itemCode}>
                                  {it.itemName} ({it.itemCode})
                                </option>
                              ))}
                            </select>

                            {/* 数量 */}
                            <Input
                              type="number"
                              min="0.001"
                              step="0.01"
                              value={inp.quantity}
                              onChange={(e) =>
                                handleUpdateInput(
                                  step.id,
                                  inp.id,
                                  "quantity",
                                  Number(e.target.value),
                                )
                              }
                              className="w-16 h-7 font-mono tabular-nums text-center text-xs"
                              placeholder="数量"
                            />

                            {/* 单位 */}
                            <Input
                              type="text"
                              value={inp.uom}
                              onChange={(e) =>
                                handleUpdateInput(
                                  step.id,
                                  inp.id,
                                  "uom",
                                  e.target.value,
                                )
                              }
                              className="w-14 h-7 text-center text-xs"
                              placeholder="单位"
                            />

                            {/* 角色 */}
                            <select
                              value={inp.materialRole}
                              onChange={(e) =>
                                handleUpdateInput(
                                  step.id,
                                  inp.id,
                                  "materialRole",
                                  e.target.value,
                                )
                              }
                              className="w-20 px-1 py-1 border rounded text-[11px] bg-background"
                            >
                              <option value="PURCHASE">采购原料</option>
                              <option value="FLOW">上道流转</option>
                              <option value="SUB_BOM">子BOM</option>
                            </select>

                            {step.inputs.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemoveInput(step.id, inp.id)
                                }
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* 工序产出 */}
                      <div className="border border-border rounded-lg p-3 bg-muted/20 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1">
                            工序产出物料 (Outputs)
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddOutput(step.id)}
                            className="h-6 px-2 text-[11px] text-primary hover:text-primary hover:bg-primary/10 flex items-center gap-0.5 cursor-pointer font-medium"
                          >
                            <Plus className="w-3 h-3" /> 添加副产品
                          </Button>
                        </div>

                        {step.outputs.map((out) => (
                          <div
                            key={out.id}
                            className="flex items-center gap-2 bg-background p-2 border border-border rounded-md text-xs shadow-2xs"
                          >
                            {/* 产出物料 */}
                            <select
                              value={out.itemCode}
                              onChange={(e) =>
                                handleUpdateOutput(
                                  step.id,
                                  out.id,
                                  "itemCode",
                                  e.target.value,
                                )
                              }
                              className="flex-1 px-1.5 py-1 border rounded bg-background text-xs truncate"
                            >
                              {items.map((it) => (
                                <option key={it.itemCode} value={it.itemCode}>
                                  {it.itemName} ({it.itemCode})
                                </option>
                              ))}
                            </select>

                            {/* 数量 */}
                            <Input
                              type="number"
                              min="0.001"
                              step="0.01"
                              value={out.quantity}
                              onChange={(e) =>
                                handleUpdateOutput(
                                  step.id,
                                  out.id,
                                  "quantity",
                                  Number(e.target.value),
                                )
                              }
                              className="w-16 h-7 font-mono tabular-nums text-center text-xs"
                              placeholder="数量"
                            />

                            {/* 单位 */}
                            <Input
                              type="text"
                              value={out.uom}
                              onChange={(e) =>
                                handleUpdateOutput(
                                  step.id,
                                  out.id,
                                  "uom",
                                  e.target.value,
                                )
                              }
                              className="w-14 h-7 text-center text-xs"
                              placeholder="单位"
                            />

                            {/* 类型 */}
                            <select
                              value={out.outputType}
                              onChange={(e) =>
                                handleUpdateOutput(
                                  step.id,
                                  out.id,
                                  "outputType",
                                  e.target.value,
                                )
                              }
                              className="w-20 px-1 py-1 border rounded text-[11px] bg-background"
                            >
                              <option value="MAIN">主产物</option>
                              <option value="BYPRODUCT">副产品</option>
                              <option value="SCRAP">废料</option>
                            </select>

                            {/* 角色 */}
                            <select
                              value={out.materialRole}
                              onChange={(e) =>
                                handleUpdateOutput(
                                  step.id,
                                  out.id,
                                  "materialRole",
                                  e.target.value,
                                )
                              }
                              className="w-20 px-1 py-1 border rounded text-[11px] bg-background"
                            >
                              <option value="FLOW">工序流转</option>
                              <option value="FINAL">最终成品</option>
                            </select>

                            {step.outputs.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemoveOutput(step.id, out.id)
                                }
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 底部保存条 */}
          <div className="flex flex-wrap justify-between items-center gap-3 border-t border-border pt-4">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                已配置{" "}
                <strong className="text-foreground">{steps.length}</strong>{" "}
                道工序， 共{" "}
                <strong className="text-foreground">{totalInputsCount}</strong>{" "}
                项投料， 理论综合出成率:{" "}
                <strong className="text-primary font-mono tabular-nums font-bold">
                  {computedTotalYieldRate}%
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                取消
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={loading}
                className="cursor-pointer"
              >
                {loading ? "正在保存..." : "保存并生成工艺 BOM"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
