"use client";

import { useMemo, useState } from "react";
import {
  FormModal,
  Input,
  type DetailTableColumn,
  type FormModalSection,
} from "@base/ui";
import { createSalesOrderAction, getCustomerStoresAction } from "../actions";
import {
  salesOrderFormSchema,
  salesOrderItemSchema,
  type SalesOrderFormValues,
  type SalesOrderItemFormValues,
} from "../schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  customers: Array<{ customerCode: string; customerName: string }>;
  stores: Array<{ storeCode: string; storeName: string; customerCode: string }>;
  defaultOrderType?: "NORMAL" | "REPLENISHMENT";
  defaultOriginalOrderId?: string;
  inline?: boolean;
}

export function CreateOrderModal({
  open,
  onOpenChange,
  onSuccess,
  customers,
  stores: initialStores,
  defaultOrderType = "NORMAL",
  defaultOriginalOrderId,
  inline = false,
}: Props) {
  const [storeList, setStoreList] = useState<
    Array<{ storeCode: string; storeName: string }>
  >([]);
  const [loadingStores, setLoadingStores] = useState(false);

  const initialValues: SalesOrderFormValues = useMemo(
    () => ({
      customerCode: "",
      storeCode: "",
      deliveryDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      orderType: defaultOrderType,
      originalOrderId: defaultOriginalOrderId || "",
      salesPerson: "",
      sortingRemark: "",
      remark: "",
    }),
    [defaultOrderType, defaultOriginalOrderId],
  );

  // 客户与门店通用 Combobox 选项
  const customerOptions = useMemo(
    () =>
      customers.map((c) => ({
        value: c.customerCode,
        label: c.customerName,
        description: c.customerCode,
      })),
    [customers],
  );

  const storeOptions = useMemo(
    () =>
      storeList.map((s) => ({
        value: s.storeCode,
        label: s.storeName,
        description: s.storeCode,
      })),
    [storeList],
  );

  // 明细表列定义
  const detailColumns: DetailTableColumn<SalesOrderItemFormValues>[] = [
    {
      id: "itemCode",
      header: "商品编码",
      width: 140,
      renderCell: (row, _index, onChange) => (
        <Input
          placeholder="商品编码"
          className="h-8 text-xs font-mono"
          value={row.itemCode}
          onChange={(e) => onChange?.({ itemCode: e.target.value })}
        />
      ),
    },
    {
      id: "itemName",
      header: "商品名称",
      renderCell: (row, _index, onChange) => (
        <Input
          placeholder="商品名称"
          className="h-8 text-xs"
          value={row.itemName}
          onChange={(e) => onChange?.({ itemName: e.target.value })}
        />
      ),
    },
    {
      id: "orderQty",
      header: "订购数量",
      width: 110,
      renderCell: (row, _index, onChange) => (
        <Input
          type="number"
          step="0.1"
          className="h-8 text-xs font-medium"
          value={row.orderQty || ""}
          onChange={(e) =>
            onChange?.({ orderQty: parseFloat(e.target.value) || 0 })
          }
        />
      ),
    },
    {
      id: "salesUnit",
      header: "销售单位",
      width: 90,
      renderCell: (row, _index, onChange) => (
        <Input
          className="h-8 text-xs"
          value={row.salesUnit}
          onChange={(e) => onChange?.({ salesUnit: e.target.value })}
        />
      ),
    },
    {
      id: "unitPriceInclTax",
      header: "含税单价(元)",
      width: 120,
      renderCell: (row, _index, onChange) => (
        <Input
          type="number"
          step="0.01"
          className="h-8 text-xs"
          value={row.unitPriceInclTax || ""}
          onChange={(e) => {
            const price = parseFloat(e.target.value) || 0;
            onChange?.({
              unitPriceInclTax: price,
              unitPriceExclTax: price,
            });
          }}
        />
      ),
    },
    {
      id: "subtotal",
      header: "小计(元)",
      width: 100,
      align: "right",
      renderCell: (row) => (
        <span className="text-xs font-semibold text-primary">
          ¥{((row.orderQty || 0) * (row.unitPriceInclTax || 0)).toFixed(2)}
        </span>
      ),
    },
  ];

  // 表单分区架构
  const sections: FormModalSection[] = useMemo(
    () => [
      {
        title: "基本与配送信息",
        description: "指定配送客户、门店与到货交期",
        columns: 2,
        fields: [
          {
            name: "customerCode",
            label: "下单客户",
            type: "combobox",
            required: true,
            options: customerOptions,
            placeholder: "搜索或选择客户...",
            searchPlaceholder: "输入客户名称或编码搜索...",
          },
          {
            name: "storeCode",
            label: "履约门店",
            type: "combobox",
            required: true,
            options: storeOptions,
            placeholder: loadingStores
              ? "正在加载门店..."
              : "搜索或选择门店...",
            searchPlaceholder: "输入门店名称或编码搜索...",
            disabled: loadingStores,
          },
          {
            name: "deliveryDate",
            label: "交货日期",
            type: "date",
            required: true,
            placeholder: "选择交货日期",
          },
          {
            name: "orderType",
            label: "订单类型",
            type: "select",
            required: true,
            options: [
              { value: "NORMAL", label: "普通订单" },
              { value: "REPLENISHMENT", label: "补货订单" },
            ],
          },
          {
            name: "originalOrderId",
            label: "关联原订单号 (补单填写)",
            type: "text",
            placeholder: "SO-YYYYMMDD-XXXX",
          },
          {
            name: "salesPerson",
            label: "销售员",
            type: "text",
            placeholder: "业务经办人",
          },
          {
            name: "remark",
            label: "订单备注",
            type: "text",
            placeholder: "送货要求、装卸说明等",
            span: 2,
          },
        ],
      },
    ],
    [customerOptions, storeOptions, loadingStores],
  );

  const handleValuesChange = (
    name: string,
    value: unknown,
    _prevValues: SalesOrderFormValues,
  ) => {
    // 当切换客户时，联动异步刷新其门店列表并清空已选门店
    if (name === "customerCode" && typeof value === "string") {
      const code = value;

      if (!code) {
        setStoreList([]);
        return { storeCode: "" };
      }

      const matched = initialStores.filter((s) => s.customerCode === code);
      if (matched.length > 0) {
        setStoreList(matched);
        return { storeCode: matched[0]?.storeCode || "" };
      }

      setLoadingStores(true);
      getCustomerStoresAction(code)
        .then((res) => {
          if (res.success && res.data) {
            setStoreList(res.data);
          } else {
            setStoreList([]);
          }
        })
        .catch(() => setStoreList([]))
        .finally(() => setLoadingStores(false));

      return { storeCode: "" };
    }
  };

  const handleSubmit = async (
    values: SalesOrderFormValues,
    context: { items: SalesOrderItemFormValues[] },
  ) => {
    const res = await createSalesOrderAction({
      customerCode: values.customerCode,
      storeCode: values.storeCode,
      deliveryDate: values.deliveryDate,
      orderType: values.orderType,
      originalOrderId: values.originalOrderId || undefined,
      salesPerson: values.salesPerson || undefined,
      remark: values.remark || undefined,
      items: context.items.map((i) => ({
        itemCode: i.itemCode,
        itemName: i.itemName,
        salesUnit: i.salesUnit,
        orderQty: i.orderQty,
        unitPriceInclTax: i.unitPriceInclTax,
        unitPriceExclTax: i.unitPriceExclTax,
      })),
    });

    if (!res.success) {
      throw new Error(res.error || "创建销售订单失败");
    }

    onSuccess();
  };

  return (
    <FormModal<SalesOrderFormValues, SalesOrderItemFormValues>
      open={open}
      onOpenChange={onOpenChange}
      onClose={() => onOpenChange(false)}
      mode="create"
      inline={inline}
      badge="SO"
      title={
        defaultOrderType === "REPLENISHMENT" ? "新建补货订单" : "新建销售订单"
      }
      description="按客户与履约门店录入生鲜净菜配送需求，支持自动带价与明细核算"
      schema={salesOrderFormSchema}
      sections={sections}
      initialValues={initialValues}
      onValuesChange={handleValuesChange}
      detailConfig={{
        title: "商品订购明细",
        description: "录入生鲜商品名称、订购数量与含税销售单价",
        columns: detailColumns,
        onAddRow: () => ({
          itemCode: "",
          itemName: "",
          salesUnit: "kg",
          orderQty: 1,
          unitPriceInclTax: 0,
          unitPriceExclTax: 0,
        }),
        addText: "添加商品明细",
        minRows: 1,
        emptyText: "暂无商品明细，请点击右上角【添加商品明细】",
      }}
      initialItems={[]}
      itemsSchema={salesOrderItemSchema
        .array()
        .min(1, "请添加至少一条商品明细")}
      onSubmit={handleSubmit}
      submitText="创建销售订单"
    />
  );
}
