"use client";

import { useMemo, useState } from "react";
import {
  FormDialog,
  FormSection,
  FormBanner,
  FormFields,
  Input,
  toast,
  EditableDetailTable,
  type FormFieldSchema,
  type DetailTableColumn,
} from "@base/ui";
import { createQuoteAction, updateQuoteAction } from "../actions";
import type { CreateQuoteItemInput, QuoteListItem } from "../types";
import type { CustomerListItem } from "../../customer-management/types";
import type { StoreListItem } from "../../store-management/types";

export interface QuoteFormModalProps {
  readonly mode: "create" | "edit";
  readonly record?: QuoteListItem | null;
  readonly customers: readonly CustomerListItem[];
  readonly stores: readonly StoreListItem[];
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
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

export function QuoteFormModal({
  mode,
  record,
  customers,
  stores,
  onClose,
  onSuccess,
}: QuoteFormModalProps) {
  const isEdit = mode === "edit";

  const [values, setValues] = useState<{
    scopeType: ScopeType;
    customerCode: string;
    storeCode: string;
    regionCode: string;
    displayName: string;
    effectiveDate: string;
    expiryDate: string;
  }>({
    scopeType: record?.storeCode
      ? "STORE"
      : record?.customerCode
        ? "CUSTOMER"
        : "REGION",
    customerCode: record?.customerCode || customers[0]?.customerCode || "",
    storeCode: record?.storeCode || stores[0]?.storeCode || "",
    regionCode: record?.regionCode || "REGION_BJ_01",
    displayName: record?.displayName || "",
    effectiveDate: record?.effectiveDate
      ? new Date(record.effectiveDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    expiryDate: record?.expiryDate
      ? new Date(record.expiryDate).toISOString().split("T")[0]
      : "",
  });

  const [items, setItems] = useState<CreateQuoteItemInput[]>(() => {
    if (record?.items && record.items.length > 0) {
      return record.items.map((it) => ({
        itemCode: it.itemCode,
        itemName: it.itemName,
        salesUnit: it.salesUnit,
        unitPriceExclTax: Number(it.unitPriceExclTax) || 0,
        unitPriceInclTax: Number(it.unitPriceInclTax) || 0,
        taxRate: Number(it.taxRate) || 0,
        minQty: it.minQty == null ? null : Number(it.minQty),
        maxQty: it.maxQty == null ? null : Number(it.maxQty),
        remark: it.remark || "",
      }));
    }
    return [emptyItem(1)];
  });

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

  const handleItemFieldChange = (
    row: CreateQuoteItemInput,
    field: keyof CreateQuoteItemInput,
    value: string | number,
    onChange?: (updater: Partial<CreateQuoteItemInput>) => void,
  ) => {
    if (!onChange) return;
    const patch: Partial<CreateQuoteItemInput> = {};
    if (
      field === "unitPriceExclTax" ||
      field === "taxRate" ||
      field === "minQty" ||
      field === "maxQty"
    ) {
      // SAFETY: 动态将输入值赋给 patch 属性
      (patch as Record<string, unknown>)[field] =
        value === "" ? null : Number(value);
    } else {
      // SAFETY: 动态字符串赋值
      (patch as Record<string, unknown>)[field] = value;
    }

    if (field === "unitPriceExclTax" || field === "taxRate") {
      const excl =
        field === "unitPriceExclTax"
          ? Number(value) || 0
          : Number(row.unitPriceExclTax) || 0;
      const rate =
        field === "taxRate"
          ? Number(value) || 0
          : Number(row.taxRate) || 0;
      patch.unitPriceInclTax = parseFloat(
        (excl * (1 + rate / 100)).toFixed(2),
      );
    }

    onChange(patch);
  };

  const itemColumns: DetailTableColumn<CreateQuoteItemInput>[] = useMemo(
    () => [
      {
        id: "itemCode",
        header: "商品编码",
        renderCell: (row, _idx, onChange) => (
          <Input
            value={row.itemCode}
            onChange={(e) =>
              handleItemFieldChange(row, "itemCode", e.target.value, onChange)
            }
            className="h-7 w-24 px-1.5 text-xs font-mono"
          />
        ),
      },
      {
        id: "itemName",
        header: "商品名称",
        renderCell: (row, _idx, onChange) => (
          <Input
            value={row.itemName}
            onChange={(e) =>
              handleItemFieldChange(row, "itemName", e.target.value, onChange)
            }
            className="h-7 w-32 px-1.5 text-xs"
          />
        ),
      },
      {
        id: "salesUnit",
        header: "单位",
        renderCell: (row, _idx, onChange) => (
          <Input
            value={row.salesUnit}
            onChange={(e) =>
              handleItemFieldChange(row, "salesUnit", e.target.value, onChange)
            }
            className="h-7 w-12 px-1.5 text-xs text-center"
          />
        ),
      },
      {
        id: "unitPriceExclTax",
        header: "不含税单价",
        align: "right",
        renderCell: (row, _idx, onChange) => (
          <Input
            type="number"
            step="0.01"
            value={row.unitPriceExclTax}
            onChange={(e) =>
              handleItemFieldChange(
                row,
                "unitPriceExclTax",
                e.target.value,
                onChange,
              )
            }
            className="h-7 w-20 px-1.5 text-right text-xs font-mono"
          />
        ),
      },
      {
        id: "taxRate",
        header: "税率(%)",
        align: "right",
        renderCell: (row, _idx, onChange) => (
          <Input
            type="number"
            step="0.1"
            value={row.taxRate}
            onChange={(e) =>
              handleItemFieldChange(row, "taxRate", e.target.value, onChange)
            }
            className="h-7 w-14 px-1.5 text-right text-xs font-mono"
          />
        ),
      },
      {
        id: "unitPriceInclTax",
        header: "含税单价",
        align: "right",
        renderCell: (row) => (
          <span className="font-mono font-medium text-primary text-xs">
            ¥{row.unitPriceInclTax.toFixed(2)}
          </span>
        ),
      },
      {
        id: "minQty",
        header: "起订量",
        align: "right",
        renderCell: (row, _idx, onChange) => (
          <Input
            type="number"
            min="1"
            placeholder="无"
            value={row.minQty ?? ""}
            onChange={(e) =>
              handleItemFieldChange(row, "minQty", e.target.value, onChange)
            }
            className="h-7 w-14 px-1.5 text-right text-xs font-mono"
          />
        ),
      },
      {
        id: "maxQty",
        header: "限购量",
        align: "right",
        renderCell: (row, _idx, onChange) => (
          <Input
            type="number"
            min="1"
            placeholder="无"
            value={row.maxQty ?? ""}
            onChange={(e) =>
              handleItemFieldChange(row, "maxQty", e.target.value, onChange)
            }
            className="h-7 w-14 px-1.5 text-right text-xs font-mono"
          />
        ),
      },
      {
        id: "remark",
        header: "备注",
        renderCell: (row, _idx, onChange) => (
          <Input
            value={row.remark || ""}
            placeholder="选填"
            onChange={(e) =>
              handleItemFieldChange(row, "remark", e.target.value, onChange)
            }
            className="h-7 w-28 px-1.5 text-xs"
          />
        ),
      },
    ],
    [],
  );

  const handleSubmit = async () => {
    const v = values;
    const payload = {
      customerCode:
        v.scopeType === "CUSTOMER" || v.scopeType === "STORE"
          ? v.customerCode
          : null,
      storeCode: v.scopeType === "STORE" ? v.storeCode : null,
      regionCode: v.scopeType === "REGION" ? v.regionCode : null,
      effectiveDate: v.effectiveDate,
      expiryDate: v.expiryDate || null,
      displayName: v.displayName || null,
      items,
    };

    if (isEdit && record) {
      const res = await updateQuoteAction(record.quoteId, payload);
      if (!res.success) {
        toast.error(res.error || "修改报价单失败");
        throw new Error(res.error || "修改报价单失败");
      }
      toast.success("报价单修改成功");
    } else {
      const res = await createQuoteAction({
        ...payload,
        quoteDate: new Date().toISOString().split("T")[0],
        createdBy: "系统管理员",
      });
      if (!res.success) {
        toast.error(res.error || "创建报价单失败");
        throw new Error(res.error || "创建报价单失败");
      }
      toast.success("报价单创建成功（草稿）");
    }
    onSuccess?.();
  };

  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      badge="QU"
      title={isEdit ? `编辑草稿报价单 [${record?.quoteId}]` : "拟定新报价单"}
      description="报价优先级：门店专价 > 客户通用 > 区域保底"
      submitText={isEdit ? "保存修改" : "保存为草稿"}
      className="max-w-5xl sm:max-w-5xl"
      headerExtra={
        <FormBanner
          title="阶梯价报价单"
          description="适用范围三选一；明细行含税单价将按税率自动联动推导。"
        />
      }
      onSubmit={handleSubmit}
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
        <EditableDetailTable<CreateQuoteItemInput>
          columns={itemColumns}
          data={items}
          onChange={setItems}
          onAddRow={() => emptyItem(items.length + 1)}
          addText="添加商品"
          minRows={1}
        />
      </FormSection>
    </FormDialog>
  );
}
