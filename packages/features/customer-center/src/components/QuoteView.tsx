"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, FileSpreadsheet, Download } from "lucide-react";
import {
  DataTable,
  Button,
  Input,
  Badge,
  DataTableRowActions,
  toast,
  type ColumnDef,
} from "@chenrun/ui";
import { createQuoteAction, updateQuoteStatusAction } from "../actions";
import { CustomerQuoteField, quotePageContract } from "../contracts";
import type {
  CreateQuoteItemInput,
  QuoteListItem,
  CustomerListItem,
  StoreListItem,
} from "../types";

/**
 * 报价单中心组件入参属性契约
 */
interface Props {
  /** 初始报价单列表数据 */
  initialQuotes: QuoteListItem[];
  /** 可选客户字典列表 */
  customers: CustomerListItem[];
  /** 可选门店字典列表 */
  stores: StoreListItem[];
  ability?: {
    can(action: string, subject: string, field?: string): boolean;
  };
  permissions?: {
    readonly actions: readonly string[];
    readonly fieldPolicies?: Readonly<Record<string, string>>;
  };
}

function useSafeRouter() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

/**
 * 客户中心 - 客户阶梯价与报价单中心工作台
 * 遵循现代数智工业风规范，全面接入 BusinessTableWorkspace 体系
 */
