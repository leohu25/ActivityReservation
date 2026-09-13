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
import { updateQuoteStatusAction, deleteQuoteAction } from "../actions";
import { QuoteDetailModal } from "./QuoteDetailModal";
import { QuoteFormModal } from "./QuoteFormModal";
import { CustomerQuoteField, quotePageContract } from "../contract";
import type { QuoteListItem } from "../types";
import type { CustomerListItem } from "../../customer-management/types";
import type { StoreListItem } from "../../store-management/types";

interface Props {
  initialQuotes: QuoteListItem[];
  initialTotal?: number;
  initialPage?: number;
  initialPageSize?: number;
  initialStatus?: string;
  customers: CustomerListItem[];
  stores: StoreListItem[];
}

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
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  // 弹窗状态管理
  const [detailQuote, setDetailQuote] = useState<QuoteListItem | null>(null);
  const [formState, setFormState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    record?: QuoteListItem | null;
  }>({ open: false, mode: "create", record: null });

  useEffect(() => {
    setQuotes(initialQuotes);
    setTotal(initialTotal ?? initialQuotes.length);
    setPage(initialPage);
    setPageSize(initialPageSize);
  }, [initialQuotes, initialTotal, initialPage, initialPageSize]);

  /**
   * 审核生效 / 作废
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

  /**
   * 删除草稿报价单 (软删除)
   */
  const handleDeleteQuote = async (quoteId: string) => {
    try {
      const res = await deleteQuoteAction(quoteId);
      if (res.success) {
        setQuotes((prev) => prev.filter((item) => item.quoteId !== quoteId));
        setTotal((prev) => Math.max(0, prev - 1));
        toast.success("草稿报价单已成功删除");
        router?.refresh();
      } else {
        toast.error(res.error || "删除失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "删除报价单异常");
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

  const columns: ColumnDef<QuoteListItem>[] = [
    {
      id: "quoteId",
      field: CustomerQuoteField.QUOTE_ID,
      header: "报价单号",
      width: 160,
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
              【门店专价】
              {q.store?.storeName
                ? `${q.store.storeName} (${q.storeCode})`
                : q.storeCode}
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
      width: 110,
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
      width: 140,
      align: "right",
      cell: (q: QuoteListItem) => (
        <DataTableRowActions
          record={q}
          onView={() => setDetailQuote(q)}
          onEdit={() => setFormState({ open: true, mode: "edit", record: q })}
          hideEdit={q.status !== "DRAFT"}
          onDelete={() => handleDeleteQuote(q.quoteId)}
          hideDelete={q.status !== "DRAFT"}
          deleteConfirm={{
            title: `确认删除草稿报价单 "${q.displayName || q.quoteId}"？`,
            description: "删除后此草稿报价单将从系统彻底移除，无法恢复。",
            confirmText: "确认删除",
            cancelText: "取消",
          }}
          extraActions={[
            ...(q.status === "DRAFT"
              ? [
                  {
                    label: "审核生效",
                    action: "audit",
                    onClick: () => handleUpdateStatus(q.quoteId, "ACTIVE"),
                    confirm: {
                      title: `确认审核并生效报价单 "${q.displayName || q.quoteId}"？`,
                      description: "生效后对应维度的商品下单将立即执行此价格。",
                      confirmText: "审核生效",
                      cancelText: "取消",
                    },
                  },
                ]
              : []),
            ...(q.status === "ACTIVE"
              ? [
                  {
                    label: "作废报价单",
                    action: "update",
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
        onCreate={() =>
          setFormState({ open: true, mode: "create", record: null })
        }
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
      />

      {/* 详情看板弹窗 */}
      <QuoteDetailModal
        open={Boolean(detailQuote)}
        quote={detailQuote}
        onClose={() => setDetailQuote(null)}
        onEdit={(q) => setFormState({ open: true, mode: "edit", record: q })}
      />

      {/* 新增 / 编辑表单弹窗 */}
      {formState.open && (
        <QuoteFormModal
          mode={formState.mode}
          record={formState.record}
          customers={customers}
          stores={stores}
          onClose={() =>
            setFormState({ open: false, mode: "create", record: null })
          }
          onSuccess={() => {
            setFormState({ open: false, mode: "create", record: null });
            router?.refresh();
          }}
        />
      )}
    </>
  );
}
