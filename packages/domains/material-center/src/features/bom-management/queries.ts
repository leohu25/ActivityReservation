import "server-only";
import { StandardAction } from "@base/authorization";
import { MasterDataStatus } from "@base/shared";

import {
  getTenantMaterialContext,
  assertMaterialAbility,
} from "../../assembly/context";
import {
  BomHeaderSubject,
  ProcessMasterSubject,
  ProductionLineSubject,
} from "./contract";
import type { BomListItem, ProcessTemplateItem, DagProcess } from "./types";

export type { BomListItem, ProcessTemplateItem, DagProcess };

export async function getBomsQuery(filter?: {
  bomType?: string;
  isResearch?: boolean;
  search?: string;
}): Promise<BomListItem[]> {
  const { client, ability } = await getTenantMaterialContext();
  assertMaterialAbility(ability, StandardAction.READ, BomHeaderSubject);

  const boms = await client.bomHeader.findMany({
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
        orderBy: [{ seqNo: "asc" }],
        include: {
          process: { select: { processName: true } },
          spec: { select: { specName: true } },
          inputs: true,
          outputs: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return boms.map((b) => {
    const rawInputs = b.processes.flatMap((p) =>
      (p.inputs || []).map((i) => i.itemCode),
    );
    const uniqueInputs = Array.from(new Set(rawInputs)).slice(0, 3).join(", ");

    const dagProcesses: DagProcess[] = (b.processes || []).map((p) => ({
      seqNo: p.seqNo,
      processId: p.processId,
      processName: p.process?.processName || `工序 #${p.seqNo}`,
      specId: p.specId || null,
      specName: p.spec?.specName || null,
      lossRate: Number(p.lossRate),
      yieldRate: Number(p.yieldRate),
      stdLaborHours: p.stdLaborHours ? Number(p.stdLaborHours) : null,
      inputs: (p.inputs || []).map((inp) => ({
        itemCode: inp.itemCode,
        quantity: Number(inp.quantity),
        uom: inp.uom,
        materialRole: inp.materialRole as "FLOW" | "SUB_BOM" | "PURCHASE",
        proportion: inp.proportion ? Number(inp.proportion) : null,
        prevProcessSeq: inp.prevProcessSeq ?? null,
        childBomId: inp.childBomId || null,
      })),
      outputs: (p.outputs || []).map((out) => ({
        itemCode: out.itemCode,
        quantity: Number(out.quantity),
        uom: out.uom,
        outputType: out.outputType as "MAIN" | "BYPRODUCT" | "SCRAP",
        materialRole: out.materialRole as "FLOW" | "FINAL",
        nextProcessSeq: out.nextProcessSeq ?? null,
      })),
    }));

    return {
      id: b.id,
      bomCode: b.bomCode,
      bomName: b.bomName,
      bomType: b.bomType,
      version: b.version,
      isResearch: b.isResearch,
      isDefault: b.isDefault,
      outputItemCode: b.outputItemCode,
      outputItemName: b.outputItem?.itemName || b.outputItemCode,
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
      processes: dagProcesses,
    };
  });
}

export async function getBomDetailQuery(bomId: string) {
  const { client, ability } = await getTenantMaterialContext();
  assertMaterialAbility(ability, StandardAction.READ, BomHeaderSubject);

  const bom = await client.bomHeader.findUnique({
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
    processes: (bom.processes || []).map((p) => ({
      ...p,
      lossRate: Number(p.lossRate),
      yieldRate: Number(p.yieldRate),
      stdLaborHours: p.stdLaborHours ? Number(p.stdLaborHours) : null,
      inputs: (p.inputs || []).map((inp) => ({
        ...inp,
        quantity: Number(inp.quantity),
        proportion: inp.proportion ? Number(inp.proportion) : null,
      })),
      outputs: (p.outputs || []).map((out) => ({
        ...out,
        quantity: Number(out.quantity),
      })),
    })),
  };
}

export async function getProductionLinesQuery() {
  const { client, ability } = await getTenantMaterialContext();
  assertMaterialAbility(ability, StandardAction.READ, ProductionLineSubject);

  const lines = await client.productionLine.findMany({
    where: { isDeleted: false, status: MasterDataStatus.ACTIVE },
    orderBy: [{ lineCode: "asc" }],
  });

  return lines.map((l) => ({
    id: l.id,
    lineCode: l.lineCode,
    lineName: l.lineName,
    workshopLocation: l.description ?? null,
    status: l.status,
  }));
}

export async function getProcessTemplatesQuery(): Promise<
  ProcessTemplateItem[]
> {
  const { client, ability } = await getTenantMaterialContext();
  assertMaterialAbility(ability, StandardAction.READ, ProcessMasterSubject);

  const templates = await client.processMaster.findMany({
    where: { isDeleted: false, status: MasterDataStatus.ACTIVE },
    include: {
      specs: { where: { isDeleted: false, status: MasterDataStatus.ACTIVE } },
    },
    orderBy: [{ processCode: "asc" }],
  });

  return templates.map((t) => ({
    id: t.id,
    processCode: t.processCode,
    processName: t.processName,
    category: t.category,
    defaultLossRate: Number(t.defaultLossRate),
    stdLaborHours: t.stdLaborHours ? Number(t.stdLaborHours) : null,
    specs: (t.specs || []).map((s) => ({
      id: s.id,
      specCode: s.specCode,
      specName: s.specName,
      defaultLossRate: s.defaultLossRate ? Number(s.defaultLossRate) : null,
    })),
  }));
}

export interface BomManagementPageData {
  readonly boms: BomListItem[] | null;
  readonly productionLines: Awaited<
    ReturnType<typeof getProductionLinesQuery>
  > | null;
  readonly processTemplates: ProcessTemplateItem[] | null;
  readonly canReadBom: boolean;
  readonly canReadLine: boolean;
  readonly canReadProcess: boolean;
}

export async function getBomManagementPageDataQuery(): Promise<BomManagementPageData> {
  const { ability } = await getTenantMaterialContext();
  const canReadBom = ability.can(StandardAction.READ, BomHeaderSubject);
  const canReadLine = ability.can(StandardAction.READ, ProductionLineSubject);
  const canReadProcess = ability.can(StandardAction.READ, ProcessMasterSubject);

  if (!canReadBom && !canReadLine && !canReadProcess) {
    assertMaterialAbility(ability, StandardAction.READ, BomHeaderSubject);
  }

  const [boms, productionLines, processTemplates] = await Promise.all([
    canReadBom ? getBomsQuery() : Promise.resolve(null),
    canReadLine ? getProductionLinesQuery() : Promise.resolve(null),
    canReadProcess ? getProcessTemplatesQuery() : Promise.resolve(null),
  ]);

  return {
    boms,
    productionLines,
    processTemplates,
    canReadBom,
    canReadLine,
    canReadProcess,
  };
}
