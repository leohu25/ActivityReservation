"use client";

import {
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@base/ui";
import { Plus, Trash2 } from "lucide-react";
import type { StepInputItem, StepOutputItem } from "./bom-editor-types";

export interface BomItemRatioTableProps {
  readonly stepId: string;
  readonly inputs: readonly StepInputItem[];
  readonly outputs: readonly StepOutputItem[];
  readonly items: readonly {
    itemCode: string;
    itemName: string;
    baseUnit?: string;
  }[];
  readonly onAddInput: (stepId: string) => void;
  readonly onRemoveInput: (stepId: string, inputId: string) => void;
  readonly onUpdateInput: (
    stepId: string,
    inputId: string,
    field: string,
    val: unknown,
  ) => void;
  readonly onAddOutput: (stepId: string) => void;
  readonly onRemoveOutput: (stepId: string, outputId: string) => void;
  readonly onUpdateOutput: (
    stepId: string,
    outputId: string,
    field: string,
    val: unknown,
  ) => void;
}

export function BomItemRatioTable({
  stepId,
  inputs,
  outputs,
  items,
  onAddInput,
  onRemoveInput,
  onUpdateInput,
  onAddOutput,
  onRemoveOutput,
  onUpdateOutput,
}: BomItemRatioTableProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 投入物料 */}
      <div className="border border-border/80 rounded-md p-3 bg-muted/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-blue-500" />
            投入物料 / 原料配比
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 text-[11px] px-2"
            onClick={() => onAddInput(stepId)}
          >
            <Plus className="size-3 mr-1" />
            添加投入
          </Button>
        </div>

        {inputs.length === 0 ? (
          <div className="text-[11px] text-muted-foreground text-center py-4 border border-dashed rounded">
            暂无投入物料，请点击上方添加
          </div>
        ) : (
          <div className="space-y-1.5">
            {inputs.map((inp) => (
              <div
                key={inp.id}
                className="flex items-center gap-2 bg-card p-1.5 rounded border border-border/60 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <Select
                    value={inp.itemCode}
                    onValueChange={(val) => {
                      const selectedItem = items.find(
                        (i) => i.itemCode === val,
                      );
                      onUpdateInput(stepId, inp.id, "itemCode", val);
                      if (selectedItem?.baseUnit) {
                        onUpdateInput(
                          stepId,
                          inp.id,
                          "uom",
                          selectedItem.baseUnit,
                        );
                      }
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="选择物料" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[220px]">
                      {items.map((it) => (
                        <SelectItem
                          key={it.itemCode}
                          value={it.itemCode}
                          className="text-xs"
                        >
                          {it.itemName} ({it.itemCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-20">
                  <Input
                    type="number"
                    min="0.001"
                    step="0.1"
                    value={inp.quantity}
                    onChange={(e) =>
                      onUpdateInput(
                        stepId,
                        inp.id,
                        "quantity",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="h-7 text-xs text-right font-mono"
                  />
                </div>

                <div className="w-12 text-[11px] text-muted-foreground font-mono text-center">
                  {inp.uom}
                </div>

                <div className="w-20">
                  <Select
                    value={inp.materialRole}
                    onValueChange={(val) =>
                      onUpdateInput(stepId, inp.id, "materialRole", val)
                    }
                  >
                    <SelectTrigger className="h-7 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PURCHASE" className="text-xs">
                        采购件
                      </SelectItem>
                      <SelectItem value="FLOW" className="text-xs">
                        中间流转
                      </SelectItem>
                      <SelectItem value="SUB_BOM" className="text-xs">
                        子BOM件
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveInput(stepId, inp.id)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 产生物料 */}
      <div className="border border-border/80 rounded-md p-3 bg-muted/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            产生物料 / 副产品 / 废料
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 text-[11px] px-2"
            onClick={() => onAddOutput(stepId)}
          >
            <Plus className="size-3 mr-1" />
            添加产出
          </Button>
        </div>

        {outputs.length === 0 ? (
          <div className="text-[11px] text-muted-foreground text-center py-4 border border-dashed rounded">
            暂无产出项，请点击上方添加
          </div>
        ) : (
          <div className="space-y-1.5">
            {outputs.map((out) => (
              <div
                key={out.id}
                className="flex items-center gap-2 bg-card p-1.5 rounded border border-border/60 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <Select
                    value={out.itemCode}
                    onValueChange={(val) => {
                      const selectedItem = items.find(
                        (i) => i.itemCode === val,
                      );
                      onUpdateOutput(stepId, out.id, "itemCode", val);
                      if (selectedItem?.baseUnit) {
                        onUpdateOutput(
                          stepId,
                          out.id,
                          "uom",
                          selectedItem.baseUnit,
                        );
                      }
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="选择物料" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[220px]">
                      {items.map((it) => (
                        <SelectItem
                          key={it.itemCode}
                          value={it.itemCode}
                          className="text-xs"
                        >
                          {it.itemName} ({it.itemCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-20">
                  <Input
                    type="number"
                    min="0.001"
                    step="0.1"
                    value={out.quantity}
                    onChange={(e) =>
                      onUpdateOutput(
                        stepId,
                        out.id,
                        "quantity",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="h-7 text-xs text-right font-mono"
                  />
                </div>

                <div className="w-12 text-[11px] text-muted-foreground font-mono text-center">
                  {out.uom}
                </div>

                <div className="w-20">
                  <Select
                    value={out.outputType}
                    onValueChange={(val) =>
                      onUpdateOutput(stepId, out.id, "outputType", val)
                    }
                  >
                    <SelectTrigger className="h-7 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAIN" className="text-xs">
                        主产物
                      </SelectItem>
                      <SelectItem value="BYPRODUCT" className="text-xs">
                        副产品
                      </SelectItem>
                      <SelectItem value="SCRAP" className="text-xs">
                        废料
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveOutput(stepId, out.id)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
