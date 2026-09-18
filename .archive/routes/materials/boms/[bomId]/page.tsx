import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers, Clock } from "lucide-react";
import { Button, Badge } from "@base/ui";
import { getBomDetailQuery } from "@base/feature-material-center/bom-management/server";
import {
  BomVisualDag,
  type DagProcess,
} from "@base/feature-material-center/bom-management";

interface BomDetailPageProps {
  params: Promise<{ bomId: string }>;
}

interface RawProcessInput {
  itemCode: string;
  quantity: number;
  uom: string;
  materialRole?: "FLOW" | "SUB_BOM" | "PURCHASE";
}

interface RawProcessOutput {
  itemCode: string;
  quantity: number;
  uom: string;
  outputType?: "MAIN" | "BYPRODUCT" | "SCRAP";
  materialRole?: "FLOW" | "FINAL";
}

interface RawBomProcess {
  seqNo: number;
  processId: string;
  process?: { processName: string };
  specId?: string | null;
  spec?: { specName: string } | null;
  lossRate: number;
  yieldRate: number;
  stdLaborHours?: number | null;
  inputs?: RawProcessInput[];
  outputs?: RawProcessOutput[];
}

export default async function BomDetailPage({ params }: BomDetailPageProps) {
  const { bomId } = await params;
  const bom = await getBomDetailQuery(bomId);

  if (!bom) {
    notFound();
  }

  // SAFETY: bom.processes is serialized from Prisma BomProcess relation containing step inputs and outputs
  const rawProcesses = (bom.processes || []) as unknown as RawBomProcess[];

  const dagProcesses: DagProcess[] = rawProcesses.map((p: RawBomProcess) => ({
    seqNo: p.seqNo,
    processId: p.processId,
    processName: p.process?.processName || `工序 #${p.seqNo}`,
    specId: p.specId || null,
    specName: p.spec?.specName || null,
    lossRate: Number(p.lossRate),
    yieldRate: Number(p.yieldRate),
    stdLaborHours: p.stdLaborHours ? Number(p.stdLaborHours) : null,
    inputs: (p.inputs || []).map((inp: RawProcessInput) => ({
      itemCode: inp.itemCode,
      quantity: Number(inp.quantity),
      uom: inp.uom,
      materialRole: inp.materialRole || "FLOW",
    })),
    outputs: (p.outputs || []).map((out: RawProcessOutput) => ({
      itemCode: out.itemCode,
      quantity: Number(out.quantity),
      uom: out.uom,
      outputType: out.outputType || "MAIN",
      materialRole: out.materialRole || "FINAL",
    })),
  }));

  const typeMap: Record<string, string> = {
    SINGLE: "单品初加工",
    COMPOSITE: "配方组合调理",
    PACKAGING: "定量包装封口",
  };

  return (
    <div className="space-y-6">
      {/* 顶部导航与面包屑 */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link href="/materials/boms">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回 BOM 清单
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              {bom.bomName}
              <Badge variant="outline" className="font-mono text-xs">
                {bom.version}
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              BOM 编号:{" "}
              <span className="font-mono font-medium">{bom.bomCode}</span> ·
              分类: {typeMap[bom.bomType] || bom.bomType} · 生产线:{" "}
              {bom.productionLine?.lineName || "通用车间"}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-muted-foreground">综合出成率</div>
          <div className="text-2xl font-black text-primary tabular-nums tracking-tight">
            {bom.totalYieldRate ? `${bom.totalYieldRate}%` : "100%"}
          </div>
        </div>
      </div>

      {/* DAG 可视化拓扑图 */}
      <BomVisualDag
        bomId={bom.id}
        bomName={bom.bomName}
        bomCode={bom.bomCode}
        bomType={bom.bomType}
        version={bom.version}
        outputItemCode={bom.outputItemCode}
        outputItemName={bom.outputItem?.itemName}
        batchQty={bom.batchQty}
        batchUnit={bom.batchUnit}
        totalYieldRate={bom.totalYieldRate ? Number(bom.totalYieldRate) : null}
        overrideTotalYield={bom.overrideTotalYield}
        processes={dagProcesses}
        showDetailLink={false}
      />

      {/* 工序明细详表 */}
      <div className="border border-border rounded-xl p-5 bg-card shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-primary" />
          工序分步投入产出结构清单
        </h3>

        {dagProcesses.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            暂未配置工序流程
          </div>
        ) : (
          <div className="space-y-4">
            {dagProcesses.map((proc: DagProcess) => (
              <div
                key={proc.seqNo}
                className="border border-border rounded-lg p-4 bg-muted/20 space-y-3"
              >
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      步骤 #{proc.seqNo}
                    </span>
                    <span className="font-bold text-sm text-foreground">
                      {proc.processName}
                    </span>
                    {proc.specName && (
                      <Badge variant="secondary" className="text-xs">
                        {proc.specName}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 tabular-nums">
                      出成率: {proc.yieldRate}%
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      损耗率: {proc.lossRate}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* 投入 */}
                  <div className="bg-background border border-border rounded-md p-2.5 space-y-1.5">
                    <div className="font-semibold text-foreground text-[11px] uppercase">
                      本步投入物料 ({proc.inputs.length})
                    </div>
                    {proc.inputs.map((inp, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center py-1 border-b border-border/50 last:border-0"
                      >
                        <span className="font-mono">{inp.itemCode}</span>
                        <span className="font-semibold tabular-nums">
                          {inp.quantity} {inp.uom}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 产出 */}
                  <div className="bg-background border border-border rounded-md p-2.5 space-y-1.5">
                    <div className="font-semibold text-foreground text-[11px] uppercase">
                      本步产出物料 ({proc.outputs.length})
                    </div>
                    {proc.outputs.map((out, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center py-1 border-b border-border/50 last:border-0 text-primary"
                      >
                        <span className="font-mono">{out.itemCode}</span>
                        <span className="font-bold tabular-nums">
                          {out.quantity} {out.uom}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
