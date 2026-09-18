export interface ProcessInputItem {
  itemCode: string;
  quantity: number;
  uom: string;
  materialRole: "FLOW" | "SUB_BOM" | "PURCHASE";
  proportion?: number | null;
  prevProcessSeq?: number | null;
  childBomId?: string | null;
}

export interface ProcessOutputItem {
  itemCode: string;
  quantity: number;
  uom: string;
  outputType: "MAIN" | "BYPRODUCT" | "SCRAP";
  materialRole: "FLOW" | "FINAL";
  nextProcessSeq?: number | null;
}

export interface DagProcess {
  seqNo: number;
  processId?: string;
  processName: string;
  specId?: string | null;
  specName?: string | null;
  lossRate: number;
  yieldRate: number;
  stdLaborHours?: number | null;
  inputs: ProcessInputItem[];
  outputs: ProcessOutputItem[];
}

export interface BomListItem {
  id: string;
  bomCode: string;
  bomName: string;
  bomType: string;
  version: string;
  isResearch: boolean;
  isDefault: boolean;
  outputItemCode: string;
  outputItemName: string;
  batchQty: number;
  batchUnit: string;
  productionLineId: string | null;
  productionLineName: string | null;
  totalYieldRate: number | null;
  overrideTotalYield: boolean;
  processCount: number;
  inputItemSummary: string;
  status: string;
  effectiveDate: string;
  updatedAt: string;
  processes?: DagProcess[];
}

export interface ProcessTemplateSpec {
  id: string;
  specCode: string;
  specName: string;
  defaultLossRate: number | null;
}

export interface ProcessTemplateItem {
  id: string;
  processCode: string;
  processName: string;
  category: string;
  defaultLossRate: number;
  stdLaborHours: number | null;
  specs: ProcessTemplateSpec[];
}

export interface CreateBomProcessInput {
  seqNo: number;
  processId: string;
  specId?: string | null;
  lossRate: number;
  yieldRate: number;
  stdLaborHours?: number | null;
  qcCheckpoint?: boolean;
  instructionParams?: Record<string, unknown> | null;
  operatingInstructions?: string | null;
  inputs?: ProcessInputItem[];
  outputs?: ProcessOutputItem[];
}

export interface CreateBomInput {
  bomCode: string;
  bomName: string;
  bomType: "SINGLE" | "COMPOSITE" | "PACKAGING";
  outputItemCode: string;
  batchQty?: number;
  batchUnit: string;
  productionLineId?: string | null;
  routeCode?: string | null;
  overrideTotalYield?: boolean;
  totalYieldRate?: number | null;
  isResearch?: boolean;
  processes?: CreateBomProcessInput[];
}
