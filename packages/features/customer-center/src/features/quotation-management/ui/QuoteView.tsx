"use client";

import React, { useState, useEffect } from "react";
import {
  DataTable,
  Badge,
  DataTableRowActions,
  toast,
  useListUrlNav,
  type ColumnDef,
} from "@base/ui";
import { exportContractCsv } from "@base/shared";
import { useAbility } from "@base/authorization";
import { updateQuoteStatusAction } from "../actions";
import { CreateQuoteModal } from "./CreateQuoteModal";
import { CustomerQuoteField, quotePageContract } from "../contract";
import type { QuoteListItem } from "../types";
import type { CustomerListItem } from "../../customer-management/types";
import type { StoreListItem } from "../../store-management/types";

/**
 * 报价单中心组件入参属性契约
 */
interface Props {
  /** 初始报价单列表数据（服务端当前页） */
  initialQuotes: QuoteListItem[];
  initialTotal?: number;
  initialPage?: number;
  initialPageSize?: number;
  initialStatus?: string;
  /** 可选客户字典列表 */
  customers: CustomerListItem[];
  /** 可选门店字典列表 */
  stores: StoreListItem[];
}

/**
 * 客户中心 - 客户阶梯价与报价单中心工作台
 * 遵循现代数智工业风规范，全面接入 BusinessTableWorkspace 体系
 */
