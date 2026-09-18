"use client";

import React, { useState } from "react";
import { Store } from "lucide-react";
import {
  DataTable,
  DataTableInputGroup,
  Badge,
  DataTableRowActions,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useListSearch,
  toast,
  type ColumnDef,
} from "@base/ui";
import { exportContractCsv } from "@base/shared";
import { useAbility } from "@base/authorization";
import { updateCustomerStatusAction, deleteCustomerAction } from "../actions";
import {
  CustomerAction,
  CustomerField,
  customerPageContract,
  customerSearchParams,
  MasterDataStatus,
} from "../contract";
import type {
  CustomerListItem,
  CustomerCategoryItem,
  CustomerTagItem,
} from "../types";
import { CustomerFormModal } from "./CustomerFormModal";

export interface CustomerViewProps {
  data: CustomerListItem[];
  total: number;
  categoryOptions?: CustomerCategoryItem[];
  tagOptions?: CustomerTagItem[];
}

const SETTLEMENT_LABELS: Record<string, string> = {
  MONTHLY: "月结",
  CASH: "现结",
  PREPAID: "预付款",
};

/**
 * 客户档案列表：少即是多。
 * - URL：defineListSearchParams + useListSearch（默认 page/pageSize/keyword）
 * - UI：DataTable 默认能力 + filterExtra 扩展
 * - 表单：FormModal
 */
export function CustomerView({
  data,
  total,
  categoryOptions,
  tagOptions,
}: CustomerViewProps) {
  const categories = categoryOptions ?? [];
  const tags = tagOptions ?? [];
  const ability = useAbility();
  const list = useListSearch(customerSearchParams);

  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "create" | "edit" | "view";
    record?: CustomerListItem | null;
  }>({ open: false, mode: "create", record: null });

  const runAction = async (
    fn: () => Promise<{ success: boolean; error?: string }>,
    successText: string,
  ) => {
    const res = await fn();
    if (res.success) toast.success(successText);
    else toast.error(res.error || "操作失败");
  };

  const handleToggleStatus = (customerCode: string, currentStatus: string) => {
    const nextStatus =
      currentStatus === MasterDataStatus.ACTIVE
        ? MasterDataStatus.DISABLED
        : MasterDataStatus.ACTIVE;
    void runAction(
      () => updateCustomerStatusAction(customerCode, nextStatus),
      nextStatus === MasterDataStatus.ACTIVE ? "客户已启用" : "客户已停用",
    );
  };

  const handleDelete = (customerCode: string) => {
    void runAction(
      () => deleteCustomerAction(customerCode),
      "客户已成功删除",
    );
  };

  const handleExport = () => {
    exportContractCsv(data, customerPageContract.configurableFields ?? [], {
      subject: customerPageContract.subject,
      ability,
      skip: [CustomerField.CREDIT_LIMIT],
      filename: `客户主数据_${new Date().toISOString().slice(0, 10)}.csv`,
      format: {
        [CustomerField.SETTLEMENT_METHOD]: (c) =>
          SETTLEMENT_LABELS[c.settlementMethod] || c.settlementMethod,
        [CustomerField.STATUS]: (c) =>
          c.status === MasterDataStatus.ACTIVE ? "正常" : "已停用",
      },
    });
  };

  const columns: ColumnDef<CustomerListItem>[] = [
    {
      id: "customerCode",
      field: CustomerField.CUSTOMER_CODE,
      header: "客户编码",
      width: 150,
      lockVisible: true,
      cell: (c) => (
        <span className="font-mono text-xs font-bold text-primary">
          {c.customerCode}
        </span>
      ),
    },
    {
      id: "customerName",
      field: CustomerField.CUSTOMER_NAME,
      header: "客户名称",
      cell: (c) => (
        <div>
          <div className="font-medium text-foreground">{c.customerName}</div>
          {c.customerTags && (
            <div className="mt-1 flex flex-wrap gap-1">
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
      cell: (c) => (
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
      cell: (c) => (
        <div className="text-xs">
          <div className="font-medium text-foreground">{c.contactPerson}</div>
          <div className="font-mono text-muted-foreground">{c.contactPhone}</div>
        </div>
      ),
    },
    {
      id: "settlement",
      header: "结算 / 税率",
      field: CustomerField.SETTLEMENT_METHOD,
      width: 130,
      cell: (c) => (
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
      cell: (c) => (
        <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-muted-foreground">
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
      cell: (c) => (
        <Badge
          variant={
            c.status === MasterDataStatus.ACTIVE ? "success" : "secondary"
          }
          size="sm"
        >
          {c.status === MasterDataStatus.ACTIVE ? "正常" : "已停用"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "操作",
      width: 90,
      align: "right",
      cell: (c) => (
        <DataTableRowActions
          record={c}
          onView={() => setModalState({ open: true, mode: "view", record: c })}
          onEdit={() => setModalState({ open: true, mode: "edit", record: c })}
          extraActions={[
            {
              label:
                c.status === MasterDataStatus.ACTIVE ? "停用客户" : "启用客户",
              action: CustomerAction.TOGGLE_STATUS,
              collapsed: true,
              variant:
                c.status === MasterDataStatus.ACTIVE
                  ? "destructive"
                  : "default",
              onClick: () =>
                handleToggleStatus(c.customerCode || c.id || "", c.status),
              confirm:
                c.status === MasterDataStatus.ACTIVE
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
      <DataTable<CustomerListItem>
        data={data}
        columns={columns}
        rowKey={(c) => c.id || c.customerCode}
        subject={customerPageContract.subject}
        title="客户档案"
        description="维护企业客户主数据、结算方式、授信与服务时间。一个客户下可挂载多个履约门店。"
        total={total}
        {...list.dataTableProps}
        onExport={handleExport}
        onCreate={() => setModalState({ open: true, mode: "create" })}
        createText="新增"
        contentProps={{ selectable: true }}
        keywordPlaceholder="搜索客户编码、名称、联系人、电话..."
        statusOptions={[
          { value: MasterDataStatus.ACTIVE, label: "正常" },
          { value: MasterDataStatus.DISABLED, label: "已停用" },
        ]}
        statusValue={String(list.params.status ?? "")}
        onStatusChange={(v) => list.patch({ status: v || "" })}
        filterExtra={
          <DataTableInputGroup label="客户分类" className="w-48">
            <Select
              value={String(list.params.category || "ALL")}
              onValueChange={(next) =>
                list.patch({
                  category: !next || next === "ALL" ? "" : next,
                })
              }
            >
              <SelectTrigger className="w-full">
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
          </DataTableInputGroup>
        }
      />

      <CustomerFormModal
        open={modalState.open}
        mode={modalState.mode}
        record={modalState.record}
        categoryOptions={categories}
        tagOptions={tags}
        onClose={() =>
          setModalState({ open: false, mode: "create", record: null })
        }
        onSuccess={() =>
          setModalState({ open: false, mode: "create", record: null })
        }
      />
    </>
  );
}
