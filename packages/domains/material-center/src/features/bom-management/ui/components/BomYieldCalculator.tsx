"use client";

import { Input, Label } from "@base/ui";
import { Sparkles } from "lucide-react";

export interface BomYieldCalculatorProps {
  readonly stepId: string;
  readonly lossRate: number;
  readonly yieldRate: number;
  readonly stdLaborHours: number | null;
  readonly qcCheckpoint: boolean;
  readonly onLossRateChange: (stepId: string, loss: number) => void;
  readonly onYieldRateChange: (stepId: string, yieldRate: number) => void;
  readonly onLaborHoursChange: (stepId: string, hours: number | null) => void;
  readonly onQcChange: (stepId: string, qc: boolean) => void;
}

export function BomYieldCalculator({
  stepId,
  lossRate,
  yieldRate,
  stdLaborHours,
  qcCheckpoint,
  onLossRateChange,
  onYieldRateChange,
  onLaborHoursChange,
  onQcChange,
}: BomYieldCalculatorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 p-2.5 rounded border border-border/50 text-xs">
      <div>
        <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
          <span>损耗率 (%)</span>
        </Label>
        <Input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={lossRate}
          onChange={(e) =>
            onLossRateChange(stepId, parseFloat(e.target.value) || 0)
          }
          className="h-7 text-xs font-mono mt-1"
        />
      </div>

      <div>
        <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Sparkles className="size-3 text-emerald-500" />
          <span>出成率 (%)</span>
        </Label>
        <Input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={yieldRate}
          onChange={(e) =>
            onYieldRateChange(stepId, parseFloat(e.target.value) || 0)
          }
          className="h-7 text-xs font-mono mt-1 text-emerald-600 font-semibold"
        />
      </div>

      <div>
        <Label className="text-[11px] text-muted-foreground">
          标准工时 (小时)
        </Label>
        <Input
          type="number"
          min="0"
          step="0.1"
          placeholder="可选"
          value={stdLaborHours ?? ""}
          onChange={(e) => {
            const val = e.target.value ? parseFloat(e.target.value) : null;
            onLaborHoursChange(stepId, val);
          }}
          className="h-7 text-xs font-mono mt-1"
        />
      </div>

      <div className="flex flex-col justify-center">
        <Label className="text-[11px] text-muted-foreground mb-1.5">
          工序质检
        </Label>
        <label className="flex items-center gap-1.5 cursor-pointer text-xs">
          <input
            type="checkbox"
            checked={qcCheckpoint}
            onChange={(e) => onQcChange(stepId, e.target.checked)}
            className="rounded border-border"
          />
          <span className="text-[11px] text-foreground">设为质量必检点</span>
        </label>
      </div>
    </div>
  );
}
