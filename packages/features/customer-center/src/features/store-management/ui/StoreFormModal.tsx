"use client";

import React, { useMemo } from "react";
import {
    z,
    CrudFormModal,
    type CrudFormMode,
    type CrudFormSection,
    toast,
} from "@base/ui";
import { createStoreAction, updateStoreAction } from "../actions";
import type { StoreListItem } from "../types";
import type { CustomerListItem } from "../../customer-management/types";

export interface StoreFormModalProps {
    readonly open: boolean;
    readonly mode: CrudFormMode;
    readonly record?: StoreListItem | null;
    readonly customers: readonly CustomerListItem[];
    readonly onClose: () => void;
    readonly onSuccess?: () => void;
    readonly inline?: boolean;
}

export type StoreFormData = {
    storeCode?: string;
    customerCode: string;
    storeName: string;
    regionCode: string;
    deliveryPeriod: string;
    address: string;
    contactPerson: string;
    contactPhone: string;
    defaultRoute?: string;
    defaultDriver?: string;
    billingContact?: string;
    billingPhone?: string;
};

export const storeFormZodSchema = z.object({
    storeCode: z.string().optional(),
    customerCode: z.string().min(1, "所属客户企业为必选项"),
    storeName: z
        .string()
        .min(1, "门店名称为必填项")
        .max(100, "门店名称最多100个字符"),
    regionCode: z.string().min(1, "请选择所属配送区域网格"),
    deliveryPeriod: z.string().min(1, "请选择首选配送时段"),
    address: z
        .string()
        .min(1, "配送收货地址为必填项")
        .max(200, "配送收货地址最多200个字符"),
    contactPerson: z
        .string()
        .min(1, "现场联系人为必填项")
        .max(50, "现场联系人最多50个字符"),
    contactPhone: z
        .string()
        .min(1, "联系人电话为必填项")
        .regex(/^1[3-9]\d{9}$/, "请输入合法的11位手机号码"),
    defaultRoute: z.string().optional(),
    defaultDriver: z.string().optional(),
    billingContact: z.string().optional(),
    billingPhone: z
        .string()
        .optional()
        .refine(
            (val) => !val || /^1[3-9]\d{9}$/.test(val),
            "请输入合法的11位对账联系电话",
        ),
});

export const DEFAULT_STORE_VALUES: StoreFormData = {
    storeCode: "",
    customerCode: "",
    storeName: "",
    regionCode: "REGION_BJ_01",
    deliveryPeriod: "MORNING",
    address: "",
    contactPerson: "",
    contactPhone: "",
    defaultRoute: "",
    defaultDriver: "",
    billingContact: "",
    billingPhone: "",
};

/**
 * 门店档案通用 CRUD 三态模态框（新增/编辑/居中查看）
 * - 统一基于 CrudFormModal 构建工业风弹窗
 * - 新增/编辑共用结构，编辑模式锁定 storeCode 与 customerCode
 * - 查看详情全字段只读置灰展示
 */
