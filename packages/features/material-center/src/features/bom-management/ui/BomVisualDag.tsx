"use client";

import React from "react";
import { ArrowRight, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@base/ui";

export interface DagProcess {
  seqNo: number;
  processName: string;
  lossRate: number;
  yieldRate: number;
  inputs: Array<{ itemCode: string; quantity: number; uom: string }>;
  outputs: Array<{ itemCode: string; quantity: number; uom: string }>;
}

export interface BomVisualDagProps {
  bomName: string;
  bomCode: string;
  outputItemCode: string;
  totalYieldRate: number | null;
  processes: DagProcess[];
}

export function BomVisualDag({
  bomName,
  bomCode,
  outputItemCode,
  totalYieldRate,
  processes,
}: BomVisualDagProps) {
  return (
    <div className="border rounded-lg p-6 bg-card space-y-6 shadow-sm">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground">{bomName}</h3>
            <Badge variant="outline" className="font-mono text-xs">
              {bomCode}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            产出交付品:{" "}
            <span className="font-semibold text-foreground">
              {outputItemCode}
            </span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">综合出成率</div>
          <div className="text-2xl font-black text-primary">
            {totalYieldRate ? `${totalYieldRate}%` : "100%"}
          </div>
        </div>
      </div>

      {/* DAG 节点流程横向布局 */}
      <div className="overflow-x-auto pb-4">
        <div className="flex items-center gap-4 min-w-max">
          {processes.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8">
              暂未配置工序流程
            </div>
          ) : (
            processes.map((proc, idx) => (
              <React.Fragment key={proc.seqNo}>
                {/* 工序节点卡片 */}
                <div className="border rounded-lg bg-background p-4 w-64 shadow-xs space-y-3 relative hover:border-primary/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      #{proc.seqNo}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      出成: {proc.yieldRate}%
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      {proc.processName}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      损耗率: {proc.lossRate}%
                    </p>
                  </div>

                  {/* 投入物料 */}
                  <div className="border-t pt-2 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      投入 (Inputs)
                    </span>
                    {proc.inputs.map((inp, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-xs bg-muted/30 px-2 py-1 rounded"
                      >
                        <span className="font-mono">{inp.itemCode}</span>
                        <span className="font-medium">
                          {inp.quantity} {inp.uom}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 产出物料 */}
                  <div className="border-t pt-2 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      产出 (Outputs)
                    </span>
                    {proc.outputs.map((out, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium"
                      >
                        <span className="font-mono">{out.itemCode}</span>
                        <span>
                          {out.quantity} {out.uom}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 连接箭头 */}
                {idx < processes.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
              </React.Fragment>
            ))
          )}

          {/* 最终产出节点 */}
          <ArrowRight className="w-5 h-5 text-primary shrink-0" />
          <div className="border-2 border-primary rounded-lg bg-primary/5 p-4 w-52 shadow-xs space-y-2">
            <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
              <CheckCircle className="w-4 h-4" /> 最终交付产出
            </div>
            <div className="font-bold text-sm text-foreground font-mono">
              {outputItemCode}
            </div>
            <p className="text-xs text-muted-foreground">
              达到入库或配送交付标准
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
