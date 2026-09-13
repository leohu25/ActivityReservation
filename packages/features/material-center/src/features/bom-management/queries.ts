import "server-only";
import { StandardAction } from "@base/authorization";

import {
  getTenantMaterialContext,
  assertMaterialAbility,
} from "../../assembly/context";
import {
  BomHeaderSubject,
  ProcessMasterSubject,
  ProductionLineSubject,
} from "./contract";

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

export async function getBomsQuery(filter?: {
  bomType?: string;
  isResearch?: boolean;
  search?: string;
}): Promise<BomListItem[]> {
  const { client, ability } = await getTenantMaterialContext();
  assertMaterialAbility(ability, StandardAction.READ, BomHeaderSubject);

  const boms = await (client as any).bomHeader.findMany({
    where: {
      isDeleted: false,
      ...(filter?.bomType ? { bomType: filter.bomType } : {}),
      ...(filter?.isResearch === undefined
        ? {}
        : { isResearch: filter.isResearch }),
      ...(filter?.search
        ? {
            OR: [
              { bomName: { contains: filter.search } },
              { bomCode: { contains: filter.search } },
              { outputItemCode: { contains: filter.search } },
            ],
          }
        : {}),
    },
    include: {
      outputItem: { select: { itemName: true } },
      productionLine: { select: { lineName: true } },
      processes: {
        include: {
          inputs: { select: { itemCode: true } },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return boms.map((b: any) => {
    const rawInputs = b.processes.flatMap((p: any) =>
      p.inputs.map((i: any) => i.itemCode),
    );
    const uniqueInputs = Array.from(new Set(rawInputs)).slice(0, 3).join(", ");

    return {
      id: b.id,
      bomCode: b.bomCode,
      bomName: b.bomName,
      bomType: b.bomType,
      version: b.version,
      isResearch: b.isResearch,
      isDefault: b.isDefault,
      outputItemCode: b.outputItemCode,
      outputItemName: b.outputItem.itemName,
      batchQty: Number(b.batchQty),
      batchUnit: b.batchUnit,
      productionLineId: b.productionLineId,
      productionLineName: b.productionLine?.lineName ?? null,
      totalYieldRate: b.totalYieldRate ? Number(b.totalYieldRate) : null,
      overrideTotalYield: b.overrideTotalYield,
      processCount: b.processes.length,
      inputItemSummary: uniqueInputs || "-",
      status: b.status,
      effectiveDate: b.effectiveDate.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    };
  });
}

export async function getBomDetailQuery(bomId: string) {
  const { client, ability } = await getTenantMaterialContext();
  assertMaterialAbility(ability, StandardAction.READ, BomHeaderSubject);

  const bom = await (client as any).bomHeader.findUnique({
    where: { id: bomId },
    include: {
      outputItem: true,
      productionLine: true,
      processes: {
        orderBy: [{ seqNo: "asc" }],
        include: {
          process: true,
          spec: true,
          inputs: true,
          outputs: true,
        },
      },
    },
  });

  if (!bom) return null;

  return {
    ...bom,
    batchQty: Number(bom.batchQty),
    totalYieldRate: bom.totalYieldRate ? Number(bom.totalYieldRate) : null,
    processes: bom.processes.map((p: any) => ({
      ...p,
      lossRate: Number(p.lossRate),
      yieldRate: Number(p.yieldRate),
      stdLaborHours: p.stdLaborHours ? Number(p.stdLaborHours) : null,
      inputs: p.inputs.map((inp: any) => ({
        ...inp,
        quantity: Number(inp.quantity),
        proportion: inp.proportion ? Number(inp.proportion) : null,
      })),
      outputs: p.outputs.map((out: any) => ({
        ...out,
        quantity: Number(out.quantity),
      })),
    })),
  };
}

export async function getProductionLinesQuery() {
  const { client, ability } = await getTenantMaterialContext();
  assertMaterialAbility(ability, StandardAction.READ, ProductionLineSubject);

  return (client as any).productionLine.findMany({
    where: { isDeleted: false, status: "ACTIVE" },
    orderBy: [{ lineCode: "asc" }],
  });
}

export async function getProcessTemplatesQuery() {
  const { client, ability } = await getTenantMaterialContext();
  assertMaterialAbility(ability, StandardAction.READ, ProcessMasterSubject);

  return (client as any).processMaster.findMany({
    where: { isDeleted: false, status: "ACTIVE" },
    include: {
      specs: { where: { isDeleted: false, status: "ACTIVE" } },
    },
    orderBy: [{ processCode: "asc" }],
  });
}
