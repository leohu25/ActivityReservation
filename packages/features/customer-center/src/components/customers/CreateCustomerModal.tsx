"use client";

import React, { useMemo } from "react";
import { DataTable, TagMultiSelect, toast } from "@chenrun/ui";
import type { DataTableFormFieldSchema } from "@chenrun/ui";
import { createCustomerAction } from "../../actions";
import type { CustomerCategoryItem, CustomerTagItem } from "../../types";

export interface CreateCustomerModalProps {
  readonly categories: readonly CustomerCategoryItem[];
  readonly tags: readonly CustomerTagItem[];
  readonly onClose: () => void;
  readonly onCreated?: () => void;
}

type CreateCustomerForm = {
  customerName: string;
  categoryCode: string;
  contactPerson: string;
  contactPhone: string;
  settlementMethod: "MONTHLY" | "CASH" | "PREPAID";
  defaultTaxRate: number | null;
  creditLimit: number | null;
  salesPerson: string;
  serviceTime: string;
};

/**
 * 新建客户：FormModal 壳 + 字段 Schema 循环渲染
 * 业务只声明字段清单，不再手写一长串 label+Input
 */
export function CreateCustomerModal({
  categories,
  tags,
  onClose,
  onCreated,
}: CreateCustomerModalProps) {
  const form = DataTable.useForm<CreateCustomerForm>({
    customerName: "",
    categoryCode: categories[0]?.categoryCode || "",
    contactPerson: "",
    contactPhone: "",
    settlementMethod: "MONTHLY",
    defaultTaxRate: 9,
    creditLimit: null,
    salesPerson: "",
    serviceTime: "",
  });
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  const basicFields: DataTableFormFieldSchema[] = useMemo(
    () => [
      {
        name: "customerName",
        label: "客户企业名称",
        type: "text",
        required: true,
        placeholder: "如: 绿叶餐饮管理有限公司",
      },
      {
        name: "categoryCode",
        label: "客户分类",
        type: "select",
        required: true,
        options: categories.map((c) => ({
          value: c.categoryCode,
          label: `${c.categoryName} (${c.categoryCode})`,
        })),
      },
      {
        name: "contactPerson",
        label: "联系人姓名",
        type: "text",
        required: true,
        placeholder: "如: 张经理",
      },
      {
        name: "contactPhone",
        label: "联系人电话",
        type: "text",
        required: true,
        placeholder: "如: 13800138000",
      },
    ],
    [categories],
  );

  const settleFields: DataTableFormFieldSchema[] = useMemo(
    () => [
      {
        name: "settlementMethod",
        label: "结算方式",
        type: "select",
        required: true,
        options: [
          { value: "MONTHLY", label: "月结 (MONTHLY)" },
          { value: "CASH", label: "现结 (CASH)" },
          { value: "PREPAID", label: "预付 (PREPAID)" },
        ],
      },
      {
        name: "defaultTaxRate",
        label: "默认税率(%)",
        type: "number",
        step: "0.01",
        placeholder: "如: 9.00",
      },
      {
        name: "creditLimit",
        label: "信用额度(元)",
        type: "number",
        step: "0.01",
        placeholder: "如: 50000.00",
      },
    ],
    [],
  );

  const bizFields: DataTableFormFieldSchema[] = useMemo(
    () => [
      {
        name: "_tags",
        label: "业务标签",
        type: "custom",
        hint: "可多选",
        span: 2,
        render: () => (
          <TagMultiSelect
            options={tags.map((t) => ({
              value: t.tagCode,
              label: t.tagName,
            }))}
            value={selectedTags}
            onChange={setSelectedTags}
          />
        ),
      },
      {
        name: "salesPerson",
        label: "业务专员",
        type: "text",
        placeholder: "业务经理姓名",
      },
      {
        name: "serviceTime",
        label: "服务收货时间",
        type: "text",
        placeholder: "如: 早8:00 - 10:00",
      },
    ],
    [tags, selectedTags],
  );

  return (
    <DataTable.FormModal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="新建客户主数据档案"
      description="录入客户企业信息、联系人及结算规则"
      submitText="创建客户档案"
      headerExtra={
        <DataTable.FormBanner
          title="客户主数据"
          description="名称与联系人必填；业务标签可多选。"
        />
      }
      onSubmit={async () => {
        const res = await createCustomerAction({
          customerName: form.values.customerName,
          categoryCode: form.values.categoryCode,
          contactPerson: form.values.contactPerson,
          contactPhone: form.values.contactPhone,
          settlementMethod: form.values.settlementMethod,
          defaultTaxRate: form.values.defaultTaxRate,
          creditLimit: form.values.creditLimit,
          tagCodes: selectedTags,
          salesPerson: form.values.salesPerson || null,
          defaultWarehouse: null,
          paymentCycle: null,
          serviceTime: form.values.serviceTime || null,
        });
        if (!res.success) {
          toast.error(res.error || "创建客户失败");
          throw new Error(res.error || "创建客户失败");
        }
        toast.success("客户创建成功");
        onCreated?.();
      }}
    >
      <DataTable.FormSection title="基础信息">
        <DataTable.FormFields
          fields={basicFields}
          values={form.values}
          onChange={form.setField}
          columns={2}
        />
      </DataTable.FormSection>

      <DataTable.FormSection title="结算与授信">
        <DataTable.FormFields
          fields={settleFields}
          values={form.values}
          onChange={form.setField}
          columns={3}
        />
      </DataTable.FormSection>

      <DataTable.FormSection title="业务归属">
        <DataTable.FormFields
          fields={bizFields}
          values={form.values}
          onChange={form.setField}
          columns={2}
        />
      </DataTable.FormSection>
    </DataTable.FormModal>
  );
}
