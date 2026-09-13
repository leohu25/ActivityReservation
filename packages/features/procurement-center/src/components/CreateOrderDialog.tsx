"use client";

import React, { useMemo, useState } from "react";
import type { FieldAccessMode } from "@base/authorization";
import { FieldPolicy } from "@base/shared";
import {
  Button,
  FormModal,
  deriveFieldMode,
  useOptionalAbility,
  toast,
  z,
  type FormFieldSchema,
} from "@base/ui";
import { Plus, Building2 } from "lucide-react";
import { createOrderAction } from "../actions";
import type { ProcurementAnyAbility } from "../types";

export interface CreateOrderDialogProps {
  readonly ability?: ProcurementAnyAbility;
  readonly fieldModes?: Record<string, FieldAccessMode>;
  readonly departmentName?: string | null;
  readonly onCreated?: () => void;
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly inline?: boolean;
}

export type CreateOrderFormData = {
  supplierName: string;
  quantity: number | string;
  costPrice: number | string;
};

export const createOrderZodSchema = z.object({
  supplierName: z.string().trim().min(1, "请输入供应商名称"),
  quantity: z.coerce
    .number()
    .int("采购数量必须为大于 0 的有效整数")
    .positive("采购数量必须为大于 0 的有效整数"),
  costPrice: z.coerce
    .number()
    .min(0, "采购成本价必须为有效非负数值"),
});

export const DEFAULT_CREATE_ORDER_VALUES: CreateOrderFormData = {
  supplierName: "",
  quantity: 10,
  costPrice: 1000.0,
};

/**
 * 采购单新建弹窗：基于 @base/ui 的 FormModal 驱动，支持 CASL 字段级三态脱敏与 Zod 校验
 */
export function CreateOrderDialog({
  ability,
  fieldModes,
  departmentName,
  onCreated,
  open: controlledOpen,
  onOpenChange,
  inline,
}: CreateOrderDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;
  const ambientAbility = useOptionalAbility();
  const effectiveAbility =
    ability ?? (ambientAbility as ProcurementAnyAbility | null | undefined);

  const handleOpenChange = (nextOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const fields: FormFieldSchema[] = useMemo(() => {
    const list: FormFieldSchema[] = [];

    // 若有显式指定字段策略优先使用；若有权限上下文走 deriveFieldMode；否则默认开放 EDITABLE
    const getMode = (field: string, explicitMode?: FieldAccessMode): FieldAccessMode => {
      if (explicitMode) {
        return explicitMode;
      }
      if (effectiveAbility) {
        return deriveFieldMode(
          effectiveAbility,
          "PurchaseOrder",
          field,
          "create",
        );
      }
      return FieldPolicy.EDITABLE;
    };

    const supplierMode = getMode("supplierName", fieldModes?.supplierName);
    if (supplierMode !== FieldPolicy.HIDDEN) {
      list.push({
        name: "supplierName",
        label: "供应商名称",
        type: "text",
        required: true,
        disabled: supplierMode === FieldPolicy.READONLY,
        placeholder: "如：江苏晨润数智精密材料",
        span: 2,
      });
    }

    const qtyMode = getMode("quantity", fieldModes?.quantity);
    if (qtyMode !== FieldPolicy.HIDDEN) {
      list.push({
        name: "quantity",
        label: "采购数量",
        type: "number",
        required: true,
        disabled: qtyMode === FieldPolicy.READONLY,
        step: "1",
      });
    }

    const costMode = getMode("costPrice", fieldModes?.costPrice);
    if (costMode !== FieldPolicy.HIDDEN) {
      list.push({
        name: "costPrice",
        label: "采购成本价 (敏感资产)",
        type: "number",
        required: true,
        disabled: costMode === FieldPolicy.READONLY,
        step: "0.01",
      });
    }

    return list;
  }, [effectiveAbility, fieldModes]);

  const handleSubmit = async (values: CreateOrderFormData) => {
    const res = await createOrderAction({
      supplierName: values.supplierName.trim(),
      quantity: Number(values.quantity),
      costPrice: Number(values.costPrice),
    });

    if (!res.success) {
      toast.error(res.error || "创建订单失败");
      throw new Error(res.error || "创建订单失败");
    }

    toast.success("采购订单创建成功");
    handleOpenChange(false);
    onCreated?.();
  };

  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={() => handleOpenChange(true)}
        className="shadow-sm shadow-blue-600/25"
      >
        <Plus className="size-3.5 mr-1" />
        <span>新建采购订单</span>
      </Button>

      <FormModal<CreateOrderFormData>
        open={isOpen}
        inline={inline}
        mode="create"
        title="新建采购订单"
        description="录入采购单据信息，自动绑定当前操作员所在部门"
        submitText="确认提交"
        cancelText="取消"
        initialValues={DEFAULT_CREATE_ORDER_VALUES}
        schema={createOrderZodSchema}
        fields={fields}
        columns={2}
        onClose={() => handleOpenChange(false)}
        onSubmit={handleSubmit}
        extraContent={
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-600 flex items-center justify-between dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <Building2 className="size-3.5 text-blue-600" />
              <span>归属业务部门:</span>
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {departmentName || "尚未分配部门"}
            </span>
          </div>
        }
      />
    </>
  );
}

export { CreateOrderDialog as CreateOrderModal };

