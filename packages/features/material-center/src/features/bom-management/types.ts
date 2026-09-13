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
}
