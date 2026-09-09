"use client";

import React, { useState } from "react";
import { Plus, Search, ShieldAlert, Building2 } from "lucide-react";
import {
  BusinessTableWorkspace,
  Button,
  Input,
  Badge,
  type BusinessTableColumn,
} from "@chenrun/ui";
import {
  createStoreAction,
  updateStoreStatusAction,
  deleteStoreAction,
} from "../actions";
import { CustomerStoreSubject } from "../permissions";
import type { StoreListItem, CustomerListItem } from "../types";

/**
 * 门店档案列表页面入参属性契约
 */
interface Props {
  /** 初始门店列表数据集 */
  initialStores: StoreListItem[];
  /** 可选客户关联字典列表 */
  customers: CustomerListItem[];
}

/**
 * 客户中心 - 门店档案管理工作台
 * 遵循现代数智工业风规范，全面接入 BusinessTableWorkspace 标准表格体系
 */
export function StoreView({ initialStores, customers }: Props) {
  const [stores] = useState<StoreListItem[]>(initialStores);
  const [keyword, setKeyword] = useState("");
  const [selectedCust, setSelectedCust] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 新建门店模态框表单状态
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

  /**
   * 客户端组合多条件实时筛选
   */
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

  /**
   * 提交新建门店主数据
   */
  const handleCreateStore = async (e: React.FormEvent<HTMLFormElement>) => {
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "请求异常");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 切换门店启用/停用状态
   */
  const handleToggleStatus = async (
    storeCode: string,
    currentStatus: "ACTIVE" | "DISABLED" | string,
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

  /**
   * 删除指定门店
   */
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

  // 配送时段语义化字典映射
  const deliveryPeriodLabels: Record<string, string> = {
    MORNING: "早间配送 (05:00-08:00)",
    NOON: "午间配送 (10:00-12:00)",
    EVENING: "傍晚配送 (15:00-18:00)",
  };

  /**
   * 标准表格列定义（强类型化，无 any 逃逸）
   */
  const columns: BusinessTableColumn<StoreListItem>[] = [
    {
      id: "storeCode",
      header: "门店编码",
      width: 140,
      cell: (s) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {s.storeCode}
        </span>
      ),
    },
    {
      id: "storeName",
      header: "门店名称",
      cell: (s) => (
        <div className="font-medium text-foreground">{s.storeName}</div>
      ),
    },
    {
      id: "customer",
      header: "所属客户",
      width: 170,
      cell: (s) => (
        <div className="flex items-center gap-1.5 text-xs text-foreground">
          <Building2 className="size-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">
            {s.customer?.customerName || s.customerCode}
          </span>
        </div>
      ),
    },
    {
      id: "regionDelivery",
      header: "区域 / 配送时段",
      width: 180,
      cell: (s) => (
        <div className="text-xs">
          <div className="font-mono text-muted-foreground">{s.regionCode}</div>
          <div className="text-foreground mt-0.5">
            {s.deliveryPeriod
              ? deliveryPeriodLabels[s.deliveryPeriod] || s.deliveryPeriod
              : "默认时段"}
          </div>
        </div>
      ),
    },
    {
      id: "address",
      header: "配送收货地址",
      cell: (s) => (
        <div
          className="text-xs text-muted-foreground max-w-xs truncate"
          title={s.address}
        >
          {s.address}
        </div>
      ),
    },
    {
      id: "contact",
      header: "门店联系人",
      width: 150,
      cell: (s) => (
        <div className="text-xs">
          <div className="font-medium text-foreground">{s.contactPerson}</div>
          <div className="text-muted-foreground font-mono">
            {s.contactPhone}
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: "状态",
      width: 90,
      align: "center",
      cell: (s) => (
        <Badge
          variant={s.status === "ACTIVE" ? "success" : "secondary"}
          size="sm"
        >
          {s.status === "ACTIVE" ? "正常" : "已停用"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* 错误提示浮层 */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2 text-destructive text-sm">
          <ShieldAlert className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 企业级标准表格工作台 */}
      <BusinessTableWorkspace<StoreListItem>
        subject={CustomerStoreSubject}
        title="门店档案管理"
        description="门店是订单订货、物流配送、现场签收与对账的最小履约单元，必须归属于有效客户并绑定区域。"
        extraHeader={
          <Button
            size="sm"
            onClick={() => setShowModal(true)}
            className="font-semibold shadow-xs"
          >
            <Plus className="size-4 mr-1" />
            <span>新建门店</span>
          </Button>
        }
        searchFilters={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索门店名称、编码、收货地址..."
                className="h-8 w-64 pl-8 text-xs"
              />
            </div>
            <select
              value={selectedCust}
              onChange={(e) => setSelectedCust(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
              className="h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">全部状态</option>
              <option value="ACTIVE">正常</option>
              <option value="DISABLED">已停用</option>
            </select>
          </div>
        }
        onReset={() => {
          setKeyword("");
          setSelectedCust("");
          setSelectedStatus("");
        }}
        data={filteredStores}
        columns={columns}
        rowKey={(s) => s.storeCode}
        selectable={false}
        rowActionsHeader="操作"
        rowActions={(s) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={() => handleToggleStatus(s.storeCode, s.status)}
              className="h-7 px-2 text-xs"
            >
              {s.status === "ACTIVE" ? "停用" : "启用"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={() => handleDelete(s.storeCode)}
              className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              删除
            </Button>
          </div>
        )}
      />

      {/* 新建门店模态框 */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground rounded-xl max-w-2xl w-full p-6 border shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-foreground mb-4">
              新建履约门店档案
            </h3>
            <form onSubmit={handleCreateStore} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    所属客户企业 *
                  </label>
                  <select
                    required
                    value={customerCode}
                    onChange={(e) => setCustomerCode(e.target.value)}
                    className="w-full h-9 px-3 border border-input rounded-md bg-background text-foreground text-sm"
                  >
                    {customers.map((c) => (
                      <option key={c.customerCode} value={c.customerCode}>
                        {c.customerName} ({c.customerCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    门店名称 *
                  </label>
                  <Input
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="如: 绿叶餐饮(西湖银泰店)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  配送收货详细地址 *
                </label>
                <Input
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="如: 杭州市上城区延安路98号B1层后厨收货通道"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    门店现场联系人 *
                  </label>
                  <Input
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="如: 李厨师长"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    联系人联系电话 *
                  </label>
                  <Input
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="如: 13912345678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    配送所属网格/区域 *
                  </label>
                  <select
                    value={regionCode}
                    onChange={(e) => setRegionCode(e.target.value)}
                    className="w-full h-9 px-3 border border-input rounded-md bg-background text-foreground text-sm"
                  >
                    <option value="REGION_BJ_01">华北北京核心城区网格</option>
                    <option value="REGION_HD_01">华东杭州生鲜直配网格</option>
                    <option value="REGION_DEFAULT">通用默认配送网格</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    首选配送时段 *
                  </label>
                  <select
                    value={deliveryPeriod}
                    onChange={(e) => setDeliveryPeriod(e.target.value)}
                    className="w-full h-9 px-3 border border-input rounded-md bg-background text-foreground text-sm"
                  >
                    <option value="MORNING">早间配送 (05:00-08:00)</option>
                    <option value="NOON">午间配送 (10:00-12:00)</option>
                    <option value="EVENING">傍晚配送 (15:00-18:00)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    财务对账对接人
                  </label>
                  <Input
                    value={billingContact}
                    onChange={(e) => setBillingContact(e.target.value)}
                    placeholder="对账会计姓名(选填)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    财务对接电话
                  </label>
                  <Input
                    value={billingPhone}
                    onChange={(e) => setBillingPhone(e.target.value)}
                    placeholder="对账联系电话(选填)"
                  />
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
                  {loading ? "保存中..." : "创建门店档案"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
