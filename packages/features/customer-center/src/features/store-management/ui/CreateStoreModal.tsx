"use client";

import { useMemo, useState } from "react";
import {
  FormDialog,
  FormSection,
  FormBanner,
  FormFields,
  type FormFieldSchema,
  toast,
} from "@chenrun/ui";
import { createStoreAction } from "../actions";
import type { CustomerListItem } from "../../customer-management/types";

export interface CreateStoreModalProps {
  readonly customers: readonly CustomerListItem[];
  readonly onClose: () => void;
  readonly onCreated?: () => void;
}

type CreateStoreForm = {
  customerCode: string;
  storeName: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  regionCode: string;
  deliveryPeriod: string;
  billingContact: string;
  billingPhone: string;
};

/** 新建履约门店：FormDialog + FormFields 驱动 */
export function CreateStoreModal({
  customers,
  onClose,
  onCreated,
}: CreateStoreModalProps) {
  const [values, setValues] = useState<CreateStoreForm>({
    customerCode: customers[0]?.customerCode || "",
    storeName: "",
    address: "",
    contactPerson: "",
    contactPhone: "",
    regionCode: "REGION_BJ_01",
    deliveryPeriod: "MORNING",
    billingContact: "",
    billingPhone: "",
  });

  const baseFields: FormFieldSchema[] = useMemo(
    () => [
      {
        name: "customerCode",
        label: "所属客户企业",
        type: "select",
        required: true,
        options: customers.map((c) => ({
          value: c.customerCode,
          label: `${c.customerName} (${c.customerCode})`,
        })),
      },
      {
        name: "storeName",
        label: "门店名称",
        type: "text",
        required: true,
        placeholder: "如: 绿叶餐饮(西湖银泰店)",
      },
      {
        name: "address",
        label: "配送收货详细地址",
        type: "text",
        required: true,
        span: 2,
        placeholder: "如: 杭州市上城区延安路98号B1层后厨收货通道",
      },
    ],
    [customers],
  );

  const siteFields: FormFieldSchema[] = useMemo(
    () => [
      {
        name: "contactPerson",
        label: "门店现场联系人",
        type: "text",
        required: true,
        placeholder: "如: 李厨师长",
      },
      {
        name: "contactPhone",
        label: "联系人联系电话",
        type: "text",
        required: true,
        placeholder: "如: 13912345678",
      },
      {
        name: "regionCode",
        label: "配送所属网格/区域",
        type: "select",
        required: true,
        options: [
          { value: "REGION_BJ_01", label: "华北北京核心城区网格" },
          { value: "REGION_HD_01", label: "华东杭州生鲜直配网格" },
          { value: "REGION_DEFAULT", label: "通用默认配送网格" },
        ],
      },
      {
        name: "deliveryPeriod",
        label: "首选配送时段",
        type: "select",
        required: true,
        options: [
          { value: "MORNING", label: "早间配送 (05:00-08:00)" },
          { value: "NOON", label: "午间配送 (10:00-12:00)" },
          { value: "EVENING", label: "傍晚配送 (15:00-18:00)" },
        ],
      },
    ],
    [],
  );

  const billingFields: FormFieldSchema[] = useMemo(
    () => [
      {
        name: "billingContact",
        label: "财务对账对接人",
        type: "text",
        placeholder: "对账会计姓名",
      },
      {
        name: "billingPhone",
        label: "财务对接电话",
        type: "text",
        placeholder: "对账联系电话",
      },
    ],
    [],
  );

  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="新建履约门店档案"
      description="门店必须归属有效客户并绑定配送区域"
      submitText="创建门店档案"
      headerExtra={
        <FormBanner
          title="履约门店"
          description="现场联系人与收货地址为配送调度必填信息。"
        />
      }
      onSubmit={async () => {
        const res = await createStoreAction({
          ...values,
          defaultRoute: null,
          defaultDriver: null,
          billingContact: values.billingContact || null,
          billingPhone: values.billingPhone || null,
        });
        if (!res.success) {
          toast.error(res.error || "创建门店失败");
          throw new Error(res.error || "创建门店失败");
        }
        toast.success("门店创建成功");
        onCreated?.();
      }}
    >
      <FormSection title="归属与基础">
        <FormFields
          fields={baseFields}
          values={values}
          onChange={(name, val) =>
            setValues((prev) => ({ ...prev, [name]: val }))
          }
          columns={2}
        />
      </FormSection>
      <FormSection title="现场与配送">
        <FormFields
          fields={siteFields}
          values={values}
          onChange={(name, val) =>
            setValues((prev) => ({ ...prev, [name]: val }))
          }
          columns={2}
        />
      </FormSection>
      <FormSection title="财务对接（选填）">
        <FormFields
          fields={billingFields}
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
