import type { ProcessTemplateItem } from "../../types";

export interface StepInputItem {
  id: string;
  itemCode: string;
  quantity: number;
  uom: string;
  materialRole: "FLOW" | "SUB_BOM" | "PURCHASE";
}

export interface StepOutputItem {
  id: string;
  itemCode: string;
  quantity: number;
  uom: string;
  outputType: "MAIN" | "BYPRODUCT" | "SCRAP";
  materialRole: "FLOW" | "FINAL";
}

export interface StepFormState {
  id: string; // 本地唯一 key
  seqNo: number;
  processId: string;
  processName: string;
  specId: string | null;
  lossRate: number;
  yieldRate: number;
  stdLaborHours: number | null;
  qcCheckpoint: boolean;
  inputs: StepInputItem[];
  outputs: StepOutputItem[];
}

// 预设默认工序候选（当数据库暂无工序模板时降级兜底）
export const DEFAULT_PRESET_PROCESSES = [
  { processCode: "PROC-CLEAN", processName: "分拣清洗", defaultLossRate: 3 },
  { processCode: "PROC-PEEL", processName: "去皮精修", defaultLossRate: 5 },
  { processCode: "PROC-CUT", processName: "切割切丝", defaultLossRate: 4 },
  { processCode: "PROC-SEASON", processName: "配方调理", defaultLossRate: 1 },
  { processCode: "PROC-PACK", processName: "定量分装", defaultLossRate: 0 },
];

export function resolveProcessName(
  processId: string,
  processTemplates: ProcessTemplateItem[],
): string {
  const found = processTemplates.find(
    (pt) => pt.id === processId || pt.processCode === processId,
  );
  if (found) return found.processName;
  const preset = DEFAULT_PRESET_PROCESSES.find(
    (p) => p.processCode === processId,
  );
  return preset ? preset.processName : processId;
}
