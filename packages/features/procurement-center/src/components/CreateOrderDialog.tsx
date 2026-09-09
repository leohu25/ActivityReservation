"use client";

import React, { useState, useTransition } from "react";
import type { FieldAccessMode } from "@chenrun/authorization";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  AuthorizedField,
} from "@chenrun/ui";
import { Plus, X, Loader2, Building2 } from "lucide-react";
import { createOrderAction } from "../actions";
import type { ProcurementAnyAbility } from "../types";

export interface CreateOrderDialogProps {
  readonly ability?: ProcurementAnyAbility;
  readonly fieldModes?: Record<string, FieldAccessMode>;
  readonly departmentName?: string | null;
  readonly onCreated?: () => void;
}

export function CreateOrderDialog({
  ability,
  fieldModes,
  departmentName,
  onCreated,
}: CreateOrderDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [costPrice, setCostPrice] = useState("1000.00");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpen = () => {
    setError(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (!isPending) {
      setIsOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanSupplier = supplierName.trim();
    if (!cleanSupplier) {
      setError("请输入供应商名称");
      return;
    }

    const numQty = parseInt(quantity, 10);
    if (isNaN(numQty) || numQty <= 0) {
      setError("采购数量必须为大于 0 的有效整数");
      return;
    }

    const numPrice = parseFloat(costPrice);
    if (isNaN(numPrice) || numPrice < 0) {
      setError("采购成本价必须为有效非负数值");
      return;
    }

    startTransition(async () => {
      const res = await createOrderAction({
        supplierName: cleanSupplier,
        quantity: numQty,
        costPrice: numPrice,
      });

      if (!res.success) {
        setError(res.error ?? "创建订单失败");
        return;
      }

      setIsOpen(false);
      setSupplierName("");
      onCreated?.();
    });
  };

  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={handleOpen}
        className="shadow-sm shadow-blue-600/25"
      >
        <Plus className="size-3.5 mr-1" />
        <span>新建采购订单</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  新建采购订单
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  录入采购单据信息，自动绑定当前操作员所在部门
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={isPending}
                className="size-8 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="size-4" />
              </Button>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-4">
                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                    {error}
                  </div>
                )}

                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-600 flex items-center justify-between dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Building2 className="size-3.5 text-blue-600" />
                    <span>归属业务部门:</span>
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {departmentName || "尚未分配部门"}
                  </span>
                </div>

                <AuthorizedField
                  ability={ability}
                  mode={fieldModes?.supplierName}
                  subject="PurchaseOrder"
                  field="supplierName"
                  action="create"
                  label="供应商名称 *"
                >
                  <Input
                    placeholder="如：江苏晨润数智精密材料"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    disabled={isPending}
                    required
                  />
                </AuthorizedField>

                <div className="grid grid-cols-2 gap-4">
                  <AuthorizedField
                    ability={ability}
                    mode={fieldModes?.quantity}
                    subject="PurchaseOrder"
                    field="quantity"
                    action="create"
                    label="采购数量 *"
                  >
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      disabled={isPending}
                      required
                    />
                  </AuthorizedField>

                  <AuthorizedField
                    ability={ability}
                    mode={fieldModes?.costPrice}
                    subject="PurchaseOrder"
                    field="costPrice"
                    action="create"
                    label="采购成本价 (敏感资产) *"
                  >
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      disabled={isPending}
                      required
                    />
                  </AuthorizedField>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClose}
                    disabled={isPending}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    size="sm"
                    disabled={isPending}
                    className="shadow-sm shadow-blue-600/25"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="size-3.5 mr-1 animate-spin" />
                        <span>提交中...</span>
                      </>
                    ) : (
                      <span>确认提交</span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
