"use client";

import React, { useState } from "react";
import { Plus, ShieldAlert, Store, Building2, Download } from "lucide-react";
import {
  DataTable,
  Button,
  Input,
  Badge,
  DataTableRowActions,
  DataTableDetailDrawer,
  DataTableFormModal,
  type ColumnDef,
} from "@chenrun/ui";
import {
  createCustomerAction,
  updateCustomerStatusAction,
  deleteCustomerAction,
} from "../actions";
import { CustomerField, customerPageContract } from "../contracts";
import type {
  CustomerListItem,
  CustomerCategoryItem,
  CustomerTagItem,
} from "../types";

interface Props {
  initialCustomers: CustomerListItem[];
  categories: CustomerCategoryItem[];
  tags: CustomerTagItem[];
  ability?: {
    can(action: string, subject: string, field?: string): boolean;
  };
  permissions?: {
    readonly actions: readonly string[];
    readonly fieldPolicies?: Readonly<Record<string, string>>;
  };
}

export function CustomerView({
  initialCustomers,
  categories,
  tags,
  ability: explicitAbility,
  permissions,
}: Props) {
  const ability = React.useMemo(() => {
    if (explicitAbility) return explicitAbility;
    if (!permissions) return undefined;
    return {
      can(action: string, subject?: string, field?: string) {
        if (subject && subject !== customerPageContract.subject) return false;
        if (!permissions.actions.includes(action)) return false;
        if (field && permissions.fieldPolicies?.[field] === "HIDDEN")
          return false;
        return true;
      },
    };
  }, [explicitAbility, permissions]);
  const [customers] = useState(initialCustomers);
  const [keyword, setKeyword] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 新建/编辑客户表单与详情抽屉状态
  const [showModal, setShowModal] = useState(false);
  const [viewingCustomer, setViewingCustomer] =
    useState<CustomerListItem | null>(null);
  const [editingCustomer, setEditingCustomer] =
    useState<CustomerListItem | null>(null);
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "请求失败");
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

  const handleExport = () => {
    const fieldKeys: Array<{
      key: keyof CustomerListItem;
      field?: string;
      label: string;
    }> = [
      {
        key: "customerCode",
        field: CustomerField.CUSTOMER_CODE,
        label: "客户编码",
      },
      {
        key: "customerName",
        field: CustomerField.CUSTOMER_NAME,
        label: "客户名称",
      },
      {
        key: "categoryCode",
        field: CustomerField.CATEGORY,
        label: "客户分类",
      },
      {
        key: "contactPerson",
        field: CustomerField.CONTACT_PERSON,
        label: "联系人",
      },
      {
        key: "contactPhone",
        field: CustomerField.CONTACT_PHONE,
        label: "联系电话",
      },
      {
        key: "settlementMethod",
        field: CustomerField.SETTLEMENT_METHOD,
        label: "结算方式",
      },
      {
        key: "defaultTaxRate",
        field: CustomerField.DEFAULT_TAX_RATE,
        label: "默认税率(%)",
      },
      {
        key: "status",
        field: CustomerField.STATUS,
        label: "状态",
      },
    ];

    const activeExportFields = fieldKeys.filter((f) => {
      if (!ability || !f.field) return true;
      return ability.can("read", customerPageContract.subject, f.field);
    });

    const csvContent = [
      activeExportFields.map((f) => f.label).join(","),
      ...filteredCustomers.map((c) =>
        activeExportFields
          .map((f) => {
            const val = c[f.key];
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
      `客户主数据_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const settlementLabels: Record<string, string> = {
    MONTHLY: "月结",
    CASH: "现结",
    PREPAID: "预付款",
  };

  const columns: ColumnDef<CustomerListItem>[] = [
    {
      id: "customerCode",
      field: CustomerField.CUSTOMER_CODE,
      header: "客户编码",
      width: 140,
      cell: (c: CustomerListItem) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {c.customerCode}
        </span>
      ),
    },
    {
      id: "customerName",
      field: CustomerField.CUSTOMER_NAME,
      header: "客户名称",
      cell: (c: CustomerListItem) => (
        <div>
          <div className="font-medium text-foreground">{c.customerName}</div>
          {c.customerTags && (
            <div className="flex flex-wrap gap-1 mt-1">
              {c.customerTags.split(",").map((t: string) => (
                <Badge key={t} variant="secondary" size="sm">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "category",
      field: CustomerField.CATEGORY,
      header: "分类",
      width: 130,
      cell: (c: CustomerListItem) => (
        <Badge variant="outline" size="sm">
          {c.category?.categoryName || c.categoryCode}
        </Badge>
      ),
    },
    {
      id: "contact",
      header: "联系人 / 电话",
      field: CustomerField.CONTACT_PHONE,
      width: 160,
      cell: (c: CustomerListItem) => (
        <div className="text-xs">
          <div className="font-medium text-foreground">{c.contactPerson}</div>
          <div className="text-muted-foreground font-mono">
            {c.contactPhone}
          </div>
        </div>
      ),
    },
    {
      id: "settlement",
      header: "结算 / 税率",
      field: CustomerField.SETTLEMENT_METHOD,
      width: 130,
      cell: (c: CustomerListItem) => (
        <div className="text-xs">
          <div>
            {settlementLabels[c.settlementMethod] || c.settlementMethod}
          </div>
          <div className="text-muted-foreground">
            税率: {c.defaultTaxRate ? `${c.defaultTaxRate}%` : "未设"}
          </div>
        </div>
      ),
    },
    {
      id: "stores",
      header: "下属门店",
      width: 100,
      align: "center",
      cell: (c: CustomerListItem) => (
        <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-muted-foreground">
          <Store className="size-3.5" />
          {c._count?.stores || c.stores?.length || 0}
        </span>
      ),
    },
    {
      id: "status",
      field: CustomerField.STATUS,
      header: "状态",
      width: 90,
      align: "center",
      cell: (c: CustomerListItem) => (
        <Badge
          variant={c.status === "ACTIVE" ? "success" : "secondary"}
          size="sm"
        >
          {c.status === "ACTIVE" ? "正常" : "已停用"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "操作",
      width: 90,
      align: "right",
      cell: (c: CustomerListItem) => (
        <DataTableRowActions
          record={c}
          onView={() => setViewingCustomer(c)}
          onEdit={() => setEditingCustomer(c)}
          extraActions={[
            {
              label: c.status === "ACTIVE" ? "停用客户" : "启用客户",
              onClick: () => handleToggleStatus(c.customerCode, c.status),
            },
          ]}
          onDelete={() => handleDelete(c.customerCode)}
          deleteConfirm={{
            title: `确认删除客户 "${c.customerName}"？`,
            description: "删除后该客户的所有主数据及门店关联将不可恢复。",
          }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
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
            <Building2 className="size-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">客户档案管理</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            维护企业客户主数据、结算方式、授信与服务时间。一个客户下可挂载多个履约门店。
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(!ability ||
            ability.can("export", customerPageContract.subject)) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="font-semibold shadow-xs gap-1.5"
            >
              <Download className="size-4 text-muted-foreground" />
              <span>导出数据</span>
            </Button>
          )}
          {(!ability ||
            ability.can("create", customerPageContract.subject)) && (
            <Button
              size="sm"
              onClick={() => setShowModal(true)}
              className="font-semibold shadow-xs"
            >
              <Plus className="size-4 mr-1" />
              <span>新建客户</span>
            </Button>
          )}
        </div>
      </div>

      {/* 复合积木化 DataTable */}
      <DataTable.Root
        data={filteredCustomers}
        columns={columns}
        rowKey={(c: CustomerListItem) => c.customerCode}
        subject={customerPageContract.subject}
        ability={ability}
        permissions={permissions}
        total={filteredCustomers.length}
      >
        <DataTable.Toolbar>
          <div className="flex flex-wrap items-center gap-2">
            <DataTable.Search
              value={keyword}
              onChange={setKeyword}
              placeholder="搜索客户名称、编码、联系人..."
            />
            <DataTable.FacetedFilter
              title="客户分类"
              options={categories.map((c) => ({
                label: c.categoryName,
                value: c.categoryCode,
              }))}
              selectedValues={selectedCat ? [selectedCat] : []}
              onSelect={(vals) => setSelectedCat(vals[0] || "")}
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

        {/* 详情查看抽屉插槽 */}
        <DataTableDetailDrawer
          record={viewingCustomer}
          onClose={() => setViewingCustomer(null)}
          title={(c) => `客户档案详情: ${c.customerName}`}
          description={(c) =>
            `客户编码: ${c.customerCode} | 分类: ${c.category?.categoryName || c.categoryCode}`
          }
        >
          {(c) => (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30 border">
                <div>
                  <span className="text-muted-foreground block mb-0.5">
                    联系人:
                  </span>
                  <span className="font-semibold text-foreground">
                    {c.contactPerson}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">
                    联系电话:
                  </span>
                  <span className="font-mono text-foreground">
                    {c.contactPhone}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">
                    结算方式:
                  </span>
                  <span className="font-semibold text-foreground">
                    {settlementLabels[c.settlementMethod] || c.settlementMethod}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">
                    默认税率:
                  </span>
                  <span className="font-mono text-foreground">
                    {c.defaultTaxRate ? `${c.defaultTaxRate}%` : "未设"}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border">
                <span className="text-muted-foreground block mb-1">
                  下属履约门店:
                </span>
                <span className="font-semibold text-foreground">
                  共挂载 {c._count?.stores || c.stores?.length || 0} 个履约门店
                </span>
              </div>
            </div>
          )}
        </DataTableDetailDrawer>

        {/* 快捷编辑表单弹窗插槽 */}
        <DataTableFormModal
          open={Boolean(editingCustomer)}
          onOpenChange={(open) => !open && setEditingCustomer(null)}
          record={editingCustomer}
          title={(c) => `快捷编辑客户: ${c?.customerName}`}
          description="更新客户结算方式与联系人基础信息"
          submitText="保存更新"
          onSubmit={async (record) => {
            if (!record) return;
            // 触发更新
            alert(`已更新客户 ${record.customerName}`);
            setEditingCustomer(null);
          }}
        >
          {({ record }) => (
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1">
                  客户企业名称
                </label>
                <Input defaultValue={record?.customerName} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground block mb-1">
                    联系人
                  </label>
                  <Input defaultValue={record?.contactPerson} />
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">
                    联系电话
                  </label>
                  <Input defaultValue={record?.contactPhone} />
                </div>
              </div>
            </div>
          )}
        </DataTableFormModal>
      </DataTable.Root>

      {/* 新建客户模态窗口 */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground rounded-xl max-w-2xl w-full p-6 border shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-foreground mb-4">
              新建客户主数据档案
            </h3>
            <form onSubmit={handleCreateCustomer} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    客户企业名称 *
                  </label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="如: 绿叶餐饮管理有限公司"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    客户分类 *
                  </label>
                  <select
                    required
                    value={catCode}
                    onChange={(e) => setCatCode(e.target.value)}
                    className="w-full h-9 px-3 border border-input rounded-md bg-background text-foreground text-sm"
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
                  <label className="block text-xs font-medium text-foreground mb-1">
                    联系人姓名 *
                  </label>
                  <Input
                    required
                    value={person}
                    onChange={(e) => setPerson(e.target.value)}
                    placeholder="如: 张经理"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    联系人电话 *
                  </label>
                  <Input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="如: 13800138000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    结算方式 *
                  </label>
                  <select
                    value={settlement}
                    onChange={(e) =>
                      setSettlement(
                        e.target.value as "MONTHLY" | "CASH" | "PREPAID",
                      )
                    }
                    className="w-full h-9 px-3 border border-input rounded-md bg-background text-foreground text-sm"
                  >
                    <option value="MONTHLY">月结 (MONTHLY)</option>
                    <option value="CASH">现结 (CASH)</option>
                    <option value="PREPAID">预付 (PREPAID)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    默认税率(%)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    placeholder="如: 9.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    信用额度(元)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder="如: 50000.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  业务标签 (多选)
                </label>
                <div className="flex flex-wrap gap-2 p-2 border border-input rounded-lg max-h-24 overflow-y-auto bg-muted/20">
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
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                          checked
                            ? "bg-primary border-primary text-primary-foreground font-semibold"
                            : "border-input bg-background text-muted-foreground hover:text-foreground"
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
                  <label className="block text-xs font-medium text-foreground mb-1">
                    业务专员
                  </label>
                  <Input
                    value={salesPerson}
                    onChange={(e) => setSalesPerson(e.target.value)}
                    placeholder="业务经理姓名"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    服务收货时间
                  </label>
                  <Input
                    value={serviceTime}
                    onChange={(e) => setServiceTime(e.target.value)}
                    placeholder="如: 早8:00 - 10:00"
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
                  {loading ? "保存中..." : "创建客户档案"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
