"use client";

import React, { useState } from "react";
import { Plus, Search, ShieldAlert, Building2 } from "lucide-react";
import {
  createStoreAction,
  updateStoreStatusAction,
  deleteStoreAction,
} from "../actions";

interface Props {
  initialStores: any[];
  customers: any[];
}

export function StoreView({ initialStores, customers }: Props) {
  const [stores] = useState(initialStores);
  const [keyword, setKeyword] = useState("");
  const [selectedCust, setSelectedCust] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 新建门店表单
  const [showModal, setShowModal] = useState(false);
  const [customerCode, setCustomerCode] = useState(
    customers[0]?.customerCode || "",
  );
  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [regionCode, setRegionCode] = useState("REGION_BJ_01");
  const [deliveryPeriod, setDeliveryPeriod] = useState("MORNING");
  const [defaultRoute] = useState("");
  const [defaultDriver] = useState("");
  const [billingContact, setBillingContact] = useState("");
  const [billingPhone, setBillingPhone] = useState("");

  const filteredStores = stores.filter((s) => {
    if (selectedCust && s.customerCode !== selectedCust) return false;
    if (selectedStatus && s.status !== selectedStatus) return false;
    if (keyword) {
      const matchName = s.storeName
        .toLowerCase()
        .includes(keyword.toLowerCase());
      const matchCode = s.storeCode
        .toLowerCase()
        .includes(keyword.toLowerCase());
      const matchAddr = s.address.toLowerCase().includes(keyword.toLowerCase());
      if (!matchName && !matchCode && !matchAddr) return false;
    }
    return true;
  });

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await createStoreAction({
        customerCode,
        storeName,
        address,
        contactPerson,
        contactPhone,
        regionCode,
        deliveryPeriod,
        defaultRoute: defaultRoute || null,
        defaultDriver: defaultDriver || null,
        billingContact: billingContact || null,
        billingPhone: billingPhone || null,
      });

      if (res.success) {
        setShowModal(false);
        window.location.reload();
      } else {
        setError(res.error || "创建门店失败");
      }
    } catch (err: any) {
      setError(err.message || "请求异常");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (
    storeCode: string,
    currentStatus: string,
  ) => {
    setLoading(true);
    setError(null);
    const nextStatus = currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      const res = await updateStoreStatusAction(storeCode, nextStatus);
      if (res.success) {
        window.location.reload();
      } else {
        setError(res.error || "变更门店状态失败");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (storeCode: string) => {
    if (
      !confirm(
        `确认尝试删除门店 [${storeCode}]？已有报价单或订单记录的门店系统将拒绝删除。`,
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await deleteStoreAction(storeCode);
      if (res.success) {
        window.location.reload();
      } else {
        setError(res.error || "删除失败");
      }
    } finally {
      setLoading(false);
    }
  };

  const deliveryPeriodLabels: Record<string, string> = {
    MORNING: "早间配送 (05:00-08:00)",
    NOON: "午间配送 (10:00-12:00)",
    EVENING: "傍晚配送 (15:00-18:00)",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            门店档案管理
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            门店是订单订货、物流配送、现场签收与对账的最小履约单元，必须归属于有效客户并绑定区域。
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus className="size-4" />
          新建门店
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
          <ShieldAlert className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 筛选工具栏 */}
      <div className="flex flex-wrap items-center gap-3 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索门店名称、编码、收货地址..."
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm outline-none"
          />
        </div>

        <select
          value={selectedCust}
          onChange={(e) => setSelectedCust(e.target.value)}
          className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm"
        >
          <option value="">全部所属客户</option>
          {customers.map((c) => (
            <option key={c.customerCode} value={c.customerCode}>
              {c.customerName}
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

      {/* 门店表格 */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
            <thead className="bg-zinc-100/70 dark:bg-zinc-800/60 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3">门店编码</th>
                <th className="px-4 py-3">门店名称</th>
                <th className="px-4 py-3">所属客户</th>
                <th className="px-4 py-3">区域/配送时段</th>
                <th className="px-4 py-3">配送收货地址</th>
                <th className="px-4 py-3">门店联系人</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-zinc-400">
                    暂无符合条件的门店档案
                  </td>
                </tr>
              ) : (
                filteredStores.map((s) => (
                  <tr
                    key={s.storeCode}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-medium text-xs text-zinc-900 dark:text-zinc-100">
                      {s.storeCode}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {s.storeName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-900 dark:text-zinc-100">
                        <Building2 className="size-3.5 text-zinc-400" />
                        <span>
                          {s.customer?.customerName || s.customerCode}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-mono text-zinc-700 dark:text-zinc-300">
                        {s.regionCode}
                      </div>
                      <div className="text-zinc-400">
                        {deliveryPeriodLabels[s.deliveryPeriod] ||
                          s.deliveryPeriod ||
                          "未设"}
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-xs max-w-xs truncate text-zinc-600 dark:text-zinc-400"
                      title={s.address}
                    >
                      {s.address}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div>{s.contactPerson}</div>
                      <div className="text-zinc-400">{s.contactPhone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          s.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {s.status === "ACTIVE" ? "正常" : "已停用"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() =>
                          handleToggleStatus(s.storeCode, s.status)
                        }
                        className="text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 underline"
                      >
                        {s.status === "ACTIVE" ? "停用" : "启用"}
                      </button>
                      <button
                        onClick={() => handleDelete(s.storeCode)}
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

      {/* 新建门店弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-2xl w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              新建门店履约档案
            </h3>
            <form onSubmit={handleCreateStore} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    所属客户企业 *
                  </label>
                  <select
                    required
                    value={customerCode}
                    onChange={(e) => setCustomerCode(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                  >
                    {customers.map((c) => (
                      <option
                        key={c.customerCode}
                        value={c.customerCode}
                        disabled={c.status === "DISABLED"}
                      >
                        {c.customerName}{" "}
                        {c.status === "DISABLED" ? " (已停用)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    门店名称 *
                  </label>
                  <input
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="如: 海淀中关村一店"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  配送收货地址 *
                </label>
                <input
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="详细配送送货地址"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    现场收货联系人 *
                  </label>
                  <input
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="如: 李店长"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    联系人电话 *
                  </label>
                  <input
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="如: 13911223344"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    所属区域编码 (必填，用于区域报价匹配) *
                  </label>
                  <input
                    required
                    value={regionCode}
                    onChange={(e) => setRegionCode(e.target.value)}
                    placeholder="如: REGION_BJ_01"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    配送时段
                  </label>
                  <select
                    value={deliveryPeriod}
                    onChange={(e) => setDeliveryPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                  >
                    <option value="MORNING">早间配送 (05:00-08:00)</option>
                    <option value="NOON">午间配送 (10:00-12:00)</option>
                    <option value="EVENING">傍晚配送 (15:00-18:00)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    结款联系人 (选填)
                  </label>
                  <input
                    value={billingContact}
                    onChange={(e) => setBillingContact(e.target.value)}
                    placeholder="财务结款联系人姓名"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    结款人电话
                  </label>
                  <input
                    value={billingPhone}
                    onChange={(e) => setBillingPhone(e.target.value)}
                    placeholder="财务结款人电话"
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
                  {loading ? "保存中..." : "保存门店档案"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
