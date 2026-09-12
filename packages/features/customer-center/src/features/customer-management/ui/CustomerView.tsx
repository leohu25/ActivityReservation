"use client";

import React, { useState, useEffect } from "react";
import { Store } from "lucide-react";
import {
  DataTable,
  Badge,
  DataTableRowActions,
  FormDrawer,
  FormDialog,
  Field,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
  useListUrlNav,
  type ColumnDef,
} from "@chenrun/ui";
import { exportContractCsv } from "@chenrun/shared";
import { useAbility } from "@chenrun/authorization";
import {
  createCustomerAction,
  updateCustomerAction,
  updateCustomerStatusAction,
  deleteCustomerAction,
} from "../actions";
import { CustomerField, customerPageContract } from "../contract";
import type {
  CustomerListItem,
  CustomerCategoryItem,
  CustomerTagItem,
} from "../types";
import { CreateCustomerModal } from "./CreateCustomerModal";

interface Props {
  initialCustomers: CustomerListItem[];
  /** 服务端总条数（分页必传） */
  initialTotal?: number;
  initialPage?: number;
  initialPageSize?: number;
  initialKeyword?: string;
  initialCategory?: string;
  initialStatus?: string;
  categories: CustomerCategoryItem[];
  tags: CustomerTagItem[];
}

const SETTLEMENT_LABELS: Record<string, string> = {
  MONTHLY: "月结",
  CASH: "现结",
  PREPAID: "预付款",
};