export function QuoteView({
  initialQuotes,
  customers,
  stores,
  ability: explicitAbility,
  permissions,
}: Props) {
  const ability = React.useMemo(() => {
    if (explicitAbility) return explicitAbility;
    if (!permissions) return undefined;
    return {
      can(action: string, subject?: string, field?: string) {
        if (subject && subject !== quotePageContract.subject) return false;
        if (!permissions.actions.includes(action)) return false;
        if (field && permissions.fieldPolicies?.[field] === "HIDDEN")
          return false;
        return true;
      },
    };
  }, [explicitAbility, permissions]);
  const router = useSafeRouter();
  const [quotes, setQuotes] = useState<QuoteListItem[]>(initialQuotes);

  useEffect(() => {
    setQuotes(initialQuotes);
  }, [initialQuotes]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);

  // 新建报价单模态框表单状态
  const [showModal, setShowModal] = useState(false);
  const [scopeType, setScopeType] = useState<"CUSTOMER" | "STORE" | "REGION">(
    "STORE",
  );
  const [customerCode, setCustomerCode] = useState(
    customers[0]?.customerCode || "",
  );
  const [storeCode, setStoreCode] = useState(stores[0]?.storeCode || "");
  const [regionCode, setRegionCode] = useState("REGION_BJ_01");
  const [quoteDate] = useState(new Date().toISOString().split("T")[0]);
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [expiryDate, setExpiryDate] = useState("");
  const [displayName, setDisplayName] = useState("");

  // 明细行条目列表
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

  /**
   * 客户端条件筛选逻辑
   */
  const filteredQuotes = quotes.filter((q) => {
    if (statusFilter && q.status !== statusFilter) return false;
    if (keyword) {
      const matchId = q.quoteId.toLowerCase().includes(keyword.toLowerCase());
      const matchName = q.displayName
        ?.toLowerCase()
        .includes(keyword.toLowerCase());
      if (!matchId && !matchName) return false;
    }
    return true;
  });

  /**
   * 添加明细行
   */
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        itemCode: `ITEM_VEG_${String(items.length + 1).padStart(3, "0")}`,
        itemName: "特选生鲜净菜",
        salesUnit: "kg",
        unitPriceExclTax: 10.0,
        unitPriceInclTax: 10.9,
        taxRate: 9.0,
        minQty: 5,
        maxQty: null,
        remark: "",
      },
    ]);
  };

  /**
   * 移除指定明细行
   */
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert("报价单至少保留一条品项明细");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  /**
   * 修改明细行字段值并联动含税单价计算
   */
  const handleItemChange = (
    index: number,
    field: keyof CreateQuoteItemInput,
    val: string | number | null,
  ) => {
    const updated = [...items];
    const curr = { ...updated[index], [field]: val };

    // 自动按税率推导含税单价
    if (field === "unitPriceExclTax" || field === "taxRate") {
      const excl = Number(curr.unitPriceExclTax) || 0;
      const rate = Number(curr.taxRate) || 0;
      curr.unitPriceInclTax = parseFloat((excl * (1 + rate / 100)).toFixed(2));
    }

    updated[index] = curr;
    setItems(updated);
  };

  /**
   * 提交拟定新报价单
   */
  const handleCreateQuote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        scopeType,
        customerCode:
          scopeType === "CUSTOMER" || scopeType === "STORE"
            ? customerCode
            : null,
        storeCode: scopeType === "STORE" ? storeCode : null,
        regionCode: scopeType === "REGION" ? regionCode : null,
        quoteDate,
        effectiveDate,
        expiryDate: expiryDate || null,
        displayName: displayName || null,
        createdBy: "系统管理员",
        items,
      };

      const res = await createQuoteAction(payload);
      if (res.success) {
        toast.success("报价单创建成功");
        setShowModal(false);
        router?.refresh();
      } else {
        toast.error(res.error || "创建报价单失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "请求异常");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 更新报价单状态（审核生效 / 作废）
   */
  const handleUpdateStatus = async (
    quoteId: string,
    status: "ACTIVE" | "VOIDED",
  ) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const fieldKeys: Array<{
      key: keyof QuoteListItem;
      field?: string;
      label: string;
    }> = [
      {
        key: "quoteId",
        field: CustomerQuoteField.QUOTE_ID,
        label: "报价单号",
      },
      {
        key: "displayName",
        field: CustomerQuoteField.DISPLAY_NAME,
        label: "对外简称",
      },
      {
        key: "scopeType",
        field: CustomerQuoteField.SCOPE_TYPE,
        label: "适用维度",
      },
      {
        key: "effectiveDate",
        field: CustomerQuoteField.EFFECTIVE_DATE,
        label: "生效日期",
      },
      {
        key: "expiryDate",
        field: CustomerQuoteField.EXPIRY_DATE,
        label: "失效日期",
      },
      {
        key: "status",
        field: CustomerQuoteField.STATUS,
        label: "状态",
      },
    ];

    const activeExportFields = fieldKeys.filter((f) => {
      if (!ability || !f.field) return true;
      return ability.can("read", quotePageContract.subject, f.field);
    });

    const csvContent = [
      activeExportFields.map((f) => f.label).join(","),
      ...filteredQuotes.map((q) =>
        activeExportFields
          .map((f) => {
            const val = q[f.key];
            if (val === null || val === undefined) return "";
            if (val instanceof Date) return val.toISOString().slice(0, 10);
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `门店报价单_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    <div className="space-y-4">
      {/* 头部标题与新建按钮 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">
              客户阶梯价与报价单中心
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            按门店、客户、区域维护商品报价明细。报价优先级：门店专属报价 &gt;
            客户通用报价 &gt; 区域保底报价。
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(!ability || ability.can("export", quotePageContract.subject)) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="font-semibold shadow-xs gap-1.5"
            >
              <Download className="size-4 text-muted-foreground" />
              <span>导出报价单</span>
            </Button>
          )}
          {(!ability || ability.can("create", quotePageContract.subject)) && (
            <Button
              size="sm"
              onClick={() => setShowModal(true)}
              className="font-semibold shadow-xs"
            >
              <Plus className="size-4 mr-1" />
              <span>拟定新报价单</span>
            </Button>
          )}
        </div>
      </div>

      {/* 复合积木化 DataTable */}
      <DataTable.Root
        data={filteredQuotes}
        columns={columns}
        rowKey={(q: QuoteListItem) => q.quoteId}
        subject={quotePageContract.subject}
        ability={ability}
        permissions={permissions}
        total={filteredQuotes.length}
      >
        <DataTable.Toolbar>
          <div className="flex flex-wrap items-center gap-2">
            <DataTable.Search
              value={keyword}
              onChange={setKeyword}
              placeholder="搜索报价单号、对外简称..."
            />
            <DataTable.FacetedFilter
              title="单据状态"
              options={[
                { label: "草稿", value: "DRAFT" },
                { label: "已生效", value: "ACTIVE" },
                { label: "已作废", value: "VOIDED" },
                { label: "已过期", value: "EXPIRED" },
              ]}
              selectedValues={statusFilter ? [statusFilter] : []}
              onSelect={(vals) => setStatusFilter(vals[0] || "")}
              multiple={false}
            />
          </div>
        </DataTable.Toolbar>

        <DataTable.Content
          renderExpandedRow={(q: QuoteListItem) => (
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
          )}
        />
        <DataTable.Pagination />
      </DataTable.Root>

      {/* 新增报价单抽屉/模态框 */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground rounded-xl max-w-4xl w-full p-6 border shadow-2xl max-h-[92vh] overflow-y-auto">
            <h3 className="text-base font-bold text-foreground mb-4">
              拟定新报价单
            </h3>
            <form onSubmit={handleCreateQuote} className="space-y-4 text-sm">
              <div className="p-4 bg-muted/40 rounded-lg border space-y-3">
                <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  适用范围设定 (三选一)
                </div>
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer text-foreground">
                    <input
                      type="radio"
                      name="scopeType"
                      checked={scopeType === "STORE"}
                      onChange={() => setScopeType("STORE")}
                    />
                    门店专属报价 (优先级最高)
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer text-foreground">
                    <input
                      type="radio"
                      name="scopeType"
                      checked={scopeType === "CUSTOMER"}
                      onChange={() => setScopeType("CUSTOMER")}
                    />
                    客户全门店通用
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer text-foreground">
                    <input
                      type="radio"
                      name="scopeType"
                      checked={scopeType === "REGION"}
                      onChange={() => setScopeType("REGION")}
                    />
                    区域通用报价 (基准保底)
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  {scopeType !== "REGION" && (
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        所属客户 *
                      </label>
                      <select
                        value={customerCode}
                        onChange={(e) => setCustomerCode(e.target.value)}
                        className="w-full h-9 px-3 border border-input rounded-md bg-background text-foreground text-sm"
                      >
                        {customers.map((c) => (
                          <option key={c.customerCode} value={c.customerCode}>
                            {c.customerName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {scopeType === "STORE" && (
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        所属门店 *
                      </label>
                      <select
                        value={storeCode}
                        onChange={(e) => setStoreCode(e.target.value)}
                        className="w-full h-9 px-3 border border-input rounded-md bg-background text-foreground text-sm"
                      >
                        {stores.map((s) => (
                          <option key={s.storeCode} value={s.storeCode}>
                            {s.storeName} ({s.storeCode})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {scopeType === "REGION" && (
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        区域编码 *
                      </label>
                      <Input
                        value={regionCode}
                        onChange={(e) => setRegionCode(e.target.value)}
                        placeholder="如: REGION_BJ_01"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      对外简称 (给客户看)
                    </label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="如: 2026秋季净菜直供报价单"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      价格生效日期 *
                    </label>
                    <Input
                      type="date"
                      required
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      失效日期 (为空则长期有效)
                    </label>
                    <Input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 明细行维护 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                    报价明细条目 ({items.length})
                  </h4>
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
                            <input
                              value={item.itemCode}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "itemCode",
                                  e.target.value,
                                )
                              }
                              className="w-24 px-1.5 py-1 border border-input rounded bg-background text-foreground text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              value={item.itemName}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "itemName",
                                  e.target.value,
                                )
                              }
                              className="w-36 px-1.5 py-1 border border-input rounded bg-background text-foreground text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              value={item.salesUnit}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "salesUnit",
                                  e.target.value,
                                )
                              }
                              className="w-12 px-1.5 py-1 border border-input rounded bg-background text-foreground text-xs"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
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
                              className="w-20 px-1.5 py-1 border border-input rounded bg-background text-foreground text-xs text-right"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
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
                              className="w-16 px-1.5 py-1 border border-input rounded bg-background text-foreground text-xs text-right"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            ¥{item.unitPriceInclTax}
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={item.minQty || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "minQty",
                                  parseFloat(e.target.value) || null,
                                )
                              }
                              placeholder="起订量"
                              className="w-16 px-1.5 py-1 border border-input rounded bg-background text-foreground text-xs text-right"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(idx)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="font-semibold"
                >
                  {loading ? "保存中..." : "创建报价单 (保存为草稿)"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
