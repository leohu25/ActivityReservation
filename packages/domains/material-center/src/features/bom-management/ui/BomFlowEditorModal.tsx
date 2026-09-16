"use client";

import { useState, useMemo } from "react";
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
import {
  type StepFormState,
  DEFAULT_PRESET_PROCESSES,
  resolveProcessName,
} from "./components/bom-editor-types";
import { BomItemRatioTable } from "./components/BomItemRatioTable";
import { BomYieldCalculator } from "./components/BomYieldCalculator";

interface BomFlowEditorModalProps {
  open: boolean;
  onClose: () => void;
  productionLines: Array<{ id: string; lineName: string }>;
  items: Array<{ itemCode: string; itemName: string; baseUnit?: string }>;
  processTemplates: ProcessTemplateItem[];
  onSuccess: (createdBom: BomListItem) => void;
}

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
  const [productionLineId, setProductionLineId] = useState<string | null>(null);

  // 2. 工序流程列表状态
  const [steps, setSteps] = useState<StepFormState[]>(() => [
    {
      id: "step-1",
      seqNo: 1,
      processId: processTemplates[0]?.id || "PROC-CLEAN",
      processName: processTemplates[0]?.processName || "分拣清洗",
      specId: null,
      lossRate: 2,
      yieldRate: 98,
      stdLaborHours: 1,
      qcCheckpoint: true,
      inputs: [
        {
          id: "inp-1",
          itemCode: items[0]?.itemCode || "MAT-001",
          quantity: 1,
          uom: items[0]?.baseUnit || "kg",
          materialRole: "PURCHASE",
        },
      ],
      outputs: [
        {
          id: "out-1",
          itemCode: outputItemCode || items[0]?.itemCode || "MAT-001",
          quantity: 1,
          uom: batchUnit || "kg",
          outputType: "MAIN",
          materialRole: "FINAL",
        },
      ],
    },
  ]);

  const [activeStepId, setActiveStepId] = useState<string>("step-1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 当前选中的步骤
  const currentStep = useMemo(
    () => steps.find((s) => s.id === activeStepId) || steps[0],
    [steps, activeStepId],
  );

  // 工序候选选项列表
  const processCandidates = useMemo(() => {
    if (processTemplates.length > 0) {
      return processTemplates.map((p) => ({
        id: p.id,
        name: p.processName,
        code: p.processCode,
        loss: Number(p.defaultLossRate || 0),
      }));
    }
    return DEFAULT_PRESET_PROCESSES.map((p) => ({
      id: p.processCode,
      name: p.processName,
      code: p.processCode,
      loss: p.defaultLossRate,
    }));
  }, [processTemplates]);

  // 添加新工序
  const handleAddStep = () => {
    const nextSeq = steps.length + 1;
    const defaultProc = processCandidates[0];
    const newStepId = `step-${Date.now()}`;
    const newStep: StepFormState = {
      id: newStepId,
      seqNo: nextSeq,
      processId: defaultProc.id,
      processName: defaultProc.name,
      specId: null,
      lossRate: defaultProc.loss,
      yieldRate: 100 - defaultProc.loss,
      stdLaborHours: 0.5,
      qcCheckpoint: false,
      inputs: [],
      outputs: [],
    };
    setSteps((prev) => [...prev, newStep]);
    setActiveStepId(newStepId);
  };

  // 移除工序
  const handleRemoveStep = (stepId: string) => {
    if (steps.length <= 1) {
      toast.error("BOM 流程至少需要包含一个工序步骤");
      return;
    }
    setSteps((prev) => {
      const filtered = prev.filter((s) => s.id !== stepId);
      return filtered.map((s, idx) => ({ ...s, seqNo: idx + 1 }));
    });
    if (activeStepId === stepId) {
      const remaining = steps.filter((s) => s.id !== stepId);
      if (remaining.length > 0) {
        setActiveStepId(remaining[0].id);
      }
    }
  };

  // 修改工序模版
  const handleProcessChange = (stepId: string, processId: string) => {
    const candidate = processCandidates.find((p) => p.id === processId);
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        const loss = candidate ? candidate.loss : 0;
        return {
          ...s,
          processId,
          processName: candidate
            ? candidate.name
            : resolveProcessName(processId, processTemplates),
          lossRate: loss,
          yieldRate: 100 - loss,
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
              uom: items[0]?.baseUnit || "kg",
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

  // 提交并创建 BOM
  const handleSubmit = async () => {
    if (!bomCode.trim()) {
      toast.error("BOM 编码不能为空");
      return;
    }
    if (!bomName.trim()) {
      toast.error("BOM 名称不能为空");
      return;
    }
    if (!outputItemCode) {
      toast.error("必须指定产出成品物料");
      return;
    }

    // 格式化流程与投产输入
    const processesPayload: CreateBomProcessInput[] = steps.map((s) => ({
      seqNo: s.seqNo,
      processId: s.processId,
      processName: s.processName,
      specId: s.specId,
      lossRate: s.lossRate,
      yieldRate: s.yieldRate,
      stdLaborHours: s.stdLaborHours,
      qcCheckpoint: s.qcCheckpoint,
      inputs: s.inputs.map((inp, idx) => ({
        itemCode: inp.itemCode,
        quantity: inp.quantity,
        uom: inp.uom,
        materialRole: inp.materialRole,
        seqNo: idx + 1,
      })),
      outputs: s.outputs.map((out, idx) => ({
        itemCode: out.itemCode,
        quantity: out.quantity,
        uom: out.uom,
        outputType: out.outputType,
        materialRole: out.materialRole,
        seqNo: idx + 1,
      })),
    }));

    setIsSubmitting(true);
    try {
      const res = await createBomAction({
        bomCode: bomCode.trim(),
        bomName: bomName.trim(),
        bomType,
        outputItemCode,
        batchQty,
        batchUnit,
        productionLineId,
        processes: processesPayload,
      });

      if (res.success) {
        toast.success("BOM 多工序配方流程创建成功！");
        const foundItem = items.find((i) => i.itemCode === outputItemCode);
        const foundLine = productionLines.find(
          (l) => l.id === productionLineId,
        );
        const fullBomItem: BomListItem = {
          ...res.data,
          batchQty: Number(res.data.batchQty),
          totalYieldRate:
            res.data.totalYieldRate !== null
              ? Number(res.data.totalYieldRate)
              : null,
          effectiveDate: res.data.effectiveDate
            ? new Date(res.data.effectiveDate).toISOString()
            : new Date().toISOString(),
          updatedAt: res.data.updatedAt
            ? new Date(res.data.updatedAt).toISOString()
            : new Date().toISOString(),
          outputItemName: foundItem?.itemName || outputItemCode,
          productionLineName: foundLine?.lineName || "通用产线",
          processCount: steps.length,
          inputItemSummary: steps
            .flatMap((s) => s.inputs.map((inp) => inp.itemCode))
            .filter((v, i, a) => a.indexOf(v) === i)
            .join(", "),
        };
        onSuccess(fullBomItem);
        onClose();
      } else {
        toast.error(res.error || "创建 BOM 失败，请检查输入或循环引用");
      }
    } catch {
      toast.error("创建请求发生异常，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Modal 头部 */}
        <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary">
              <Layers className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold">
                多工序 BOM 工艺路线设计器
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                支持前置清洗、修整、初加工、深加工等多工序工步编排，精确定义工序出成率与物料投产配比
              </DialogDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Modal 主体滚动区 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. 基本信息面板 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg border border-border/80 bg-card">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                BOM 编码 *
              </label>
              <Input
                value={bomCode}
                onChange={(e) => setBomCode(e.target.value)}
                className="h-8 text-xs font-mono"
                placeholder="例如 BOM-5001"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                BOM 配方名称 *
              </label>
              <Input
                value={bomName}
                onChange={(e) => setBomName(e.target.value)}
                className="h-8 text-xs"
                placeholder="例如 净菜土豆丝标准生产配方"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                产出成品物料 *
              </label>
              <Select
                value={outputItemCode}
                onValueChange={(val) => {
                  setOutputItemCode(val);
                  const found = items.find((i) => i.itemCode === val);
                  if (found?.baseUnit) {
                    setBatchUnit(found.baseUnit);
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs font-medium">
                  <SelectValue placeholder="选择产出成品" />
                </SelectTrigger>
                <SelectContent className="max-h-[260px]">
                  {items.map((it) => (
                    <SelectItem
                      key={it.itemCode}
                      value={it.itemCode}
                      className="text-xs"
                    >
                      {it.itemName} ({it.itemCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                基准批量与单位
              </label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min="0.001"
                  step="1"
                  value={batchQty}
                  onChange={(e) => setBatchQty(parseFloat(e.target.value) || 1)}
                  className="h-8 text-xs w-24 font-mono text-right"
                />
                <Input
                  value={batchUnit}
                  onChange={(e) => setBatchUnit(e.target.value)}
                  className="h-8 text-xs w-16 text-center font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                配方类型
              </label>
              <Select
                value={bomType}
                onValueChange={(val: "SINGLE" | "COMPOSITE" | "PACKAGING") =>
                  setBomType(val)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE" className="text-xs">
                    标准单品加工
                  </SelectItem>
                  <SelectItem value="COMPOSITE" className="text-xs">
                    多物料组合配比
                  </SelectItem>
                  <SelectItem value="PACKAGING" className="text-xs">
                    包装外盒装配
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                推荐适用产线 (可选)
              </label>
              <Select
                value={productionLineId || "NONE"}
                onValueChange={(val) =>
                  setProductionLineId(val === "NONE" ? null : val)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="不指定（全产线通用）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE" className="text-xs">
                    不指定产线 (全厂通用)
                  </SelectItem>
                  {productionLines.map((line) => (
                    <SelectItem
                      key={line.id}
                      value={line.id}
                      className="text-xs"
                    >
                      {line.lineName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 2. 工艺工序可视化步骤条与导航 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="size-4 text-primary" />
                <h4 className="text-xs font-semibold text-foreground">
                  工艺工序阶段流编排
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  共 {steps.length} 道工序
                </Badge>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={handleAddStep}
              >
                <Plus className="size-3 mr-1" />
                追加下一工序
              </Button>
            </div>

            {/* 水平工序导航节点 */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {steps.map((st, idx) => {
                const isActive = st.id === activeStepId;
                return (
                  <div
                    key={st.id}
                    onClick={() => setActiveStepId(st.id)}
                    className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-all text-xs ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-card hover:bg-accent/60 border-border/80 text-foreground"
                    }`}
                  >
                    <div
                      className={`size-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        isActive
                          ? "bg-primary-foreground text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate max-w-[100px]">
                        {st.processName}
                      </div>
                      <div
                        className={`text-[9px] truncate ${
                          isActive
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        }`}
                      >
                        出成率: {st.yieldRate}%
                      </div>
                    </div>

                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveStep(st.id);
                        }}
                        className={`p-0.5 rounded ml-1 transition-opacity ${
                          isActive
                            ? "hover:bg-primary-foreground/20 text-primary-foreground"
                            : "hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        }`}
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. 当前工序的明细配置区 */}
          {currentStep && (
            <div className="p-4 rounded-lg border border-border/80 bg-card space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">
                    第 {currentStep.seqNo} 工序
                  </Badge>
                  <span className="text-xs font-semibold text-foreground">
                    工序定义与物料投产配置
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    绑定工序模板:
                  </span>
                  <Select
                    value={currentStep.processId}
                    onValueChange={(val) =>
                      handleProcessChange(currentStep.id, val)
                    }
                  >
                    <SelectTrigger className="h-7 text-xs w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {processCandidates.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 3.1 出成率与工时指标组件 */}
              <BomYieldCalculator
                stepId={currentStep.id}
                lossRate={currentStep.lossRate}
                yieldRate={currentStep.yieldRate}
                stdLaborHours={currentStep.stdLaborHours}
                qcCheckpoint={currentStep.qcCheckpoint}
                onLossRateChange={handleLossRateChange}
                onYieldRateChange={handleYieldRateChange}
                onLaborHoursChange={(sId, hours) =>
                  setSteps((prev) =>
                    prev.map((s) =>
                      s.id === sId ? { ...s, stdLaborHours: hours } : s,
                    ),
                  )
                }
                onQcChange={(sId, qc) =>
                  setSteps((prev) =>
                    prev.map((s) =>
                      s.id === sId ? { ...s, qcCheckpoint: qc } : s,
                    ),
                  )
                }
              />

              {/* 3.2 投入与产出物料配比表格组件 */}
              <BomItemRatioTable
                stepId={currentStep.id}
                inputs={currentStep.inputs}
                outputs={currentStep.outputs}
                items={items}
                onAddInput={handleAddInput}
                onRemoveInput={handleRemoveInput}
                onUpdateInput={handleUpdateInput}
                onAddOutput={handleAddOutput}
                onRemoveOutput={handleRemoveOutput}
                onUpdateOutput={handleUpdateOutput}
              />
            </div>
          )}
        </div>

        {/* Modal 底部操作栏 */}
        <div className="px-6 py-3 border-t border-border/80 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Package className="size-3.5" />
            <span>
              最终产出物料:{" "}
              <strong className="text-foreground">
                {items.find((i) => i.itemCode === outputItemCode)?.itemName ||
                  outputItemCode}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              <CheckCircle2 className="size-3.5 mr-1.5" />
              {isSubmitting ? "正在保存配方..." : "保存工艺 BOM"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
