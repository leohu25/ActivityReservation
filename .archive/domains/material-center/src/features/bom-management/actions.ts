"use server";
import { StandardAction } from "@base/authorization";

import {
  defineServerAction,
  toPlainData,
  MasterDataStatus,
} from "@base/shared";
import type { TenantPrismaNamespace } from "@base/db-tenant";
import {
  getTenantMaterialContext,
  assertMaterialAbility,
} from "../../assembly/context";
import { BomHeaderSubject, BomAction } from "./contract";
import { BomCalculatorEngine } from "./service";

export const createBomAction = defineServerAction(
  async (input: {
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
    processes?: Array<{
      seqNo: number;
      processId: string;
      specId?: string | null;
      lossRate: number;
      yieldRate: number;
      stdLaborHours?: number | null;
      qcCheckpoint?: boolean;
      instructionParams?: Record<string, unknown> | null;
      operatingInstructions?: string | null;
      inputs?: Array<{
        itemCode: string;
        quantity: number;
        uom: string;
        materialRole: "FLOW" | "SUB_BOM" | "PURCHASE";
        proportion?: number | null;
        prevProcessSeq?: number | null;
        childBomId?: string | null;
      }>;
      outputs?: Array<{
        itemCode: string;
        quantity: number;
        uom: string;
        outputType: "MAIN" | "BYPRODUCT" | "SCRAP";
        materialRole: "FLOW" | "FINAL";
        nextProcessSeq?: number | null;
      }>;
    }>;
  }) => {
    const { client, ability, userId, employeeProfile } =
      await getTenantMaterialContext();
    assertMaterialAbility(ability, StandardAction.CREATE, BomHeaderSubject);

    // 1. 自动计算综合出成率
    const calcProcesses = (input.processes || []).map((p) => ({
      seqNo: p.seqNo,
      lossRate: p.lossRate,
      yieldRate: p.yieldRate,
    }));
    const finalTotalYieldRate = BomCalculatorEngine.calculateTotalYieldRate({
      overrideTotalYield: input.overrideTotalYield || false,
      totalYieldRate: input.totalYieldRate,
      processes: calcProcesses,
    });

    // 2. 预先解析或自动创建工序主数据，确保外键 processId 100% 存在且有效
    const resolvedProcessMap = new Map<string, string>();
    const resolvedProcesses = [];

    for (const p of input.processes || []) {
      const rawProcessId = p.processId?.trim() || "";
      let validProcessId: string = "";

      if (resolvedProcessMap.has(rawProcessId)) {
        validProcessId = resolvedProcessMap.get(rawProcessId)!;
      } else {
        // 2.1 优先通过主键 id 查找未删除记录
        const byId = rawProcessId
          ? await client.processMaster.findFirst({
              where: {
                id: rawProcessId,
                isDeleted: false,
              },
            })
          : null;

        if (byId) {
          validProcessId = byId.id;
        } else {
          // 2.2 若按 id 未查到，尝试按 processCode 查找
          const candidateCode = rawProcessId.toUpperCase().startsWith("PROC-")
            ? rawProcessId.toUpperCase()
            : `PROC-${rawProcessId.toUpperCase() || "GEN"}`;
          const normalizedCode = candidateCode.slice(0, 30);

          const byCode = await client.processMaster.findFirst({
            where: {
              OR: [
                {
                  processCode: rawProcessId,
                },
                {
                  processCode: normalizedCode,
                },
              ],
              isDeleted: false,
            },
          });

          if (byCode) {
            validProcessId = byCode.id;
          } else {
            // 2.3 检查是否存在历史记录（包括被软删除的），若存在则恢复启用
            const existingAny = await client.processMaster.findFirst({
              where: {
                OR: [
                  {
                    processCode: rawProcessId,
                  },
                  {
                    processCode: normalizedCode,
                  },
                ],
              },
            });

            if (existingAny) {
              if (
                existingAny.isDeleted ||
                existingAny.status !== MasterDataStatus.ACTIVE
              ) {
                await client.processMaster.update({
                  where: {
                    id: existingAny.id,
                  },
                  data: {
                    isDeleted: false,
                    deletedAt: null,
                    deletedById: null,
                    status: MasterDataStatus.ACTIVE,
                    updatedById: userId,
                  },
                });
              }
              validProcessId = existingAny.id;
            } else {
              // 2.4 数据库中完全不存在，自动 upsert/create 默认工序主数据
              const defaultNameMap: Record<
                string,
                {
                  name: string;
                  category: string;
                }
              > = {
                "PROC-CLEAN": {
                  name: "分拣清洗",
                  category: "CLEAN",
                },
                "PROC-PEEL": {
                  name: "去皮精修",
                  category: "PRE_TREAT",
                },
                "PROC-CUT": {
                  name: "切割切丝",
                  category: "CUT",
                },
                "PROC-SEASON": {
                  name: "配方调理",
                  category: "SEASON",
                },
                "PROC-COOK": {
                  name: "熟化加工",
                  category: "COOK",
                },
                "PROC-PACK": {
                  name: "定量分装",
                  category: "PACK",
                },
              };
              const preset = defaultNameMap[normalizedCode] || {
                name: rawProcessId.slice(0, 50) || "通用加工",
                category: "CUT",
              };

              const createdProcess = await client.processMaster.create({
                data: {
                  processCode: normalizedCode,
                  processName: preset.name,
                  category: preset.category,
                  defaultLossRate: p.lossRate ?? 0,
                  stdLaborHours: p.stdLaborHours ?? 0.5,
                  status: MasterDataStatus.ACTIVE,
                  createdById: userId,
                  deptId: employeeProfile?.departmentId || null,
                },
              });
              validProcessId = createdProcess.id;
            }
          }
        }
        resolvedProcessMap.set(rawProcessId, validProcessId);
      }

      // 2.5 校验规格 specId 是否有效（若无效则置空，避免规格外键失效报错）
      let validSpecId: string | null = null;
      if (p.specId) {
        const spec = await client.processSpec.findFirst({
          where: {
            id: p.specId,
            isDeleted: false,
          },
        });
        if (spec) {
          validSpecId = spec.id;
        }
      }

      resolvedProcesses.push({
        ...p,
        processId: validProcessId,
        specId: validSpecId,
      });
    }

    // 3. 事务内完整落库
    const created = await client.bomHeader.create({
      data: {
        bomCode: input.bomCode.trim(),
        bomName: input.bomName.trim(),
        bomType: input.bomType,
        version: "V1.0",
        isResearch: input.isResearch ?? false,
        isDefault: true,
        outputItemCode: input.outputItemCode,
        batchQty: input.batchQty ?? 1,
        batchUnit: input.batchUnit,
        productionLineId: input.productionLineId || null,
        routeCode: input.routeCode || null,
        overrideTotalYield: input.overrideTotalYield ?? false,
        totalYieldRate: finalTotalYieldRate.toNumber(),
        status: "DRAFT",
        createdById: userId,
        deptId: employeeProfile?.departmentId || null,
        processes: {
          create: resolvedProcesses.map((p) => ({
            seqNo: p.seqNo,
            lossRate: p.lossRate,
            yieldRate: p.yieldRate,
            stdLaborHours: p.stdLaborHours ?? null,
            qcCheckpoint: p.qcCheckpoint ?? false,
            instructionParams: p.instructionParams
              ? (p.instructionParams as TenantPrismaNamespace.InputJsonValue)
              : undefined,
            operatingInstructions: p.operatingInstructions || null,
            process: {
              connect: {
                id: p.processId,
              },
            },
            ...(p.specId
              ? {
                  spec: {
                    connect: {
                      id: p.specId,
                    },
                  },
                }
              : {}),
            inputs: {
              create: (p.inputs || []).map((inp) => ({
                itemCode: inp.itemCode,
                quantity: inp.quantity,
                uom: inp.uom,
                materialRole: inp.materialRole,
                proportion: inp.proportion ?? null,
                prevProcessSeq: inp.prevProcessSeq ?? null,
                childBomId: inp.childBomId || null,
              })),
            },
            outputs: {
              create: (p.outputs || []).map((out) => ({
                itemCode: out.itemCode,
                quantity: out.quantity,
                uom: out.uom,
                outputType: out.outputType,
                materialRole: out.materialRole,
                nextProcessSeq: out.nextProcessSeq ?? null,
              })),
            },
          })),
        },
      },
    });

    return toPlainData(created);
  },
);

