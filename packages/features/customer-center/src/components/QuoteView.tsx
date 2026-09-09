"use client";

import React, { useState } from "react";
import { Plus, Search, ShieldAlert, Trash2 } from "lucide-react";
import { createQuoteAction, updateQuoteStatusAction } from "../actions";
import type { CreateQuoteItemInput } from "../types";

interface Props {
  initialQuotes: any[];
  customers: any[];
  stores: any[];
}

export function QuoteView({ initialQuotes, customers, stores }: Props) {
  const [quotes] = useState(initialQuotes);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 新建报价单模态框
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

  // 明细行列表
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

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert("报价单至少需要保留一行商品明细");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof CreateQuoteItemInput,
    value: any,
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // 含税价与不含税价动态联动
    if (field === "unitPriceExclTax") {
      const rate = updated[index].taxRate || 9;
      updated[index].unitPriceInclTax = parseFloat(
        (Number(value) * (1 + rate / 100)).toFixed(2),
      );
    } else if (field === "taxRate") {
      const excl = updated[index].unitPriceExclTax || 0;
      updated[index].unitPriceInclTax = parseFloat(
        (Number(excl) * (1 + Number(value) / 100)).toFixed(2),
      );
    }

    setItems(updated);
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
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
        setShowModal(false);
        window.location.reload();
      } else {
        setError(res.error || "创建报价单失败");
      }
    } catch (err: any) {
      setError(err.message || "请求异常");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    quoteId: string,
    status: "ACTIVE" | "VOIDED",
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await updateQuoteStatusAction(quoteId, status);
      if (res.success) {
        window.location.reload();
      } else {
        setError(res.error || "操作失败");
      }
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            草稿
          </span>
        );
      case "ACTIVE":
        return (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            已生效
          </span>
        );
      case "VOIDED":
        return (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            已作废
          </span>
        );
      case "EXPIRED":
        return (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            已过期
          </span>
        );
      default:
        return (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-zinc-100">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            门店报价单管理
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            按门店、客户、区域维护商品报价明细。报价优先级：门店报价 &gt;
            客户报价 &gt; 区域报价。
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus className="size-4" />
          拟定新报价单
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
          <ShieldAlert className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-3 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索报价单号、对外简称..."
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm"
        >
          <option value="">全部状态</option>
          <option value="DRAFT">草稿</option>
          <option value="ACTIVE">已生效</option>
          <option value="VOIDED">已作废</option>
          <option value="EXPIRED">已过期</option>
        </select>
      </div>

      {/* 报价单列表 */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
            <thead className="bg-zinc-100/70 dark:bg-zinc-800/60 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3">报价单号</th>
                <th className="px-4 py-3">对外名称</th>
                <th className="px-4 py-3">定价适用维度</th>
                <th className="px-4 py-3">生效有效期</th>
                <th className="px-4 py-3">明细品项数</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-400">
                    暂无符合条件的报价单
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => (
                  <tr
                    key={q.quoteId}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-medium text-xs text-zinc-900 dark:text-zinc-100">
                      {q.quoteId}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {q.displayName || "标准定价单"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {q.storeCode ? (
                        <span className="text-purple-600 dark:text-purple-400 font-medium">
                          【门店专价】{q.store?.storeName || q.storeCode}
                        </span>
                      ) : q.customerCode ? (
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          【客户通用】
                          {q.customer?.customerName || q.customerCode}
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          【区域通用】{q.regionCode}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div>
                        自: {new Date(q.effectiveDate).toLocaleDateString()}
                      </div>
                      <div className="text-zinc-400">
                        至:{" "}
                        {q.expiryDate
                          ? new Date(q.expiryDate).toLocaleDateString()
                          : "长期有效"}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {q.items?.length || q.itemCount} 个商品
                    </td>
                    <td className="px-4 py-3">{statusBadge(q.status)}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {q.status === "DRAFT" && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(q.quoteId, "ACTIVE")
                          }
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium underline"
                        >
                          审核生效
                        </button>
                      )}
                      {q.status === "ACTIVE" && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(q.quoteId, "VOIDED")
                          }
                          className="text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 underline"
                        >
                          作废
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增报价单抽屉/模态框 */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-4xl w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl max-h-[92vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              拟定新报价单
            </h3>
            <form onSubmit={handleCreateQuote} className="space-y-4 text-sm">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-200 dark:border-zinc-700/60 space-y-3">
                <div className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">
                  适用范围设定 (三选一)
                </div>
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="scopeType"
                      checked={scopeType === "STORE"}
                      onChange={() => setScopeType("STORE")}
                    />
                    门店专属报价 (优先级最高)
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="scopeType"
                      checked={scopeType === "CUSTOMER"}
                      onChange={() => setScopeType("CUSTOMER")}
                    />
                    客户全门店通用
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
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
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        所属客户 *
                      </label>
                      <select
                        value={customerCode}
                        onChange={(e) => setCustomerCode(e.target.value)}
                        className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
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
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        所属门店 *
                      </label>
                      <select
                        value={storeCode}
                        onChange={(e) => setStoreCode(e.target.value)}
                        className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
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
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        区域编码 *
                      </label>
                      <input
                        value={regionCode}
                        onChange={(e) => setRegionCode(e.target.value)}
                        placeholder="如: REGION_BJ_01"
                        className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      对外简称 (给客户看)
                    </label>
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="如: 2026秋季净菜直供报价单"
                      className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      价格生效日期 *
                    </label>
                    <input
                      type="date"
                      required
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      失效日期 (为空则长期有效)
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 明细行维护 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
                    报价明细条目 ({items.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded font-medium"
                  >
                    <Plus className="size-3" />
                    添加商品
                  </button>
                </div>

                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 uppercase">
                      <tr>
                        <th className="p-2">商品编码</th>
                        <th className="p-2">商品名称</th>
                        <th className="p-2">单位</th>
                        <th className="p-2">不含税单价</th>
                        <th className="p-2">税率(%)</th>
                        <th className="p-2">含税单价</th>
                        <th className="p-2">最小起订</th>
                        <th className="p-2">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {items.map((item, idx) => (
                        <tr key={idx}>
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
                              className="w-24 px-1.5 py-1 border rounded bg-transparent text-xs"
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
                              className="w-36 px-1.5 py-1 border rounded bg-transparent text-xs"
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
                              className="w-12 px-1.5 py-1 border rounded bg-transparent text-xs"
                            />
                          </td>
                          <td className="p-2">
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
                              className="w-20 px-1.5 py-1 border rounded bg-transparent text-xs"
                            />
                          </td>
                          <td className="p-2">
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
                              className="w-16 px-1.5 py-1 border rounded bg-transparent text-xs"
                            />
                          </td>
                          <td className="p-2 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                            ¥{item.unitPriceInclTax}
                          </td>
                          <td className="p-2">
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
                              className="w-16 px-1.5 py-1 border rounded bg-transparent text-xs"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium rounded-lg"
                >
                  {loading ? "保存中..." : "创建报价单 (保存为草稿)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
