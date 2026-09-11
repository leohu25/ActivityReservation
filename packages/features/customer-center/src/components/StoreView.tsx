"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Download, RefreshCw, Building2 } from "lucide-react";
import {
  DataTable,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  DataTableRowActions,
  toast,
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
  /** 初始门店列表数据集（服务端当前页） */
  initialStores: StoreListItem[];
  /** 服务端总条数 */
  initialTotal?: number;
  initialPage?: number;
  initialPageSize?: number;
  initialKeyword?: string;
  initialCustomer?: string;
  initialStatus?: string;
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

function useSafeRouter() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

/**
 * 客户中心 - 门店档案管理工作台
 * 遵循现代数智工业风规范，全面接入 BusinessTableWorkspace 标准表格体系
 */
export function StoreView({
  initialStores,
  initialTotal,
  initialPage = 1,
  initialPageSize = 10,
  initialKeyword = "",
  initialCustomer = "",
  initialStatus = "",
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
  const router = useSafeRouter();
  const [stores, setStores] = useState<StoreListItem[]>(initialStores);
  const [total, setTotal] = useState(initialTotal ?? initialStores.length);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setStores(initialStores);
    setTotal(initialTotal ?? initialStores.length);
    setPage(initialPage);
    setPageSize(initialPageSize);
  }, [initialStores, initialTotal, initialPage, initialPageSize]);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [selectedCust, setSelectedCust] = useState(initialCustomer);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const navigateList = React.useCallback(
    (patch: {
      page?: number;
      pageSize?: number;
      keyword?: string;
      customer?: string;
      status?: string;
    }) => {
      const next = new URLSearchParams();
      const p = patch.page ?? page;
      const ps = patch.pageSize ?? pageSize;
      const kw = patch.keyword !== undefined ? patch.keyword : keyword;
      const cust =
        patch.customer !== undefined ? patch.customer : selectedCust;
      const st = patch.status !== undefined ? patch.status : selectedStatus;
      if (p > 1) next.set("page", String(p));
      if (ps !== 10) next.set("pageSize", String(ps));
      if (kw) next.set("keyword", kw);
      if (cust) next.set("customer", cust);
      if (st) next.set("status", st);
      const qs = next.toString();
      router?.push(qs ? `?${qs}` : window.location.pathname);
    },
    [page, pageSize, keyword, selectedCust, selectedStatus, router],
  );

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
   * 服务端已过滤，客户端不再二次筛选
   */
  const filteredStores = stores;

  /**
   * 提交新建门店主数据
   */
  const handleCreateStore = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
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
        toast.success("门店创建成功");
        setShowModal(false);
        router?.refresh();
      } else {
        toast.error(res.error || "创建门店失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "请求异常");
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
    const nextStatus = currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      const res = await updateStoreStatusAction(storeCode, nextStatus);
      if (res.success) {
        setStores((prev) =>
          prev.map((item) =>
            item.storeCode === storeCode
              ? { ...item, status: nextStatus }
              : item,
          ),
        );
        toast.success(nextStatus === "ACTIVE" ? "门店已启用" : "门店已停用");
        router?.refresh();
      } else {
        toast.error(res.error || "变更门店状态失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "变更状态异常");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 删除指定门店
   */
  const handleDelete = async (storeCode: string) => {
    setLoading(true);
    try {
      const res = await deleteStoreAction(storeCode);
      if (res.success) {
        setStores((prev) =>
          prev.filter((item) => item.storeCode !== storeCode),
        );
        toast.success("门店已成功删除");
        router?.refresh();
      } else {
        toast.error(res.error || "删除失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "删除操作异常");
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

    const blob = new Blob([`\uFEFF${csvContent}`], {
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
              variant: s.status === "ACTIVE" ? "destructive" : "default",
              onClick: () => handleToggleStatus(s.storeCode, s.status),
              confirm:
                s.status === "ACTIVE"
                  ? {
                      title: `确认停用门店 "${s.storeName}"？`,
                      description: "停用后该门店将无法继续下单或关联配送调度。",
                      confirmText: "确认停用",
                      cancelText: "取消",
                    }
                  : undefined,
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
    <DataTable.Root
      data={filteredStores}
      columns={columns}
      rowKey={(s: StoreListItem) => s.storeCode}
      subject={storePageContract.subject}
      ability={ability}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={(nextPage, nextPageSize) => {
        setPage(nextPage);
        setPageSize(nextPageSize);
        navigateList({ page: nextPage, pageSize: nextPageSize });
      }}
    >
      <DataTable.Header
        category="BUSINESS WORKSPACE"
        title="门店档案"
        description="门店是订单订货、物流配送、现场签收与对账的最小履约单元，必须归属于有效客户并绑定区域。"
        actions={
          <DataTable.Toolbar>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router?.refresh()}
              className="gap-1.5 border-border bg-card shadow-xs hover:bg-muted/40"
            >
              <RefreshCw className="size-3.5 text-muted-foreground" />
              刷新
            </Button>
            {(!ability || ability.can("export", storePageContract.subject)) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="gap-1.5 border-border bg-card shadow-xs hover:bg-muted/40"
              >
                <Download className="size-3.5 text-muted-foreground" />
                导出
              </Button>
            )}
            <DataTable.ColumnSettings />
            {(!ability || ability.can("create", storePageContract.subject)) && (
              <DataTable.ActionButton
                action="create"
                size="sm"
                className="gap-1.5 shadow-xs"
                onClick={() => setShowModal(true)}
              >
                <Plus className="size-3.5" />
                新增
              </DataTable.ActionButton>
            )}
          </DataTable.Toolbar>
        }
      />

      <DataTable.FilterBar
        onSearch={() => {
          setPage(1);
          navigateList({ page: 1 });
        }}
        onReset={() => {
          setKeyword("");
          setSelectedCust("");
          setSelectedStatus("");
          setPage(1);
          navigateList({ page: 1, keyword: "", customer: "", status: "" });
        }}
      >
        <DataTable.InputGroup label="关键字" className="w-64">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                navigateList({ page: 1 });
              }
            }}
            placeholder="名称 / 编码 / 地址"
          />
        </DataTable.InputGroup>
        <DataTable.InputGroup label="所属客户" className="w-52">
          <Select
            value={selectedCust || "ALL"}
            onValueChange={(v) => {
              const next = v === "ALL" ? "" : v;
              setSelectedCust(next);
              setPage(1);
              navigateList({ page: 1, customer: next });
            }}
          >
            <SelectTrigger className="border-0 shadow-none">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.customerCode} value={c.customerCode}>
                  {c.customerName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DataTable.InputGroup>
        <DataTable.InputGroup label="状态" className="w-40">
          <Select
            value={selectedStatus || "ALL"}
            onValueChange={(v) => {
              const next = v === "ALL" ? "" : v;
              setSelectedStatus(next);
              setPage(1);
              navigateList({ page: 1, status: next });
            }}
          >
            <SelectTrigger className="border-0 shadow-none">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部</SelectItem>
              <SelectItem value="ACTIVE">正常</SelectItem>
              <SelectItem value="DISABLED">已停用</SelectItem>
            </SelectContent>
          </Select>
        </DataTable.InputGroup>
      </DataTable.FilterBar>

      <DataTable.Content selectable showIndex />
      <DataTable.Pagination />

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
    </DataTable.Root>
  );
}
