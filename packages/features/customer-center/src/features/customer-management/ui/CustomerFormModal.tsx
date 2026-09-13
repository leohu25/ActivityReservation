"use client";

import React, { useMemo } from "react";
import {
  z,
  FormModal,
  TagMultiSelect,
  type FormModalMode,
  type FormModalSection,
  toast,
} from "@base/ui";
import { createCustomerAction, updateCustomerAction } from "../actions";
import type {
  CustomerCategoryItem,
  CustomerTagItem,
  CustomerListItem,
} from "../types";

export interface CustomerFormModalProps {
  readonly open: boolean;
  readonly mode: FormModalMode;
  readonly record?: CustomerListItem | null;
  readonly categories: readonly CustomerCategoryItem[];
  readonly tags: readonly CustomerTagItem[];
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
  readonly inline?: boolean;
}

export type CustomerFormData = {
  customerCode?: string;
  customerName: string;
  categoryCode: string;
  contactPerson: string;
  contactPhone: string;
  settlementMethod: "MONTHLY" | "CASH" | "PREPAID";
  defaultTaxRate: number | null;
  creditLimit: number | null;
  salesPerson: string;
  serviceTime: string;
  tagCodes: string[];
};

export const customerFormZodSchema = z.object({
  customerCode: z.string().optional(),
  customerName: z.string().min(1, "客户企业名称为必填项"),
  categoryCode: z.string().min(1, "请选择客户分类"),
  contactPerson: z.string().min(1, "联系人姓名为必填项"),
  contactPhone: z
    .string()
    .min(1, "联系人电话为必填项")
    .regex(/^1[3-9]\d{9}$/, "请输入合法的11位手机号码"),
  settlementMethod: z.enum(["MONTHLY", "CASH", "PREPAID"]),
  defaultTaxRate: z.number().nullable().optional(),
  creditLimit: z.number().nullable().optional(),
  salesPerson: z.string().optional(),
  serviceTime: z.string().optional(),
  tagCodes: z.array(z.string()).optional(),
});

export const DEFAULT_CUSTOMER_VALUES: CustomerFormData = {
  customerCode: "",
  customerName: "",
  categoryCode: "",
  contactPerson: "",
  contactPhone: "",
  settlementMethod: "MONTHLY",
  defaultTaxRate: 9,
  creditLimit: null,
  salesPerson: "",
  serviceTime: "",
  tagCodes: [],
};

/**
 * 客户中心通用 CRUD 三态模态框（新增/编辑/居中查看）
 * - 新增与编辑共用同一表单，编辑支持完整字段回填与修改
 * - 客户编码/ID 等唯一标识全自动生成，严禁人工输入维护
 * - 查看详情采用居中模态窗，全字段只读置灰，带下属履约门店统计卡片
 */
