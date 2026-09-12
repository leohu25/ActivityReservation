"use client";

import { useMemo, useState } from "react";
import {
  FormDialog,
  FormSection,
  FormBanner,
  FormFields,
  TagMultiSelect,
  type FormFieldSchema,
  toast,
} from "@chenrun/ui";
import { createCustomerAction } from "../actions";
import type { CustomerCategoryItem, CustomerTagItem } from "../types";

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
 * 新建客户：FormDialog + FormFields 驱动
 */
export function CreateCustomerModal({
  categories,
  tags,
  onClose,
  onCreated,
}: CreateCustomerModalProps) {
  const [values, setValues] = useState<CreateCustomerForm>({
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const basicFields: FormFieldSchema[] = useMemo(
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

  const settleFields: FormFieldSchema[] = useMemo(
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

  const bizFields: FormFieldSchema[] = useMemo(
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
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="新建客户主数据档案"
      description="录入客户企业信息、联系人及结算规则"
      submitText="创建客户档案"
      headerExtra={
        <FormBanner
          title="客户主数据"
          description="名称与联系人必填；业务标签可多选。"
        />
      }
      onSubmit={async () => {
        const res = await createCustomerAction({
          customerName: values.customerName,
          categoryCode: values.categoryCode,
          contactPerson: values.contactPerson,
          contactPhone: values.contactPhone,
          settlementMethod: values.settlementMethod,
          defaultTaxRate: values.defaultTaxRate,
          creditLimit: values.creditLimit,
          tagCodes: selectedTags,
          salesPerson: values.salesPerson || null,
          defaultWarehouse: null,
          paymentCycle: null,
          serviceTime: values.serviceTime || null,
        });
        if (!res.success) {
          toast.error(res.error || "创建客户失败");
          throw new Error(res.error || "创建客户失败");
        }
        toast.success("客户创建成功");
        onCreated?.();
      }}
    >
      <FormSection title="基础信息">
        <FormFields
          fields={basicFields}
          values={values}
          onChange={(name, val) =>
            setValues((prev) => ({ ...prev, [name]: val }))
          }
          columns={2}
        />
      </FormSection>

      <FormSection title="结算与授信">
        <FormFields
          fields={settleFields}
          values={values}
          onChange={(name, val) =>
            setValues((prev) => ({ ...prev, [name]: val }))
          }
          columns={3}
        />
      </FormSection>

      <FormSection title="业务归属">
        <FormFields
          fields={bizFields}
          values={values}
          onChange={(name, val) =>
            setValues((prev) => ({ ...prev, [name]: val }))
          }
          columns={2}
        />
      </FormSection>
    </FormDialog>
  );
}