export function StoreFormModal({
    open,
    mode,
    record,
    customers,
    onClose,
    onSuccess,
    inline,
}: StoreFormModalProps) {
    const initialValues = useMemo<StoreFormData>(() => {
        if (!record || mode === "create") {
            return {
                ...DEFAULT_STORE_VALUES,
                customerCode:
                    customers[0]?.customerCode || customers[0]?.id || "",
            };
        }
        return {
            storeCode: record.storeCode || "",
            customerCode: record.customerCode || "",
            storeName: record.storeName || "",
            regionCode: record.regionCode || "REGION_BJ_01",
            deliveryPeriod: record.deliveryPeriod || "MORNING",
            address: record.address || "",
            contactPerson: record.contactPerson || "",
            contactPhone: record.contactPhone || "",
            defaultRoute: record.defaultRoute || "",
            defaultDriver: record.defaultDriver || "",
            billingContact: record.billingContact || "",
            billingPhone: record.billingPhone || "",
        };
    }, [record, mode, customers]);

    const sections = useMemo<CrudFormSection[]>(() => {
        const isCreate = mode === "create";
        const isEdit = mode === "edit";

        return [
            {
                title: "归属与基础",
                columns: 2,
                fields: [
                    ...(isCreate
                        ? []
                        : [
                              {
                                  name: "storeCode",
                                  label: "门店编码",
                                  type: "text" as const,
                                  disabled: true,
                                  placeholder: "系统自动分配（唯一标识）",
                                  hint: "门店履约唯一编码，创建后不可更改",
                              },
                          ]),
                    {
                        name: "customerCode",
                        label: "所属客户企业",
                        type: "select" as const,
                        required: true,
                        disabled: isEdit,
                        options: customers.map((c, idx) => {
                            const code =
                                c.customerCode || c.id || `cust-${idx}`;
                            return {
                                value: code,
                                label: `${c.customerName || code} (${code})`,
                            };
                        }),
                        hint: isEdit ? "所属客户绑定后不可变更" : undefined,
                    },
                    {
                        name: "storeName",
                        label: "门店名称",
                        type: "text" as const,
                        required: true,
                        placeholder: "如: 绿叶餐饮(西湖银泰店)",
                        span: isCreate ? (2 as const) : (1 as const),
                    },
                ],
            },
            {
                title: "现场联系与配送网格",
                columns: 2,
                fields: [
                    {
                        name: "address",
                        label: "配送收货详细地址",
                        type: "text" as const,
                        required: true,
                        span: 2 as const,
                        placeholder:
                            "如: 杭州市上城区延安路98号B1层后厨收货通道",
                    },
                    {
                        name: "contactPerson",
                        label: "门店现场联系人",
                        type: "text" as const,
                        required: true,
                        placeholder: "如: 李厨师长",
                    },
                    {
                        name: "contactPhone",
                        label: "联系人电话",
                        type: "text" as const,
                        required: true,
                        placeholder: "如: 13912345678",
                    },
                    {
                        name: "regionCode",
                        label: "配送所属网格/区域",
                        type: "select" as const,
                        required: true,
                        options: [
                            {
                                value: "REGION_BJ_01",
                                label: "华北北京核心城区网格",
                            },
                            {
                                value: "REGION_HD_01",
                                label: "华东杭州生鲜直配网格",
                            },
                            {
                                value: "REGION_DEFAULT",
                                label: "通用默认配送网格",
                            },
                        ],
                    },
                    {
                        name: "deliveryPeriod",
                        label: "首选配送时段",
                        type: "select" as const,
                        required: true,
                        options: [
                            {
                                value: "MORNING",
                                label: "早间配送 (05:00-08:00)",
                            },
                            { value: "NOON", label: "午间配送 (10:00-12:00)" },
                            {
                                value: "EVENING",
                                label: "傍晚配送 (15:00-18:00)",
                            },
                        ],
                    },
                    {
                        name: "defaultRoute",
                        label: "默认配送路线",
                        type: "text" as const,
                        placeholder: "如: ROUTE_01_WEST",
                    },
                    {
                        name: "defaultDriver",
                        label: "默认配送司机",
                        type: "text" as const,
                        placeholder: "如: 张师傅",
                    },
                ],
            },
            {
                title: "财务对接（选填）",
                columns: 2,
                fields: [
                    {
                        name: "billingContact",
                        label: "财务对账对接人",
                        type: "text" as const,
                        placeholder: "如: 对账会计姓名",
                    },
                    {
                        name: "billingPhone",
                        label: "财务对接电话",
                        type: "text" as const,
                        placeholder: "如: 13800001111",
                    },
                ],
            },
        ];
    }, [mode, customers]);

    const handleSubmit = async (values: StoreFormData) => {
        if (mode === "create") {
            const res = await createStoreAction({
                customerCode: values.customerCode,
                storeName: values.storeName,
                address: values.address,
                contactPerson: values.contactPerson,
                contactPhone: values.contactPhone,
                regionCode: values.regionCode,
                deliveryPeriod: values.deliveryPeriod,
                defaultRoute: values.defaultRoute || null,
                defaultDriver: values.defaultDriver || null,
                billingContact: values.billingContact || null,
                billingPhone: values.billingPhone || null,
            });

            if (!res.success) {
                toast.error(res.error || "创建门店失败");
                throw new Error(res.error || "创建门店失败");
            }
            toast.success("门店档案创建成功");
            onSuccess?.();
        } else if (mode === "edit") {
            const storeCode = record?.storeCode;
            if (!storeCode) {
                toast.error("缺少门店唯一编码，无法更新");
                return;
            }

            const res = await updateStoreAction(storeCode, {
                storeName: values.storeName,
                address: values.address,
                contactPerson: values.contactPerson,
                contactPhone: values.contactPhone,
                regionCode: values.regionCode,
                deliveryPeriod: values.deliveryPeriod,
                defaultRoute: values.defaultRoute || null,
                defaultDriver: values.defaultDriver || null,
                billingContact: values.billingContact || null,
                billingPhone: values.billingPhone || null,
            });

            if (!res.success) {
                toast.error(res.error || "更新门店失败");
                throw new Error(res.error || "更新门店失败");
            }
            toast.success("门店档案修改成功");
            onSuccess?.();
        }
    };

    const title =
        mode === "create"
            ? "新建履约门店档案"
            : mode === "edit"
              ? `编辑门店档案: ${record?.storeName || ""}`
              : `门店档案详情: ${record?.storeName || ""}`;

    const description =
        mode === "create"
            ? "门店必须归属有效客户企业并绑定配送区域，单号将由系统自动派发"
            : mode === "edit"
              ? "更新门店名称、收货地址、现场联系人及配送调度参数"
              : "居中查看履约门店主数据与收货配送路线配置";

    return (
        <CrudFormModal<StoreFormData>
            key={`${mode}-${record?.storeCode || "new"}-${open ? "open" : "closed"}`}
            open={open}
            inline={inline}
            mode={mode}
            title={title}
            description={description}
            bannerTitle={mode === "create" ? "自动编号提醒" : undefined}
            bannerDescription={
                mode === "create"
                    ? "门店编码将由系统自动派发（格式：STOR-YYYYMMDD-XXXX），创建成功后归属客户不可变更。"
                    : undefined
            }
            sections={sections}
            initialValues={initialValues}
            schema={storeFormZodSchema}
            onClose={onClose}
            onSubmit={handleSubmit}
            submitText={mode === "create" ? "立即创建门店" : "保存修改"}
            extraContent={
                (mode === "view" || mode === "edit") && record ? (
                    <div className="flex flex-col gap-2 rounded-lg border border-border/70 p-3 bg-muted/20 mt-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase">
                            所属客户信息
                        </div>
                        <div className="text-sm font-medium text-foreground">
                            {record.customer?.customerName ||
                                record.customerCode}{" "}
                            ({record.customerCode})
                        </div>
                    </div>
                ) : null
            }
        />
    );
}