export function CustomerFormModal({
  open,
  mode,
  record,
  categories,
  tags,
  onClose,
  onSuccess,
  inline,
}: CustomerFormModalProps) {
  // 组装初始值：新增时使用默认纯净数据；编辑/查看时回填记录
  const initialValues = useMemo<CustomerFormData>(() => {
    if (!record || mode === "create") {
      return {
        ...DEFAULT_CUSTOMER_VALUES,
        categoryCode: categories[0]?.categoryCode || "",
      };
    }

    // 解析已有标签
    let existingTagCodes: string[] = [];
    if (record.customerTags) {
      existingTagCodes = record.customerTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }

    return {
      customerCode: record.customerCode || "",
      customerName: record.customerName || "",
      categoryCode: record.categoryCode || categories[0]?.categoryCode || "",
      contactPerson: record.contactPerson || "",
      contactPhone: record.contactPhone || "",
      settlementMethod:
        (record.settlementMethod as "MONTHLY" | "CASH" | "PREPAID") ||
        "MONTHLY",
      defaultTaxRate:
        typeof record.defaultTaxRate === "number"
          ? record.defaultTaxRate
          : record.defaultTaxRate
            ? Number(record.defaultTaxRate)
            : null,
      creditLimit:
        typeof record.creditLimit === "number"
          ? record.creditLimit
          : record.creditLimit
            ? Number(record.creditLimit)
            : null,
      salesPerson: record.salesPerson || "",
      serviceTime: record.serviceTime || "",
      tagCodes: existingTagCodes,
    };
  }, [record, mode, categories]);

  // 动态字段结构：按业务分组
  const sections = useMemo<FormModalSection[]>(() => {
    const isCreate = mode === "create";

    const baseFields = [
      ...(isCreate
        ? []
        : [
            {
              name: "customerCode",
              label: "客户编码 (系统自动生成)",
              type: "text" as const,
              disabled: true,
              hint: "唯一单据编号，由系统自动生成并全局锁定",
            },
          ]),
      {
        name: "customerName",
        label: "客户企业名称",
        type: "text" as const,
        required: true,
        placeholder: "如: 绿叶餐饮管理有限公司",
      },
      {
        name: "categoryCode",
        label: "客户分类",
        type: "select" as const,
        required: true,
        options: categories.map((c) => ({
          value: c.categoryCode,
          label: `${c.categoryName} (${c.categoryCode})`,
        })),
      },
      {
        name: "contactPerson",
        label: "联系人姓名",
        type: "text" as const,
        required: true,
        placeholder: "如: 张经理",
      },
      {
        name: "contactPhone",
        label: "联系人电话",
        type: "text" as const,
        required: true,
        placeholder: "如: 13800138000",
      },
    ];

    const settleFields = [
      {
        name: "settlementMethod",
        label: "结算方式",
        type: "select" as const,
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
        type: "number" as const,
        step: "0.01",
        placeholder: "如: 9.00",
      },
      {
        name: "creditLimit",
        label: "信用额度(元)",
        type: "number" as const,
        step: "0.01",
        placeholder: "如: 50000.00",
      },
    ];

    const bizFields = [
      {
        name: "tagCodes",
        label: "业务标签",
        type: "custom" as const,
        hint: "可多选",
        span: 2 as const,
        render: ({
          value,
          onChange,
        }: {
          value: unknown;
          onChange: (v: unknown) => void;
        }) => (
          <TagMultiSelect
            options={tags.map((t) => ({
              value: t.tagCode,
              label: t.tagName,
            }))}
            value={Array.isArray(value) ? (value as string[]) : []}
            onChange={onChange}
          />
        ),
      },
      {
        name: "salesPerson",
        label: "业务专员",
        type: "text" as const,
        placeholder: "业务经理姓名",
      },
      {
        name: "serviceTime",
        label: "服务收货时间",
        type: "text" as const,
        placeholder: "如: 早8:00 - 10:00",
      },
    ];

    return [
      {
        title: "基础信息",
        fields: baseFields,
        columns: 2,
      },
      {
        title: "结算与授信",
        fields: settleFields,
        columns: 3,
      },
      {
        title: "业务归属",
        fields: bizFields,
        columns: 2,
      },
    ];
  }, [mode, categories, tags]);

  const handleSubmit = async (values: CustomerFormData) => {
    if (mode === "create") {
      const res = await createCustomerAction({
        customerName: values.customerName,
        categoryCode: values.categoryCode,
        contactPerson: values.contactPerson,
        contactPhone: values.contactPhone,
        settlementMethod: values.settlementMethod,
        defaultTaxRate: values.defaultTaxRate,
        creditLimit: values.creditLimit,
        tagCodes: values.tagCodes,
        salesPerson: values.salesPerson || null,
        defaultWarehouse: null,
        paymentCycle: null,
        serviceTime: values.serviceTime || null,
      });

      if (!res.success) {
        toast.error(res.error || "创建客户失败");
        throw new Error(res.error || "创建客户失败");
      }
      toast.success("客户档案创建成功");
      onSuccess?.();
    } else if (mode === "edit") {
      const targetCode = record?.customerCode || record?.id;
      if (!targetCode) {
        toast.error("缺少客户唯一标识，无法保存修改");
        return;
      }

      const res = await updateCustomerAction(targetCode, {
        customerName: values.customerName,
        categoryCode: values.categoryCode,
        contactPerson: values.contactPerson,
        contactPhone: values.contactPhone,
        settlementMethod: values.settlementMethod,
        defaultTaxRate: values.defaultTaxRate,
        creditLimit: values.creditLimit,
        tagCodes: values.tagCodes,
        salesPerson: values.salesPerson || null,
        serviceTime: values.serviceTime || null,
      });

      if (!res.success) {
        toast.error(res.error || "更新客户失败");
        throw new Error(res.error || "更新客户失败");
      }
      toast.success("客户资料修改已保存");
      onSuccess?.();
    }
  };

  const title =
    mode === "create"
      ? "新建客户主数据档案"
      : mode === "edit"
        ? `编辑客户档案: ${record?.customerName || ""}`
        : `客户档案详情: ${record?.customerName || ""}`;

  const description =
    mode === "create"
      ? "录入客户企业信息、联系人及结算规则，单号将由系统自动派发"
      : mode === "edit"
        ? "更新客户全量主数据与授信结算策略"
        : "居中查看客户主数据明细与关联门店概览";

  return (
    <FormModal<CustomerFormData>
      key={`${mode}-${record?.customerCode || record?.id || "new"}-${open ? "open" : "closed"}`}
      open={open}
      inline={inline}
      mode={mode}
      title={title}
      description={description}
      bannerTitle={mode === "create" ? "自动编号提醒" : undefined}
      bannerDescription={
        mode === "create"
          ? "客户编码将由后端规则引擎自动单调递增生成，无需人工干预。"
          : undefined
      }
      sections={sections}
      initialValues={initialValues}
      schema={customerFormZodSchema}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText={mode === "create" ? "立即创建客户" : "保存修改"}
      extraContent={
        (mode === "view" || mode === "edit") && record ? (
          <div className="flex flex-col gap-2 rounded-lg border border-border/70 p-3 bg-muted/20 mt-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase">
              下属履约门店统计
            </div>
            <div className="text-sm font-medium text-foreground">
              共挂载 {record._count?.stores ?? 0} 个关联履约门店
            </div>
          </div>
        ) : null
      }
    />
  );
}

// 兼容既有导入别名
export type { FormModalMode as CrudFormMode };
export { CustomerFormModal as CreateCustomerModal };