export function QuoteView({
  initialQuotes,
  initialTotal,
  initialPage = 1,
  initialPageSize = 10,
  initialStatus = "",
  customers,
  stores,
}: Props) {
  const ability = useAbility();
  const { navigateList, router } = useListUrlNav();
  const [quotes, setQuotes] = useState<QuoteListItem[]>(initialQuotes);
  const [total, setTotal] = useState(initialTotal ?? initialQuotes.length);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setQuotes(initialQuotes);
    setTotal(initialTotal ?? initialQuotes.length);
    setPage(initialPage);
    setPageSize(initialPageSize);
  }, [initialQuotes, initialTotal, initialPage, initialPageSize]);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const [showModal, setShowModal] = useState(false);

  /**
   * 更新报价单状态（审核生效 / 作废）
   */
  const handleUpdateStatus = async (
    quoteId: string,
    status: "ACTIVE" | "VOIDED",
  ) => {
    try {
      const res = await updateQuoteStatusAction(quoteId, status);
      if (res.success) {
        setQuotes((prev) =>
          prev.map((item) =>
            item.quoteId === quoteId ? { ...item, status } : item,
          ),
        );
        toast.success(status === "ACTIVE" ? "报价单已生效" : "报价单已作废");
        router?.refresh();
      } else {
        toast.error(res.error || "操作失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "更新报价单状态异常");
    }
  };

  const handleExport = () => {
    exportContractCsv(quotes, quotePageContract.configurableFields ?? [], {
      subject: quotePageContract.subject,
      ability,
      filename: `门店报价单_${new Date().toISOString().slice(0, 10)}.csv`,
      format: {
        [CustomerQuoteField.STATUS]: (q) => q.status,
      },
    });
  };

  /**
   * 状态语义化徽章组件渲染
   */
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

  /**
   * 标准表格列定义（强类型化，无 any 逃逸）
   */
  const columns: ColumnDef<QuoteListItem>[] = [
    {
      id: "quoteId",
      field: CustomerQuoteField.QUOTE_ID,
      header: "报价单号",
      width: 150,
      cell: (q: QuoteListItem) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {q.quoteId}
        </span>
      ),
    },
    {
      id: "displayName",
      field: CustomerQuoteField.DISPLAY_NAME,
      header: "对外简称",
      cell: (q: QuoteListItem) => (
        <div className="font-medium text-foreground">
          {q.displayName || "标准定价单"}
        </div>
      ),
    },
    {
      id: "scope",
      field: CustomerQuoteField.SCOPE_TYPE,
      header: "定价适用维度",
      width: 200,
      cell: (q: QuoteListItem) => {
        if (q.storeCode) {
          return (
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              【门店专价】{q.storeCode}
            </span>
          );
        }
        if (q.customerCode) {
          return (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              【客户通用】{q.customer?.customerName || q.customerCode}
            </span>
          );
        }
        return (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            【区域通用】{q.regionCode}
          </span>
        );
      },
    },
    {
      id: "validity",
      field: CustomerQuoteField.EFFECTIVE_DATE,
      header: "生效有效期",
      width: 170,
      cell: (q: QuoteListItem) => (
        <div className="text-xs">
          <div>自: {new Date(q.effectiveDate).toLocaleDateString()}</div>
          <div className="text-muted-foreground">
            至:{" "}
            {q.expiryDate
              ? new Date(q.expiryDate).toLocaleDateString()
              : "长期有效"}
          </div>
        </div>
      ),
    },
    {
      id: "itemCount",
      header: "明细品项数",
      width: 120,
      align: "center",
      cell: (q: QuoteListItem) => (
        <span className="font-mono text-xs text-foreground font-medium">
          {q.items?.length || 0} 个品项
        </span>
      ),
    },
    {
      id: "status",
      field: CustomerQuoteField.STATUS,
      header: "状态",
      width: 90,
      align: "center",
      cell: (q: QuoteListItem) => renderStatusBadge(q.status),
    },
    {
      id: "actions",
      header: "操作",
      width: 90,
      align: "right",
      cell: (q: QuoteListItem) => (
        <DataTableRowActions
          record={q}
          extraActions={[
            ...(q.status === "DRAFT"
              ? [
                  {
                    label: "审核生效",
                    onClick: () => handleUpdateStatus(q.quoteId, "ACTIVE"),
                  },
                ]
              : []),
            ...(q.status === "ACTIVE"
              ? [
                  {
                    label: "作废报价单",
                    variant: "destructive" as const,
                    onClick: () => handleUpdateStatus(q.quoteId, "VOIDED"),
                    confirm: {
                      title: `确认作废报价单 "${q.displayName || q.quoteId}"？`,
                      description: "作废后客户下单将不再匹配此单据定价。",
                      confirmText: "确认作废",
                      cancelText: "取消",
                    },
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <DataTable.Workspace
        data={quotes}
        columns={columns}
        rowKey={(q: QuoteListItem) => q.quoteId}
        subject={quotePageContract.subject}
        title="客户阶梯价与报价单"
        description="按门店、客户、区域维护商品报价明细。报价优先级：门店专属报价 > 客户通用报价 > 区域保底报价。"
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(nextPage, nextPageSize) => {
          setPage(nextPage);
          setPageSize(nextPageSize);
          navigateList({ page: nextPage, pageSize: nextPageSize });
        }}
        onRefresh={() => router?.refresh()}
        onExport={handleExport}
        onCreate={() => setShowModal(true)}
        showKeywordFilter={false}
        statusOptions={[
          { value: "DRAFT", label: "草稿" },
          { value: "ACTIVE", label: "已生效" },
          { value: "VOIDED", label: "已作废" },
          { value: "EXPIRED", label: "已过期" },
        ]}
        statusValue={statusFilter}
        statusAllValue="ALL"
        onStatusChange={(v) => {
          const next = v === "ALL" ? "" : v;
          setStatusFilter(next);
          setPage(1);
          navigateList({ page: 1, status: next });
        }}
        onSearch={() => {
          setPage(1);
          navigateList({ page: 1 });
        }}
        onReset={() => {
          setStatusFilter("");
          setPage(1);
          navigateList({ page: 1, status: "" });
        }}
        contentProps={{
          selectable: true,
          renderExpandedRow: (q: QuoteListItem) => (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span>商品定价明细清单</span>
                <span className="font-mono text-muted-foreground font-normal">
                  ({q.items?.length || 0} 个品项)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {q.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded border border-border/70 bg-card text-xs flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium text-foreground">
                        {item.itemName}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {item.itemCode}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-semibold text-primary">
                        ¥{Number(item.unitPriceInclTax || 0).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        单位: {item.salesUnit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ),
        }}
      >
        {showModal && (
          <CreateQuoteModal
            customers={customers}
            stores={stores}
            onClose={() => setShowModal(false)}
            onCreated={() => router?.refresh()}
          />
        )}
      </DataTable.Workspace>
    </>
  );
}