export function CustomerView({
  initialCustomers,
  initialTotal,
  initialPage = 1,
  initialPageSize = 10,
  initialKeyword = "",
  initialCategory = "",
  initialStatus = "",
  categories,
  tags,
}: Props) {
  // 官方范式：Ability 一律来自上层 AbilityProvider（customer layout）
  const ability = useAbility();
  const { navigateList, router } = useListUrlNav();
  const [customers, setCustomers] = useState(initialCustomers);
  const [total, setTotal] = useState(initialTotal ?? initialCustomers.length);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setCustomers(initialCustomers);
    setTotal(initialTotal ?? initialCustomers.length);
    setPage(initialPage);
    setPageSize(initialPageSize);
  }, [initialCustomers, initialTotal, initialPage, initialPageSize]);

  const [keyword, setKeyword] = useState(initialKeyword);
  const [selectedCat, setSelectedCat] = useState(initialCategory);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewingCustomer, setViewingCustomer] =
    useState<CustomerListItem | null>(null);
  const [editingCustomer, setEditingCustomer] =
    useState<CustomerListItem | null>(null);

  const handleToggleStatus = async (
    customerCode: string,
    currentStatus: string,
  ) => {
    setLoading(true);
    const nextStatus = currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      const res = await updateCustomerStatusAction(customerCode, nextStatus);
      if (res.success) {
        setCustomers((prev) =>
          prev.map((item) =>
            item.customerCode === customerCode
              ? { ...item, status: nextStatus }
              : item,
          ),
        );
        toast.success(nextStatus === "ACTIVE" ? "客户已启用" : "客户已停用");
        router?.refresh();
      } else {
        toast.error(res.error || "更新状态失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "更新状态异常");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerCode: string) => {
    setLoading(true);
    try {
      const res = await deleteCustomerAction(customerCode);
      if (res.success) {
        setCustomers((prev) =>
          prev.filter((item) => item.customerCode !== customerCode),
        );
        toast.success("客户已成功删除");
        router?.refresh();
      } else {
        toast.error(res.error || "删除客户失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "删除操作异常");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    exportContractCsv(
      customers,
      customerPageContract.configurableFields ?? [],
      {
        subject: customerPageContract.subject,
        ability,
        skip: [CustomerField.CREDIT_LIMIT],
        filename: `客户主数据_${new Date().toISOString().slice(0, 10)}.csv`,
        format: {
          [CustomerField.SETTLEMENT_METHOD]: (c) =>
            SETTLEMENT_LABELS[c.settlementMethod] || c.settlementMethod,
          [CustomerField.STATUS]: (c) =>
            c.status === "ACTIVE" ? "正常" : "已停用",
        },
      },
    );
  };

  const columns: ColumnDef<CustomerListItem>[] = [
    {
      id: "customerCode",
      field: CustomerField.CUSTOMER_CODE,
      header: "客户编码",
      width: 150,
      lockVisible: true,
      cell: (c: CustomerListItem) => (
        <span className="font-mono text-xs font-bold text-primary">
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
            {SETTLEMENT_LABELS[c.settlementMethod] || c.settlementMethod}
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
          {c._count?.stores || 0}
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
              action: "toggle_status",
              variant: c.status === "ACTIVE" ? "destructive" : "default",
              onClick: () =>
                handleToggleStatus(c.customerCode || c.id || "", c.status),
              confirm:
                c.status === "ACTIVE"
                  ? {
                      title: `确认停用客户 "${c.customerName}"？`,
                      description:
                        "警告：停用该客户将导致其名下所有关联门店强制同步停用！",
                      confirmText: "确认停用",
                      cancelText: "取消",
                    }
                  : undefined,
            },
          ]}
          onDelete={() => handleDelete(c.customerCode || c.id || "")}
          deleteConfirm={{
            title: `确认删除客户 "${c.customerName}"？`,
            description: "删除后该客户的所有主数据及门店关联将不可恢复。",
          }}
        />
      ),
    },
  ];

  return (
    <>
      <DataTable.Workspace
        data={customers}
        columns={columns}
        rowKey={(c: CustomerListItem) => c.id || c.customerCode}
        subject={customerPageContract.subject}
        title="客户档案"
        description="维护企业客户主数据、结算方式、授信与服务时间。一个客户下可挂载多个履约门店。"
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
        onCreate={() => setShowModal(true)}
        contentProps={{ selectable: true }}
        keywordValue={keyword}
        keywordPlaceholder="单号 / 名称 / 联系人"
        onKeywordChange={setKeyword}
        statusOptions={[
          { value: "ACTIVE", label: "正常" },
          { value: "DISABLED", label: "已停用" },
        ]}
        statusValue={selectedStatus}
        onStatusChange={(v) => {
          setSelectedStatus(v);
          setPage(1);
          navigateList({ page: 1, status: v });
        }}
        filterExtra={
          <DataTable.InputGroup label="客户分类" className="w-48">
            <Select
              value={selectedCat || "ALL"}
              onValueChange={(next) => {
                const value = next === "ALL" ? "" : next;
                setSelectedCat(value);
                setPage(1);
                navigateList({ page: 1, category: value });
              }}
            >
              <SelectTrigger className="h-10 border-0 bg-transparent shadow-none focus:ring-0">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ALL">全部</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.categoryCode} value={c.categoryCode}>
                      {c.categoryName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </DataTable.InputGroup>
        }
        onSearch={() => {
          setPage(1);
          navigateList({ page: 1 });
        }}
        onReset={() => {
          setKeyword("");
          setSelectedCat("");
          setSelectedStatus("");
          setPage(1);
          navigateList({ page: 1, keyword: "", category: "", status: "" });
        }}
        onAdvancedFilter={() => {
          toast.info("高级筛选面板可按业务扩展");
        }}
      >
        <FormDrawer
          open={Boolean(viewingCustomer)}
          onOpenChange={(open) => !open && setViewingCustomer(null)}
          title={
            viewingCustomer
              ? `客户档案详情: ${viewingCustomer.customerName}`
              : "客户详情"
          }
          description={
            viewingCustomer
              ? `分类: ${viewingCustomer.category?.categoryName || viewingCustomer.categoryCode} | 结算: ${
                  SETTLEMENT_LABELS[viewingCustomer.settlementMethod] ||
                  viewingCustomer.settlementMethod
                }`
              : undefined
          }
        >
          {viewingCustomer ? (
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex flex-col gap-2 rounded-lg border p-3 bg-muted/20">
                <div className="text-xs font-semibold text-muted-foreground uppercase">
                  基础信息
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      联系人：
                    </span>
                    <span className="font-medium">
                      {viewingCustomer.contactPerson}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      联系电话：
                    </span>
                    <span className="font-mono">
                      {viewingCustomer.contactPhone}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      结算方式：
                    </span>
                    <span>
                      {SETTLEMENT_LABELS[viewingCustomer.settlementMethod] ||
                        viewingCustomer.settlementMethod}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      默认税率：
                    </span>
                    <span className="font-mono">
                      {viewingCustomer.defaultTaxRate
                        ? `${viewingCustomer.defaultTaxRate}%`
                        : "未设"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 rounded-lg border p-3 bg-muted/20">
                <div className="text-xs font-semibold text-muted-foreground uppercase">
                  下属履约门店
                </div>
                <div className="text-sm font-medium text-foreground">
                  共挂载 {viewingCustomer._count?.stores || 0} 个履约门店
                </div>
              </div>
            </div>
          ) : null}
        </FormDrawer>

        <FormDialog
          open={Boolean(editingCustomer)}
          onOpenChange={(open) => !open && setEditingCustomer(null)}
          record={editingCustomer}
          title={
            editingCustomer
              ? `快捷编辑客户: ${editingCustomer.customerName}`
              : "编辑客户"
          }
          description="更新客户结算方式与联系人基础信息"
          submitText="保存更新"
          onSubmit={async (record) => {
            if (!record) return;
            const targetCode = record.customerCode || record.id;
            if (!targetCode) return;
            setLoading(true);
            try {
              const res = await updateCustomerAction(targetCode, {
                customerName: record.customerName,
                contactPerson: record.contactPerson,
                contactPhone: record.contactPhone,
              });
              if (res.success) {
                setCustomers((prev) =>
                  prev.map((item) =>
                    (item.customerCode || item.id) === targetCode
                      ? {
                          ...item,
                          customerName: record.customerName || item.customerName,
                          contactPerson: record.contactPerson || item.contactPerson,
                          contactPhone: record.contactPhone || item.contactPhone,
                        }
                      : item,
                  ),
                );
                toast.success("客户资料已更新");
                setEditingCustomer(null);
                router?.refresh();
              } else {
                toast.error(res.error || "更新客户失败");
              }
            } catch (err: unknown) {
              toast.error(err instanceof Error ? err.message : "更新客户异常");
            } finally {
              setLoading(false);
            }
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="customer-name">客户企业名称</FieldLabel>
              <Input
                id="customer-name"
                defaultValue={editingCustomer?.customerName}
                onChange={(e) => {
                  if (editingCustomer) {
                    setEditingCustomer({
                      ...editingCustomer,
                      customerName: e.target.value,
                    });
                  }
                }}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="contact-person">联系人</FieldLabel>
                <Input
                  id="contact-person"
                  defaultValue={editingCustomer?.contactPerson}
                  onChange={(e) => {
                    if (editingCustomer) {
                      setEditingCustomer({
                        ...editingCustomer,
                        contactPerson: e.target.value,
                      });
                    }
                  }}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="contact-phone">联系电话</FieldLabel>
                <Input
                  id="contact-phone"
                  defaultValue={editingCustomer?.contactPhone}
                  onChange={(e) => {
                    if (editingCustomer) {
                      setEditingCustomer({
                        ...editingCustomer,
                        contactPhone: e.target.value,
                      });
                    }
                  }}
                />
              </Field>
            </div>
          </FieldGroup>
        </FormDialog>
      </DataTable.Workspace>

      {showModal && (
        <CreateCustomerModal
          categories={categories}
          tags={tags}
          onClose={() => setShowModal(false)}
          onCreated={() => router?.refresh()}
        />
      )}
    </>
  );
}