export const publishBomAction = defineServerAction(
  async (input: { bomId: string }) => {
    const { client, ability, userId } = await getTenantMaterialContext();
    assertMaterialAbility(ability, BomAction.PUBLISH, BomHeaderSubject);

    // 1. 获取完整 BOM 信息并检测依赖有向图环路
    const bom = await client.bomHeader.findUnique({
      where: { id: input.bomId },
      include: {
        processes: {
          include: { inputs: true },
        },
      },
    });

    if (!bom) throw new Error("BOM 不存在");

    // 收集子 BOM 依赖并执行 DFS 检测
    const allBoms = await client.bomHeader.findMany({
      where: { isDeleted: false },
      include: {
        processes: {
          include: { inputs: true },
        },
      },
    });

    const graph = new Map<string, string[]>();
    for (const b of allBoms) {
      const subBoms = b.processes
        .flatMap((p) => p.inputs)
        .filter((inp) => inp.materialRole === "SUB_BOM" && inp.childBomId)
        .map((inp) => inp.childBomId as string);
      graph.set(b.bomCode, subBoms);
    }

    BomCalculatorEngine.assertNoCyclicDependency(bom.bomCode, graph);

    // 2. 更新状态为正式量产已生效 (ACTIVE)
    const published = await client.bomHeader.update({
      where: { id: input.bomId },
      data: {
        status: MasterDataStatus.ACTIVE,
        isResearch: false,
        updatedById: userId,
      },
    });

    return toPlainData(published);
  },
);

