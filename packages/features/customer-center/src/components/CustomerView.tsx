"use client";

import React, { useState } from "react";
import { Plus, Search, ShieldAlert, Store } from "lucide-react";
import {
  BusinessTableWorkspace,
  Button,
  Input,
  Badge,
  type BusinessTableColumn,
} from "@chenrun/ui";
import {
  createCustomerAction,
  updateCustomerStatusAction,
  deleteCustomerAction,
} from "../actions";
import { CustomerSubject } from "../permissions";
import type {
  CustomerListItem,
  CustomerCategoryItem,
  CustomerTagItem,
} from "../types";

interface Props {
  initialCustomers: CustomerListItem[];
  categories: CustomerCategoryItem[];
  tags: CustomerTagItem[];
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

  const settlementLabels: Record<string, string> = {
    MONTHLY: "月结",
    CASH: "现结",
    PREPAID: "预付款",
  };

  const columns: BusinessTableColumn<CustomerListItem>[] = [
    {
      id: "customerCode",
      header: "客户编码",
      width: 140,
      cell: (c) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {c.customerCode}
        </span>
      ),
    },
    {
      id: "customerName",
      header: "客户名称",
      cell: (c) => (
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
      header: "分类",
      width: 130,
      cell: (c) => (
        <Badge variant="outline" size="sm">
          {c.category?.categoryName || c.categoryCode}
        </Badge>
      ),
    },
    {
      id: "contact",
      header: "联系人 / 电话",
      width: 160,
      cell: (c) => (
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
      width: 130,
      cell: (c) => (
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
      cell: (c) => (
        <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-muted-foreground">
          <Store className="size-3.5" />
          {c._count?.stores || c.stores?.length || 0}
        </span>
      ),
    },
    {
      id: "status",
      header: "状态",
      width: 90,
      align: "center",
      cell: (c) => (
        <Badge
          variant={c.status === "ACTIVE" ? "success" : "secondary"}
          size="sm"
        >
          {c.status === "ACTIVE" ? "正常" : "已停用"}
        </Badge>
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

      <BusinessTableWorkspace<CustomerListItem>
        subject={CustomerSubject}
        title="客户档案管理"
        description="维护企业客户主数据、结算方式、授信与服务时间。一个客户下可挂载多个履约门店。"
        extraHeader={
          <Button
            size="sm"
            onClick={() => setShowModal(true)}
            className="font-semibold shadow-xs"
          >
            <Plus className="size-4 mr-1" />
            <span>新建客户</span>
          </Button>
        }
        searchFilters={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索客户名称、编码、联系人..."
                className="h-8 w-64 pl-8 text-xs"
              />
            </div>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
          setSelectedCat("");
          setSelectedStatus("");
        }}
        data={filteredCustomers}
        columns={columns}
        rowKey={(c) => c.customerCode}
        selectable={false}
        rowActionsHeader="操作"
        rowActions={(c) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={() => handleToggleStatus(c.customerCode, c.status)}
              className="h-7 px-2 text-xs"
            >
              {c.status === "ACTIVE" ? "停用" : "启用"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={() => handleDelete(c.customerCode)}
              className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              删除
            </Button>
          </div>
        )}
      />

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
