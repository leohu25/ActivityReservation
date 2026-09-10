"use client";

import React, { useState } from "react";
import { Plus, ShieldAlert, Building2, Store, Download } from "lucide-react";
import {
  DataTable,
  Button,
  Input,
  Badge,
  DataTableRowActions,
  type ColumnDef,
} from "@chenrun/ui";
import {
  createStoreAction,
  updateStoreStatusAction,
  deleteStoreAction,
} from "../actions";
import { CustomerStoreField, storePageContract } from "../contracts";
import type { StoreListItem, CustomerListItem } from "../types";

/**
 * 门店档案列表页面入参属性契约
 */
interface Props {
  /** 初始门店列表数据集 */
  initialStores: StoreListItem[];
  /** 可选客户关联字典列表 */
  customers: CustomerListItem[];
  ability?: {
    can(action: string, subject: string, field?: string): boolean;
  };
  permissions?: {
    readonly actions: readonly string[];
    readonly fieldPolicies?: Readonly<Record<string, string>>;
  };
}

/**
 * 客户中心 - 门店档案管理工作台
 * 遵循现代数智工业风规范，全面接入 BusinessTableWorkspace 标准表格体系
 */
export function StoreView({
  initialStores,
  customers,
  ability: explicitAbility,
  permissions,
}: Props) {
  const ability = React.useMemo(() => {
    if (explicitAbility) return explicitAbility;
    if (!permissions) return undefined;
    return {
      can(action: string, subject?: string, field?: string) {
        if (subject && subject !== storePageContract.subject) return false;
        if (!permissions.actions.includes(action)) return false;
        if (field && permissions.fieldPolicies?.[field] === "HIDDEN")
          return false;
        return true;
      },
    };
  }, [explicitAbility, permissions]);
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

  const handleExport = () => {
    const fieldKeys: Array<{
      key: keyof StoreListItem;
      field?: string;
      label: string;
    }> = [
      {
        key: "storeCode",
        field: CustomerStoreField.STORE_CODE,
        label: "门店编码",
      },
      {
        key: "storeName",
        field: CustomerStoreField.STORE_NAME,
        label: "门店名称",
      },
      {
        key: "customerCode",
        field: CustomerStoreField.CUSTOMER_CODE,
        label: "所属客户编码",
      },
      {
        key: "regionCode",
        field: CustomerStoreField.REGION_CODE,
        label: "所属区域",
      },
      {
        key: "deliveryPeriod",
        field: CustomerStoreField.DELIVERY_PERIOD,
        label: "配送时段",
      },
      {
        key: "address",
        field: CustomerStoreField.ADDRESS,
        label: "配送收货地址",
      },
      {
        key: "contactPerson",
        field: CustomerStoreField.CONTACT_PERSON,
        label: "联系人",
      },
      {
        key: "contactPhone",
        field: CustomerStoreField.CONTACT_PHONE,
        label: "联系电话",
      },
      {
        key: "status",
        field: CustomerStoreField.STATUS,
        label: "门店状态",
      },
    ];

    const activeExportFields = fieldKeys.filter((f) => {
      if (!ability || !f.field) return true;
      return ability.can("read", storePageContract.subject, f.field);
    });

    const csvContent = [
      activeExportFields.map((f) => f.label).join(","),
      ...filteredStores.map((s) =>
        activeExportFields
          .map((f) => {
            const val = s[f.key];
            if (val === null || val === undefined) return "";
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `门店档案_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
  const columns: ColumnDef<StoreListItem>[] = [
    {
      id: "storeCode",
      field: CustomerStoreField.STORE_CODE,
      header: "门店编码",
      width: 140,
      cell: (s: StoreListItem) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {s.storeCode}
        </span>
      ),
    },
    {
      id: "storeName",
      field: CustomerStoreField.STORE_NAME,
      header: "门店名称",
      cell: (s: StoreListItem) => (
        <div className="font-medium text-foreground">{s.storeName}</div>
      ),
    },
    {
      id: "customer",
      field: CustomerStoreField.CUSTOMER_CODE,
      header: "所属客户",
      width: 170,
      cell: (s: StoreListItem) => (
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
      field: CustomerStoreField.REGION_CODE,
      header: "区域 / 配送时段",
      width: 180,
      cell: (s: StoreListItem) => (
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
      field: CustomerStoreField.ADDRESS,
      header: "配送收货地址",
      cell: (s: StoreListItem) => (
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
      field: CustomerStoreField.CONTACT_PHONE,
      header: "门店联系人",
      width: 150,
      cell: (s: StoreListItem) => (
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
      field: CustomerStoreField.STATUS,
      header: "状态",
      width: 90,
      align: "center",
      cell: (s: StoreListItem) => (
        <Badge
          variant={s.status === "ACTIVE" ? "success" : "secondary"}
          size="sm"
        >
          {s.status === "ACTIVE" ? "正常" : "已停用"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "操作",
      width: 80,
      align: "right",
      cell: (s: StoreListItem) => (
        <DataTableRowActions
          record={s}
          extraActions={[
            {
              label: s.status === "ACTIVE" ? "停用门店" : "启用门店",
              onClick: () => handleToggleStatus(s.storeCode, s.status),
            },
          ]}
          onDelete={() => handleDelete(s.storeCode)}
          deleteConfirm={{
            title: `确认删除门店 "${s.storeName}"？`,
            description: "删除后该履约门店的信息将无法恢复。",
          }}
        />
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

      {/* 头部标题与新建按钮 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <Store className="size-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">门店档案管理</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            门店是订单订货、物流配送、现场签收与对账的最小履约单元，必须归属于有效客户并绑定区域。
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(!ability || ability.can("export", storePageContract.subject)) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="font-semibold shadow-xs gap-1.5"
            >
              <Download className="size-4 text-muted-foreground" />
              <span>导出门店</span>
            </Button>
          )}
          {(!ability || ability.can("create", storePageContract.subject)) && (
            <Button
              size="sm"
              onClick={() => setShowModal(true)}
              className="font-semibold shadow-xs"
            >
              <Plus className="size-4 mr-1" />
              <span>新建门店</span>
            </Button>
          )}
        </div>
      </div>

      {/* 复合积木化 DataTable */}
      <DataTable.Root
        data={filteredStores}
        columns={columns}
        rowKey={(s: StoreListItem) => s.storeCode}
        subject={storePageContract.subject}
        ability={ability}
        total={filteredStores.length}
      >
        <DataTable.Toolbar>
          <div className="flex flex-wrap items-center gap-2">
            <DataTable.Search
              value={keyword}
              onChange={setKeyword}
              placeholder="搜索门店名称、编码、收货地址..."
            />
            <DataTable.FacetedFilter
              title="所属客户"
              options={customers.map((c) => ({
                label: c.customerName,
                value: c.customerCode,
              }))}
              selectedValues={selectedCust ? [selectedCust] : []}
              onSelect={(vals) => setSelectedCust(vals[0] || "")}
              multiple={false}
            />
            <DataTable.FacetedFilter
              title="状态"
              options={[
                { label: "正常", value: "ACTIVE" },
                { label: "已停用", value: "DISABLED" },
              ]}
              selectedValues={selectedStatus ? [selectedStatus] : []}
              onSelect={(vals) => setSelectedStatus(vals[0] || "")}
              multiple={false}
            />
          </div>
        </DataTable.Toolbar>

        <DataTable.Content />
        <DataTable.Pagination />
      </DataTable.Root>

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
