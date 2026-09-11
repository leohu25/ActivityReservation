"use client";

import React, { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, DataTable, Input, toast } from "@chenrun/ui";
import type { DataTableFormFieldSchema } from "@chenrun/ui";
import { createQuoteAction } from "../actions";
import type {
  CreateQuoteItemInput,
  CustomerListItem,
  StoreListItem,
} from "../types";

export interface CreateQuoteModalProps {
  readonly customers: readonly CustomerListItem[];
  readonly stores: readonly StoreListItem[];
  readonly onClose: () => void;
  readonly onCreated?: () => void;
}

type ScopeType = "CUSTOMER" | "STORE" | "REGION";

const emptyItem = (seq: number): CreateQuoteItemInput => ({
  itemCode: `ITEM_VEG_${String(seq).padStart(3, "0")}`,
  itemName: "特选生鲜净菜",
  salesUnit: "kg",
  unitPriceExclTax: 10.0,
  unitPriceInclTax: 10.9,
  taxRate: 9.0,
  minQty: 5,
  maxQty: null,
  remark: "",
});

/** 拟定新报价单：头部 Schema + 明细行 custom 区 */
export function CreateQuoteModal({
  customers,
  stores,
  onClose,
  onCreated,
}: CreateQuoteModalProps) {
  const form = DataTable.useForm<{
    scopeType: ScopeType;
    customerCode: string;
    storeCode: string;
    regionCode: string;
    displayName: string;
    effectiveDate: string;
    expiryDate: string;
  }>({
    scopeType: "STORE",
    customerCode: customers[0]?.customerCode || "",
    storeCode: stores[0]?.storeCode || "",
    regionCode: "REGION_BJ_01",
    displayName: "",
    effectiveDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
  });

  const [items, setItems] = useState<CreateQuoteItemInput[]>([
    {
      itemCode: "ITEM_VEG_001",
      itemName: "有机特级上海青(净菜)",
      salesUnit: "kg",
      unitPriceExclTax: 5.5,
      unitPriceInclTax: 6.0,
      taxRate: 9.0,
      minQty: 10,
      maxQty: null,
      remark: "每日新鲜直供",
    },
  ]);

  const scopeType = form.values.scopeType;

  const headerFields: DataTableFormFieldSchema[] = useMemo(() => {
    const fields: DataTableFormFieldSchema[] = [
      {
        name: "scopeType",
        label: "适用范围",
        type: "select",
        required: true,
        options: [
          { value: "STORE", label: "门店专属报价 (优先级最高)" },
          { value: "CUSTOMER", label: "客户全门店通用" },
          { value: "REGION", label: "区域通用报价 (基准保底)" },
        ],
      },
    ];
    if (scopeType !== "REGION") {
      fields.push({
        name: "customerCode",
        label: "所属客户",
        type: "select",
        required: true,
        options: customers.map((c) => ({
          value: c.customerCode,
          label: c.customerName,
        })),
      });
    }
    if (scopeType === "STORE") {
      fields.push({
        name: "storeCode",
        label: "所属门店",
        type: "select",
        required: true,
        options: stores.map((s) => ({
          value: s.storeCode,
          label: `${s.storeName} (${s.storeCode})`,
        })),
      });
    }
    if (scopeType === "REGION") {
      fields.push({
        name: "regionCode",
        label: "区域编码",
        type: "text",
        required: true,
        placeholder: "如: REGION_BJ_01",
      });
    }
    fields.push(
      {
        name: "displayName",
        label: "对外简称",
        type: "text",
        placeholder: "如: 2026秋季净菜直供报价单",
      },
      {
        name: "effectiveDate",
        label: "价格生效日期",
        type: "date",
        required: true,
      },
      {
        name: "expiryDate",
        label: "失效日期",
        type: "date",
        hint: "为空则长期有效",
      },
    );
    return fields;
  }, [scopeType, customers, stores]);

  const handleAddItem = () => setItems([...items, emptyItem(items.length + 1)]);

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.warning("报价单至少保留一条品项明细");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof CreateQuoteItemInput,
    val: string | number | null,
  ) => {
    const updated = [...items];
    const curr = { ...updated[index], [field]: val };
    if (field === "unitPriceExclTax" || field === "taxRate") {
      const excl = Number(curr.unitPriceExclTax) || 0;
      const rate = Number(curr.taxRate) || 0;
      curr.unitPriceInclTax = parseFloat((excl * (1 + rate / 100)).toFixed(2));
    }
    updated[index] = curr;
    setItems(updated);
  };

  return (
    <DataTable.FormModal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="拟定新报价单"
      description="报价优先级：门店专价 > 客户通用 > 区域保底"
      submitText="创建报价单 (保存为草稿)"
      className="max-w-4xl"
      headerExtra={
        <DataTable.FormBanner
          title="阶梯价报价单"
          description="适用范围三选一；明细行含税单价按税率自动推导。"
        />
      }
      onSubmit={async () => {
        const v = form.values;
        const res = await createQuoteAction({
          customerCode:
            v.scopeType === "CUSTOMER" || v.scopeType === "STORE"
              ? v.customerCode
              : null,
          storeCode: v.scopeType === "STORE" ? v.storeCode : null,
          regionCode: v.scopeType === "REGION" ? v.regionCode : null,
          quoteDate: new Date().toISOString().split("T")[0],
          effectiveDate: v.effectiveDate,
          expiryDate: v.expiryDate || null,
          displayName: v.displayName || null,
          createdBy: "系统管理员",
          items,
        });
        if (!res.success) {
          toast.error(res.error || "创建报价单失败");
          throw new Error(res.error || "创建报价单失败");
        }
        toast.success("报价单创建成功");
        onCreated?.();
      }}
    >
      <DataTable.FormSection title="适用范围与有效期">
        <DataTable.FormFields
          fields={headerFields}
          values={form.values}
          onChange={form.setField}
          columns={2}
        />
      </DataTable.FormSection>

      <DataTable.FormSection
        title={`报价明细条目 (${items.length})`}
        description="含税单价 = 不含税单价 × (1 + 税率/100)，自动计算"
      >
        <div className="flex justify-end mb-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            className="h-7 text-xs"
          >
            <Plus className="size-3 mr-1" />
            添加商品
          </Button>
        </div>
        <div className="border rounded-lg overflow-x-auto bg-card">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-muted-foreground uppercase border-b">
              <tr>
                <th className="p-2 text-left">商品编码</th>
                <th className="p-2 text-left">商品名称</th>
                <th className="p-2 text-left">单位</th>
                <th className="p-2 text-right">不含税单价</th>
                <th className="p-2 text-right">税率(%)</th>
                <th className="p-2 text-right">含税单价</th>
                <th className="p-2 text-right">最小起订</th>
                <th className="p-2 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-muted/30">
                  <td className="p-2">
                    <Input
                      value={item.itemCode}
                      onChange={(e) =>
                        handleItemChange(idx, "itemCode", e.target.value)
                      }
                      className="h-7 w-24 px-1.5 text-xs"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={item.itemName}
                      onChange={(e) =>
                        handleItemChange(idx, "itemName", e.target.value)
                      }
                      className="h-7 w-36 px-1.5 text-xs"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={item.salesUnit}
                      onChange={(e) =>
                        handleItemChange(idx, "salesUnit", e.target.value)
                      }
                      className="h-7 w-12 px-1.5 text-xs"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPriceExclTax}
                      onChange={(e) =>
                        handleItemChange(
                          idx,
                          "unitPriceExclTax",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="h-7 w-20 px-1.5 text-xs text-right"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.taxRate}
                      onChange={(e) =>
                        handleItemChange(
                          idx,
                          "taxRate",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="h-7 w-16 px-1.5 text-xs text-right"
                    />
                  </td>
                  <td className="p-2 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    ¥{item.unitPriceInclTax}
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={item.minQty || ""}
                      onChange={(e) =>
                        handleItemChange(
                          idx,
                          "minQty",
                          parseFloat(e.target.value) || null,
                        )
                      }
                      className="h-7 w-16 px-1.5 text-xs text-right"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(idx)}
                      className="h-6 w-6 p-0 text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataTable.FormSection>
    </DataTable.FormModal>
  );
}
