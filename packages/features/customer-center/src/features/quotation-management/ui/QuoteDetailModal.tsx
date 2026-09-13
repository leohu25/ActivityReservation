"use client";

import React, { useMemo } from "react";
import {
  Badge,
  Button,
  FormModal,
  type DetailTableColumn,
  type FormModalSection,
} from "@base/ui";
import { MapPin, Layers } from "lucide-react";
import { formatDate } from "@base/shared";
import type { QuoteListItem, QuoteItemDetail } from "../types";

export interface QuoteDetailModalProps {
  open: boolean;
  quote: QuoteListItem | null;
  onClose: () => void;
  onEdit?: (quote: QuoteListItem) => void;
}

export function QuoteDetailModal({
  open,
  quote,
  onClose,
  onEdit,
}: QuoteDetailModalProps) {
  if (!quote) return null;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return (
          <Badge variant="warning" size="sm">
            草稿
          </Badge>
        );
      case "ACTIVE":
        return (
          <Badge variant="success" size="sm">
            已生效
          </Badge>
        );
      case "VOIDED":
        return (
          <Badge variant="secondary" size="sm">
            已作废
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge variant="destructive" size="sm">
            已过期
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" size="sm">
            {status}
          </Badge>
        );
    }
  };

  const renderScopeInfo = () => {
    if (quote.storeCode) {
      return (
        <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
          <MapPin className="size-3.5" />
          【门店专价】
          {quote.store?.storeName
            ? `${quote.store.storeName} (${quote.storeCode})`
            : quote.storeCode}
        </span>
      );
    }
    if (quote.customerCode) {
      return (
        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
          <Layers className="size-3.5" />
          【客户通用】
          {quote.customer?.customerName
            ? `${quote.customer.customerName} (${quote.customerCode})`
            : quote.customerCode}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
        <MapPin className="size-3.5" />
        【区域通用】{quote.regionCode || "未指定"}
      </span>
    );
  };

  const renderDate = (dateVal?: string | Date | null) => {
    if (!dateVal) return "长期有效";
    return formatDate(dateVal);
  };

  const columns: DetailTableColumn<QuoteItemDetail>[] = useMemo(
    () => [
      {
        id: "itemCode",
        header: "商品编码",
        renderCell: (item) => (
          <span className="text-muted-foreground font-mono">
            {item.itemCode}
          </span>
        ),
      },
      {
        id: "itemName",
        header: "商品名称",
        renderCell: (item) => (
          <span className="font-medium text-foreground">{item.itemName}</span>
        ),
      },
      {
        id: "salesUnit",
        header: "销售单位",
        align: "center",
        renderCell: (item) => <span>{item.salesUnit}</span>,
      },
      {
        id: "unitPriceExclTax",
        header: "不含税单价",
        align: "right",
        renderCell: (item) => (
          <span className="font-mono text-muted-foreground">
            ¥{Number(item.unitPriceExclTax || 0).toFixed(2)}
          </span>
        ),
      },
      {
        id: "taxRate",
        header: "税率 (%)",
        align: "right",
        renderCell: (item) => (
          <span className="font-mono text-muted-foreground">
            {Number(item.taxRate || 0).toFixed(1)}%
          </span>
        ),
      },
      {
        id: "unitPriceInclTax",
        header: "含税单价",
        align: "right",
        renderCell: (item) => (
          <span className="font-mono font-semibold text-primary">
            ¥{Number(item.unitPriceInclTax || 0).toFixed(2)}
          </span>
        ),
      },
      {
        id: "qtyConstraint",
        header: "起订限量限制",
        align: "center",
        renderCell: (item) =>
          item.minQty != null || item.maxQty != null ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-[10px] text-foreground">
              起订:{" "}
              {item.minQty == null ? "无" : `${item.minQty}${item.salesUnit}`}
              {item.maxQty == null
                ? ""
                : ` / 限购: ${item.maxQty}${item.salesUnit}`}
            </span>
          ) : (
            <span className="text-muted-foreground text-[10px]">-</span>
          ),
      },
      {
        id: "remark",
        header: "明细备注",
        renderCell: (item) => (
          <span className="text-muted-foreground truncate max-w-[150px] inline-block">
            {item.remark || "-"}
          </span>
        ),
      },
    ],
    [],
  );

  const sections: FormModalSection[] = [
    {
      title: "基本属性与适用范围",
      columns: 4,
      fields: [
        {
          name: "quoteId",
          label: "报价单号",
          type: "custom",
          render: () => (
            <span className="font-mono font-semibold text-foreground text-xs">
              {quote.quoteId}
            </span>
          ),
        },
        {
          name: "scope",
          label: "定价适用维度",
          type: "custom",
          render: () => renderScopeInfo(),
        },
        {
          name: "dates",
          label: "价格有效期",
          type: "custom",
          render: () => (
            <span className="font-mono text-foreground text-xs">
              {renderDate(quote.effectiveDate)} ~ {renderDate(quote.expiryDate)}
            </span>
          ),
        },
        {
          name: "createdBy",
          label: "创建人",
          type: "custom",
          render: () => (
            <span className="text-foreground text-xs">
              {quote.createdBy || "系统管理员"}
            </span>
          ),
        },
      ],
    },
  ];

  return (
    <FormModal
      open={open}
      onClose={onClose}
      mode="view"
      badge="QD"
      title={
        <div className="flex items-center gap-3">
          <span className="font-semibold text-base text-foreground">
            {quote.displayName || "报价单详情"}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {quote.quoteId}
          </span>
          {renderStatusBadge(quote.status)}
        </div>
      }
      description="查看报价单元数据、执行维度、有效期及商品定价明细清单。"
      className="max-w-5xl sm:max-w-5xl"
      sections={sections}
      initialValues={{}}
      detailConfig={{
        title: "商品定价明细清单",
        description: "包含增值税率与批量起订约束",
        columns: columns,
        readOnly: true,
        emptyText: "暂无商品定价明细",
      }}
      initialItems={quote.items || []}
      footer={
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60 w-full">
          <div className="text-xs text-muted-foreground">
            共计 {quote.items?.length || 0} 个定价品项
          </div>
          <div className="flex items-center gap-2">
            {quote.status === "DRAFT" && onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(quote);
                }}
              >
                编辑草稿
              </Button>
            )}
            <Button type="button" variant="default" size="sm" onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>
      }
    />
  );
}
