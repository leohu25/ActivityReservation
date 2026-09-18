"use client";

import { useMemo } from "react";
import {
  FormModal,
  type DetailTableColumn,
  type FormModalSection,
} from "@base/ui";
import type { SalesOrderDetail, SalesOrderItemDTO } from "../types";
import {
  salesOrderDetailViewSchema,
  type SalesOrderDetailViewValues,
} from "../schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: SalesOrderDetail | null;
  inline?: boolean;
}

const FULFILLMENT_LABELS: Record<string, string> = {
  PENDING_SUMMARY: "待汇总",
  PRODUCING: "生产中",
  PRODUCED: "生产完成",
  READY_TO_SHIP: "可发货",
  SORTED: "已分拣",
  SHIPPED: "已出库",
  LOADED: "已装车",
  DELIVERING: "配送中",
  SIGNED: "已签收",
};

export function OrderDetailModal({
  open,
  onOpenChange,
  order,
  inline = false,
}: Props) {
  const sections: FormModalSection[] = useMemo(
    () => [
      {
        title: "基础与履约信息",
        description: "展示销售订单基础信息与物流履约状态",
        columns: 3,
        fields: [
          {
            name: "customerName",
            label: "客户名称",
            type: "text",
          },
          {
            name: "storeName",
            label: "履约门店",
            type: "text",
          },
          {
            name: "orderDate",
            label: "下单日期",
            type: "text",
          },
          {
            name: "deliveryDate",
            label: "交货日期",
            type: "text",
          },
          {
            name: "orderType",
            label: "订单类型",
            type: "text",
          },
          {
            name: "mealPeriod",
            label: "餐次排程",
            type: "text",
          },
          {
            name: "routeAndDriver",
            label: "配送路线/司机",
            type: "text",
          },
          {
            name: "status",
            label: "审批状态",
            type: "text",
          },
          {
            name: "fulfillmentStatus",
            label: "履约状态",
            type: "text",
          },
          {
            name: "settlementStatus",
            label: "结算状态",
            type: "text",
          },
          {
            name: "originalOrderId",
            label: "关联原订单",
            type: "text",
          },
          {
            name: "remark",
            label: "订单备注",
            type: "text",
            span: 2,
          },
        ],
      },
    ],
    [],
  );

  const initialValues: SalesOrderDetailViewValues = useMemo(() => {
    if (!order) {
      return {
        orderId: "",
        customerName: "",
        storeName: "",
        orderDate: "",
        deliveryDate: "",
        orderType: "",
        mealPeriod: "",
        routeAndDriver: "",
        status: "",
        fulfillmentStatus: "",
        settlementStatus: "",
        originalOrderId: "",
        remark: "",
      };
    }
    return {
      orderId: order.orderId,
      customerName: order.customerName
        ? `${order.customerName} (${order.customerCode})`
        : order.customerCode,
      storeName: order.storeName
        ? `${order.storeName} (${order.storeCode})`
        : order.storeCode,
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate,
      orderType:
        order.orderType === "REPLENISHMENT" ? "补货订单" : "普通订单",
      mealPeriod: order.mealPeriod || "未指定",
      routeAndDriver: `${order.routeCode || "-"} / ${order.driverCode || "-"}`,
      status: order.status,
      fulfillmentStatus:
        FULFILLMENT_LABELS[order.fulfillmentStatus] || order.fulfillmentStatus,
      settlementStatus: order.settlementStatus,
      originalOrderId: order.originalOrderId || "无",
      remark: order.remark || "无",
    };
  }, [order]);

  const detailColumns: DetailTableColumn<SalesOrderItemDTO>[] = useMemo(
    () => [
      {
        id: "itemCode",
        header: "商品编码",
        width: 130,
        renderCell: (row) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.itemCode}
          </span>
        ),
      },
      {
        id: "itemName",
        header: "商品名称",
        renderCell: (row) => (
          <span className="text-xs font-medium">{row.itemName}</span>
        ),
      },
      {
        id: "orderQty",
        header: "订购数量",
        width: 90,
        align: "right",
        renderCell: (row) => (
          <span className="text-xs font-semibold">{row.orderQty}</span>
        ),
      },
      {
        id: "salesUnit",
        header: "单位",
        width: 70,
        renderCell: (row) => (
          <span className="text-xs text-muted-foreground">{row.salesUnit}</span>
        ),
      },
      {
        id: "unitPriceInclTax",
        header: "含税单价",
        width: 100,
        align: "right",
        renderCell: (row) => (
          <span className="text-xs">
            ¥{(row.unitPriceInclTax || 0).toFixed(2)}
          </span>
        ),
      },
      {
        id: "taxRate",
        header: "税率",
        width: 80,
        align: "right",
        renderCell: (row) => (
          <span className="text-xs text-muted-foreground">
            {row.taxRate != null ? `${row.taxRate}%` : "-"}
          </span>
        ),
      },
      {
        id: "subtotalAmount",
        header: "小计金额",
        width: 110,
        align: "right",
        renderCell: (row) => (
          <span className="text-xs font-semibold text-primary">
            ¥{((row.subtotalAmount ?? ((row.orderQty || 0) * (row.unitPriceInclTax || 0)))).toFixed(2)}
          </span>
        ),
      },
      {
        id: "fulfillmentStatus",
        header: "履约进度",
        width: 90,
        renderCell: (row) => (
          <span className="text-xs">
            {FULFILLMENT_LABELS[row.fulfillmentStatus || ""] || row.fulfillmentStatus || "-"}
          </span>
        ),
      },
    ],
    [],
  );

  if (!order) return null;

  return (
    <FormModal<SalesOrderDetailViewValues, SalesOrderItemDTO>
      open={open}
      onOpenChange={onOpenChange}
      onClose={() => onOpenChange(false)}
      mode="view"
      inline={inline}
      badge="SO"
      title={`订单详情 - ${order.orderId}`}
      description="销售订单全生命周期基础信息与商品履约明细清单"
      schema={salesOrderDetailViewSchema}
      sections={sections}
      initialValues={initialValues}
      detailConfig={{
        title: `商品明细 (${order.items.length})`,
        description: "包含订购品项、计价与分拣履约进度",
        columns: detailColumns,
        readOnly: true,
        emptyText: "暂无商品明细",
        summary: (
          <div className="flex justify-end pr-4 py-1 text-xs">
            <span className="text-muted-foreground mr-2">总计金额:</span>
            <span className="font-semibold text-primary">
              ¥{(order.totalAmount || 0).toFixed(2)}
            </span>
          </div>
        ),
      }}
      initialItems={order.items}
      items={order.items}
    />
  );
}
