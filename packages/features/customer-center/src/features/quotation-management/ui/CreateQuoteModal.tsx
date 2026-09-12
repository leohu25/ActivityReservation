"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Button,
  FormDialog,
  FormSection,
  FormBanner,
  FormFields,
  Input,
  toast,
  type FormFieldSchema,
} from "@base/ui";
import { createQuoteAction } from "../actions";
import type { CreateQuoteItemInput } from "../types";
import type { CustomerListItem } from "../../customer-management/types";
import type { StoreListItem } from "../../store-management/types";

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

/** 拟定新报价单：FormDialog 驱动 */
export function CreateQuoteModal({
  customers,
  stores,
  onClose,
  onCreated,
}: CreateQuoteModalProps) {
  const [values, setValues] = useState<{
    scopeType: ScopeType;
    customerCode: string;
    storeCode: string;
    regionCode: string;
    displayName: string;
    effectiveDate: string;
    expiryDate: string;
  }>({
    scopeType: "STORE",
    customerCode: customers[0]?.customerCode || customers[0]?.id || "",
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

  const headerFields: FormFieldSchema[] = useMemo(
    () => [
      {
        name: "scopeType",
        label: "报价单适用维度",
        type: "select",
        required: true,
        options: [
          { value: "STORE", label: "门店专价单 (优先级最高)" },
          { value: "CUSTOMER", label: "客户通用价单 (企业所有门店通用)" },
          { value: "REGION", label: "区域公开指导价 (区域默认保底)" },
        ],
      },
      {
        name: "displayName",
        label: "报价单展示名称",
        type: "text",
        placeholder: "如: 2026 Q3 特惠专享价",
      },
      ...(values.scopeType === "CUSTOMER" || values.scopeType === "STORE"
        ? ([
            {
              name: "customerCode",
              label: "所属客户企业",
              type: "select",
              required: true,
              options: customers.map((c, idx) => {
                const code = c.customerCode || c.id || `cust-${idx}`;
                return {
                  value: code,
                  label: `${c.customerName || code} (${code})`,
                };
              }),
            },
          ] as FormFieldSchema[])
        : []),
      ...(values.scopeType === "STORE"
        ? ([
            {
              name: "storeCode",
              label: "定向履约门店",
              type: "select",
              required: true,
              options: stores.map((s) => ({
                value: s.storeCode,
                label: `${s.storeName} (${s.storeCode})`,
              })),
            },
          ] as FormFieldSchema[])
        : []),
      ...(values.scopeType === "REGION"
        ? ([
            {
              name: "regionCode",
              label: "适用配送区域",
              type: "select",
              required: true,
              options: [
                { value: "REGION_BJ_01", label: "华北北京核心城区网格" },
                { value: "REGION_HD_01", label: "华东杭州生鲜直配网格" },
                { value: "REGION_DEFAULT", label: "通用默认配送网格" },
              ],
            },
          ] as FormFieldSchema[])
        : []),
      {
        name: "effectiveDate",
        label: "生效日期",
        type: "date",
        required: true,
      },
      {
        name: "expiryDate",
        label: "失效截止日期 (选填)",
        type: "date",
        hint: "留空表示长期有效",
      },
    ],
    [values.scopeType, customers, stores],
  );

  const handleAddItem = () => {
    setItems((prev) => [...prev, emptyItem(prev.length + 1)]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.error("报价单必须至少包含 1 行商品明细");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof CreateQuoteItemInput,
    value: string | number,
  ) => {
    const updated = [...items];
    const curr = { ...updated[index] } as CreateQuoteItemInput;
    // SAFETY: field 为 CreateQuoteItemInput 合法属性，在此完成动态类型赋值
    const target = curr as unknown as Record<string, unknown>;
    if (
      field === "unitPriceExclTax" ||
      field === "taxRate" ||
      field === "minQty"
    ) {
      target[field] = value === "" ? 0 : Number(value);
    } else {
      target[field] = value;
    }

    if (field === "unitPriceExclTax" || field === "taxRate") {
      const excl = Number(curr.unitPriceExclTax) || 0;
      const rate = Number(curr.taxRate) || 0;
      curr.unitPriceInclTax = parseFloat((excl * (1 + rate / 100)).toFixed(2));
    }
    updated[index] = curr;
    setItems(updated);
  };

  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="拟定新报价单"
      description="报价优先级：门店专价 > 客户通用 > 区域保底"
      submitText="创建报价单 (保存为草稿)"
      className="max-w-4xl"
      headerExtra={
        <FormBanner
          title="阶梯价报价单"
          description="适用范围三选一；明细行含税单价按税率自动推导。"
        />
      }
      onSubmit={async () => {
        const v = values;
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
      <FormSection title="适用范围与有效期">
        <FormFields
          fields={headerFields}
          values={values}
          onChange={(name, val) =>
            setValues((prev) => ({ ...prev, [name]: val }))
          }
          columns={2}
        />
      </FormSection>

      <FormSection
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
                          e.target.value,
                        )
                      }
                      className="h-7 w-20 px-1.5 text-right text-xs"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={item.taxRate}
                      onChange={(e) =>
                        handleItemChange(idx, "taxRate", e.target.value)
                      }
                      className="h-7 w-14 px-1.5 text-right text-xs"
                    />
                  </td>
                  <td className="p-2 text-right font-mono font-medium text-primary">
                    ¥{item.unitPriceInclTax.toFixed(2)}
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.minQty ?? ""}
                      onChange={(e) =>
                        handleItemChange(idx, "minQty", e.target.value)
                      }
                      className="h-7 w-14 px-1.5 text-right text-xs"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(idx)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FormSection>
    </FormDialog>
  );
}