export const createNewBomVersionAction = defineServerAction(
  async (input: { sourceBomId: string; newVersion: string }) => {
    const { client, ability, userId, employeeProfile } =
      await getTenantMaterialContext();
    assertMaterialAbility(
      ability,
      BomAction.CREATE_NEW_VERSION,
      BomHeaderSubject,
    );

    const source = await client.bomHeader.findUnique({
      where: { id: input.sourceBomId },
      include: {
        processes: {
          include: {
            inputs: true,
            outputs: true,
          },
        },
      },
    });

    if (!source) throw new Error("源 BOM 不存在");

    // 另存新版本：创建新的草稿版本
    const cloned = await client.bomHeader.create({
      data: {
        bomCode: `${source.bomCode}-${input.newVersion.toLowerCase()}`,
        bomName: `${source.bomName} (${input.newVersion})`,
        bomType: source.bomType,
        version: input.newVersion,
        isResearch: source.isResearch,
        isDefault: false,
        outputItemCode: source.outputItemCode,
        batchQty: source.batchQty,
        batchUnit: source.batchUnit,
        productionLineId: source.productionLineId,
        routeCode: source.routeCode,
        overrideTotalYield: source.overrideTotalYield,
        totalYieldRate: source.totalYieldRate,
        status: "DRAFT",
        createdById: userId,
        deptId: employeeProfile?.departmentId || null,
        processes: {
          create: source.processes.map((p) => ({
            seqNo: p.seqNo,
            lossRate: p.lossRate,
            yieldRate: p.yieldRate,
            stdLaborHours: p.stdLaborHours,
            qcCheckpoint: p.qcCheckpoint,
            instructionParams: p.instructionParams
              ? (p.instructionParams as TenantPrismaNamespace.InputJsonValue)
              : undefined,
            operatingInstructions: p.operatingInstructions,
            process: {
              connect: {
                id: p.processId,
              },
            },
            ...(p.specId
              ? {
                  spec: {
                    connect: {
                      id: p.specId,
                    },
                  },
                }
              : {}),
            inputs: {
              create: p.inputs.map((inp) => ({
                itemCode: inp.itemCode,
                quantity: inp.quantity,
                uom: inp.uom,
                materialRole: inp.materialRole,
                proportion: inp.proportion,
                prevProcessSeq: inp.prevProcessSeq,
                childBomId: inp.childBomId,
              })),
            },
            outputs: {
              create: p.outputs.map((out) => ({
                itemCode: out.itemCode,
                quantity: out.quantity,
                uom: out.uom,
                outputType: out.outputType,
                materialRole: out.materialRole,
                nextProcessSeq: out.nextProcessSeq,
              })),
            },
          })),
        },
      },
    });

    return toPlainData(cloned);
  },
);
