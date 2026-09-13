import { notFound } from "next/navigation";
import { getBomDetailQuery } from "@base/feature-material-center/bom-management/server";
import { BomVisualDag } from "@base/feature-material-center/bom-management";

interface BomDetailPageProps {
  params: Promise<{ bomId: string }>;
}

interface ProcessInputRaw {
  itemCode: string;
  quantity: number | string;
  uom: string;
}

interface ProcessOutputRaw {
  itemCode: string;
  quantity: number | string;
  uom: string;
}

interface ProcessDetailRaw {
  seqNo: number;
  process: { processName: string };
  lossRate: number | string;
  yieldRate: number | string;
  inputs: ProcessInputRaw[];
  outputs: ProcessOutputRaw[];
}

export default async function BomDetailPage({ params }: BomDetailPageProps) {
  const { bomId } = await params;
  const bom = await getBomDetailQuery(bomId);

  if (!bom) {
    notFound();
  }

  const rawProcesses = bom.processes as unknown as ProcessDetailRaw[];
  const dagProcesses = rawProcesses.map((p) => ({
    seqNo: p.seqNo,
    processName: p.process.processName,
    lossRate: Number(p.lossRate),
    yieldRate: Number(p.yieldRate),
    inputs: p.inputs.map((inp) => ({
      itemCode: inp.itemCode,
      quantity: Number(inp.quantity),
      uom: inp.uom,
    })),
    outputs: p.outputs.map((out) => ({
      itemCode: out.itemCode,
      quantity: Number(out.quantity),
      uom: out.uom,
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          工艺 BOM 流程详情
        </h1>
        <p className="text-sm text-muted-foreground">
          {bom.bomName} ({bom.version}) — 工序拓扑流转与投入产出详情
        </p>
      </div>

      <BomVisualDag
        bomName={bom.bomName}
        bomCode={bom.bomCode}
        outputItemCode={bom.outputItemCode}
        totalYieldRate={bom.totalYieldRate ? Number(bom.totalYieldRate) : null}
        processes={dagProcesses}
      />
    </div>
  );
}
