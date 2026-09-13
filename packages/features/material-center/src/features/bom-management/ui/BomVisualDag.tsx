"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  PackageCheck,
  CheckCircle2,
  Settings2,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";
import { Badge, Button } from "@base/ui";
import type { DagProcess } from "../types";

export interface BomVisualDagProps {
  bomId?: string;
  bomName: string;
  bomCode: string;
  bomType?: string;
  version?: string;
  outputItemCode: string;
  outputItemName?: string;
  batchQty?: number;
  batchUnit?: string;
  totalYieldRate: number | null;
  overrideTotalYield?: boolean;
  processes: DagProcess[];
  onConfigureFlow?: () => void;
  showDetailLink?: boolean;
}

export function BomVisualDag({
  bomId,
  bomName,
  bomCode,
  bomType,
  version,
  outputItemCode,
  outputItemName,
  batchQty,
  batchUnit,
  totalYieldRate,
  overrideTotalYield,
  processes,
  onConfigureFlow,
  showDetailLink = true,
}: BomVisualDagProps) {
  const typeMap: Record<string, string> = {
    SINGLE: "单品加工",
    COMPOSITE: "组合调理",
    PACKAGING: "定量包装",
  };

  const roleLabels: Record<string, { label: string; cls: string }> = {
    PURCHASE: { label: "采购领料", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    FLOW: { label: "工序流转", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    SUB_BOM: { label: "外部子BOM", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  };

  const outputTypeLabels: Record<string, { label: string; cls: string }> = {
    MAIN: { label: "主产出", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    BYPRODUCT: { label: "副产品", cls: "bg-orange-50 text-orange-700 border-orange-200" },
    SCRAP: { label: "废料", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  };

  return (
    <div className="border border-slate-200/80 rounded-xl p-5 bg-card space-y-5 shadow-xs">
      {/* 顶部 BOM 概览条 */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary" />
              {bomName}
            </h3>
            {version && (
              <Badge variant="outline" className="text-xs font-mono">
                {version}
              </Badge>
            )}
            {bomType && (
              <Badge variant="secondary" className="text-xs">
                {typeMap[bomType] || bomType}
              </Badge>
            )}
            <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {bomCode}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            产出交付品:{" "}
            <span className="font-semibold text-foreground">
              {outputItemName || outputItemCode}
            </span>
            <span className="font-mono ml-1 text-muted-foreground">
              ({outputItemCode})
            </span>
            {batchQty && batchUnit && (
              <span className="ml-2 font-medium text-slate-600">
                基准批量:{" "}
                <span className="tabular-nums font-mono">
                  {batchQty} {batchUnit}
                </span>
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
              <Sparkles className="w-3 h-3 text-amber-500" />
              综合出成率
              {overrideTotalYield && (
                <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                  人工覆盖
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-primary tabular-nums tracking-tight">
              {totalYieldRate ? `${totalYieldRate}%` : "100%"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onConfigureFlow && (
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={onConfigureFlow}
              >
                <Settings2 className="w-3.5 h-3.5 mr-1" />
                配置工序
              </Button>
            )}
            {showDetailLink && bomId && (
              <Link href={`/materials/boms/${bomId}`}>
                <Button variant="ghost" size="sm" className="cursor-pointer">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  流程详情
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* DAG 节点流程横向布局 */}
      <div className="overflow-x-auto pb-3 pt-1">
        <div className="flex items-center gap-3 min-w-max">
          {processes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 w-full">
              <Layers className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">
                当前 BOM 暂未配置工序流程与投料关系
              </p>
              <p className="text-xs text-muted-foreground/80 mt-1">
                点击下方按钮开启可视化工序编排，配置投入原料、加工损耗与产出中间品
              </p>
              {onConfigureFlow && (
                <Button
                  variant="default"
                  size="sm"
                  className="mt-4 cursor-pointer"
                  onClick={onConfigureFlow}
                >
                  <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                  立即配置工序流转
                </Button>
              )}
            </div>
          ) : (
            processes.map((proc, idx) => (
              <React.Fragment key={proc.seqNo}>
                {/* 工序节点卡片 */}
                <div className="border border-slate-200 rounded-xl bg-background p-4 w-72 shadow-xs space-y-3 relative hover:border-primary/60 transition-all hover:shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      步骤 #{proc.seqNo}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded tabular-nums">
                        出成 {proc.yieldRate}%
                      </span>
                      {proc.lossRate > 0 && (
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          损耗 {proc.lossRate}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      {proc.processName}
                    </h4>
                    {proc.specName && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        规格:{" "}
                        <span className="font-medium text-slate-700">
                          {proc.specName}
                        </span>
                      </p>
                    )}
                    {proc.stdLaborHours !== null && proc.stdLaborHours !== undefined && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        标准工时:{" "}
                        <span className="font-mono tabular-nums">
                          {proc.stdLaborHours}h
                        </span>
                      </p>
                    )}
                  </div>

                  {/* 投入物料 */}
                  <div className="border-t border-slate-100 pt-2 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-muted-foreground">
                        投入原料/子件
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {proc.inputs.length}项
                      </span>
                    </div>
                    {proc.inputs.length === 0 ? (
                      <div className="text-xs text-muted-foreground italic py-1">
                        无前置投入项
                      </div>
                    ) : (
                      proc.inputs.map((inp, i) => {
                        const role = inp.materialRole
                          ? roleLabels[inp.materialRole]
                          : null;
                        return (
                          <div
                            key={i}
                            className="flex justify-between items-center text-xs bg-slate-50 border border-slate-100/80 px-2 py-1 rounded"
                          >
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="font-mono font-medium truncate">
                                {inp.itemCode}
                              </span>
                              {role && (
                                <span
                                  className={`text-[9px] px-1 py-0.2 rounded border shrink-0 ${role.cls}`}
                                >
                                  {role.label}
                                </span>
                              )}
                            </div>
                            <span className="font-semibold tabular-nums shrink-0 ml-1">
                              {inp.quantity} {inp.uom}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* 产出物料 */}
                  <div className="border-t border-slate-100 pt-2 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-muted-foreground">
                        工序产出物料
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {proc.outputs.length}项
                      </span>
                    </div>
                    {proc.outputs.length === 0 ? (
                      <div className="text-xs text-muted-foreground italic py-1">
                        未配置产出
                      </div>
                    ) : (
                      proc.outputs.map((out, i) => {
                        const typeBadge = out.outputType
                          ? outputTypeLabels[out.outputType]
                          : null;
                        return (
                          <div
                            key={i}
                            className="flex justify-between items-center text-xs bg-primary/5 border border-primary/20 text-primary px-2 py-1 rounded font-medium"
                          >
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="font-mono truncate">
                                {out.itemCode}
                              </span>
                              {typeBadge && (
                                <span
                                  className={`text-[9px] px-1 py-0.2 rounded border shrink-0 ${typeBadge.cls}`}
                                >
                                  {typeBadge.label}
                                </span>
                              )}
                            </div>
                            <span className="font-bold tabular-nums shrink-0 ml-1">
                              {out.quantity} {out.uom}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 连接箭头 */}
                <ArrowRight className="w-5 h-5 text-slate-400 shrink-0 mx-1" />
              </React.Fragment>
            ))
          )}

          {/* 最终产出节点 */}
          <div className="border-2 border-emerald-500/80 rounded-xl bg-emerald-50/40 p-4 w-60 shadow-xs space-y-2 shrink-0">
            <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
              <PackageCheck className="w-4 h-4" /> 最终交付产成品
            </div>
            <div className="font-bold text-sm text-foreground">
              {outputItemName || outputItemCode}
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              {outputItemCode}
            </div>
            <div className="border-t border-emerald-200/80 pt-2 flex justify-between items-center text-xs text-emerald-800">
              <span>交付标准</span>
              <span className="font-semibold">检验合格入库</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
