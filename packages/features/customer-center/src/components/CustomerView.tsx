"use client";

import React, { useState } from "react";
import { Plus, Search, ShieldAlert, Store } from "lucide-react";
import {
  createCustomerAction,
  updateCustomerStatusAction,
  deleteCustomerAction,
} from "../actions";

interface Props {
  initialCustomers: any[];
  categories: any[];
  tags: any[];
}

export function CustomerView({ initialCustomers, categories, tags }: Props) {
  const [customers] = useState(initialCustomers);
  const [keyword, setKeyword] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 新建客户表单
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [catCode, setCatCode] = useState(categories[0]?.categoryCode || "");
  const [person, setPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [settlement, setSettlement] = useState<"MONTHLY" | "CASH" | "PREPAID">(
    "MONTHLY",
  );
  const [taxRate, setTaxRate] = useState("9");
  const [creditLimit, setCreditLimit] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [salesPerson, setSalesPerson] = useState("");
  const [warehouse] = useState("");
  const [paymentCycle] = useState("MONTHLY");
  const [serviceTime, setServiceTime] = useState("");

  const filteredCustomers = customers.filter((c) => {
    if (selectedCat && c.categoryCode !== selectedCat) return false;
    if (selectedStatus && c.status !== selectedStatus) return false;
    if (keyword) {
      const matchName = c.customerName
        .toLowerCase()
        .includes(keyword.toLowerCase());
      const matchCode = c.customerCode
        .toLowerCase()
        .includes(keyword.toLowerCase());
      const matchPerson = c.contactPerson
        .toLowerCase()
        .includes(keyword.toLowerCase());
      if (!matchName && !matchCode && !matchPerson) return false;
    }
    return true;
  });

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await createCustomerAction({
        customerName: name,
        categoryCode: catCode,
        contactPerson: person,
        contactPhone: phone,
        settlementMethod: settlement,
        defaultTaxRate: taxRate ? parseFloat(taxRate) : null,
        creditLimit: creditLimit ? parseFloat(creditLimit) : null,
        tagCodes: selectedTags,
        salesPerson: salesPerson || null,
        defaultWarehouse: warehouse || null,
        paymentCycle: paymentCycle || null,
        serviceTime: serviceTime || null,
      });

      if (res.success) {
        setShowModal(false);
        window.location.reload();
      } else {
        setError(res.error || "创建客户失败");
      }
    } catch (err: any) {
      setError(err.message || "请求失败");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (
    customerCode: string,
    currentStatus: string,
  ) => {
    if (
      currentStatus === "ACTIVE" &&
      !confirm(
        "警告：停用该客户将导致其名下所有关联门店强制同步停用！确认停用？",
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    const nextStatus = currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      const res = await updateCustomerStatusAction(customerCode, nextStatus);
      if (res.success) {
        window.location.reload();
      } else {
        setError(res.error || "更新状态失败");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerCode: string) => {
    if (
      !confirm(
        `确认尝试删除客户 [${customerCode}]？注意：已有门店或业务记录的客户系统将拒绝删除。`,
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await deleteCustomerAction(customerCode);
      if (res.success) {
        window.location.reload();
      } else {
        setError(res.error || "删除失败");
      }
    } finally {
      setLoading(false);
    }
  };

  const settlementLabels: Record<string, string> = {
    MONTHLY: "月结",
    CASH: "现结",
    PREPAID: "预付款",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            客户档案管理
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            维护企业客户主数据、结算方式、授信与服务时间。一个客户下可挂载多个履约门店。
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus className="size-4" />
          新建客户
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
          <ShieldAlert className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 工业风筛选工具栏 */}
      <div className="flex flex-wrap items-center gap-3 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索客户名称、编码、联系人..."
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm outline-none"
          />
        </div>

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm"
        >
          <option value="">全部客户分类</option>
          {categories.map((c) => (
            <option key={c.categoryCode} value={c.categoryCode}>
              {c.categoryName}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm"
        >
          <option value="">全部状态</option>
          <option value="ACTIVE">正常</option>
          <option value="DISABLED">已停用</option>
        </select>
      </div>

      {/* 客户列表表格 */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
            <thead className="bg-zinc-100/70 dark:bg-zinc-800/60 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3">客户编码</th>
                <th className="px-4 py-3">客户名称</th>
                <th className="px-4 py-3">分类</th>
                <th className="px-4 py-3">联系人/电话</th>
                <th className="px-4 py-3">结算/税率</th>
                <th className="px-4 py-3">下属门店数</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-zinc-400">
                    暂无符合条件的客户档案
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.customerCode}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-medium text-xs text-zinc-900 dark:text-zinc-100">
                      {c.customerCode}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      <div>{c.customerName}</div>
                      {c.customerTags && (
                        <div className="text-xs text-zinc-400 mt-0.5">
                          {c.customerTags.split(",").map((t: string) => (
                            <span
                              key={t}
                              className="inline-block mr-1 px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 rounded"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 rounded text-xs">
                        {c.category?.categoryName || c.categoryCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div>{c.contactPerson}</div>
                      <div className="text-zinc-400">{c.contactPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div>
                        {settlementLabels[c.settlementMethod] ||
                          c.settlementMethod}
                      </div>
                      <div className="text-zinc-400">
                        税率:{" "}
                        {c.defaultTaxRate ? `${c.defaultTaxRate}%` : "未设"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                        <Store className="size-3.5" />
                        {c._count?.stores || c.stores?.length || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          c.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {c.status === "ACTIVE" ? "正常" : "已停用"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() =>
                          handleToggleStatus(c.customerCode, c.status)
                        }
                        className="text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 underline"
                      >
                        {c.status === "ACTIVE" ? "停用" : "启用"}
                      </button>
                      <button
                        onClick={() => handleDelete(c.customerCode)}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 underline"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新建客户模态窗口 */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-2xl w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              新建客户主数据档案
            </h3>
            <form onSubmit={handleCreateCustomer} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    客户企业名称 *
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="如: 绿叶餐饮管理有限公司"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    客户分类 *
                  </label>
                  <select
                    required
                    value={catCode}
                    onChange={(e) => setCatCode(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c.categoryCode} value={c.categoryCode}>
                        {c.categoryName} ({c.categoryCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    联系人姓名 *
                  </label>
                  <input
                    required
                    value={person}
                    onChange={(e) => setPerson(e.target.value)}
                    placeholder="如: 张经理"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    联系人电话 *
                  </label>
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="如: 13800138000"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    结算方式 *
                  </label>
                  <select
                    value={settlement}
                    onChange={(e) => setSettlement(e.target.value as any)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                  >
                    <option value="MONTHLY">月结 (MONTHLY)</option>
                    <option value="CASH">现结 (CASH)</option>
                    <option value="PREPAID">预付 (PREPAID)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    默认税率(%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    placeholder="如: 9.00"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    信用额度(元)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder="如: 50000.00"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  业务标签 (多选)
                </label>
                <div className="flex flex-wrap gap-2 p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg max-h-24 overflow-y-auto">
                  {tags.map((t) => {
                    const checked = selectedTags.includes(t.tagCode);
                    return (
                      <button
                        type="button"
                        key={t.tagCode}
                        onClick={() => {
                          if (checked) {
                            setSelectedTags(
                              selectedTags.filter((x) => x !== t.tagCode),
                            );
                          } else {
                            setSelectedTags([...selectedTags, t.tagCode]);
                          }
                        }}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          checked
                            ? "bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                            : "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {t.tagName}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    业务专员
                  </label>
                  <input
                    value={salesPerson}
                    onChange={(e) => setSalesPerson(e.target.value)}
                    placeholder="业务经理姓名"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    服务收货时间
                  </label>
                  <input
                    value={serviceTime}
                    onChange={(e) => setServiceTime(e.target.value)}
                    placeholder="如: 早8:00 - 10:00"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                  />
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
                  {loading ? "保存中..." : "创建客户档案"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
