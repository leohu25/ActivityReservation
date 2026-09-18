"use client";

import { useMemo } from "react";
import {
	FormModal,
	type FormModalMode,
	type FormModalSection,
	toast,
} from "@base/ui";
import { createStoreAction, updateStoreAction } from "../actions";
import { CustomerStoreSubject } from "../contract";
import { createStoreSchema } from "../schema";
import type { StoreListItem } from "../types";
import type { CustomerListItem } from "../../customer-management/types";

export interface StoreFormModalProps {
	readonly open: boolean;
	readonly mode: FormModalMode;
	readonly record?: StoreListItem | null;
	readonly customers: readonly CustomerListItem[];
	readonly onClose: () => void;
	readonly onSuccess?: () => void;
	readonly inline?: boolean;
}

export type StoreFormData = {
	customerId: string;
	name: string;
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

export const storeFormZodSchema = createStoreSchema;

export const DEFAULT_STORE_VALUES: StoreFormData = {
	customerId: "",
	name: "",
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
 * - 统一基于 FormModal 构建工业风弹窗
 * - 新增/编辑共用结构，编辑模式锁定 customerId
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
				customerId: customers[0]?.id || "",
			};
		}
		return {
			customerId: record.customerId || "",
			name: record.name || "",
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

	const sections = useMemo<FormModalSection[]>(() => {
		const isCreate = mode === "create";
		const isEdit = mode === "edit";

		return [
			{
				title: "归属与基础",
				columns: 2,
				fields: [
					{
						name: "customerId",
						label: "所属客户企业",
						type: "select" as const,
						required: true,
						disabled: isEdit,
						options: customers.map((c) => ({
							value: c.id,
							label: c.name,
						})),
						hint: isEdit ? "所属客户绑定后不可变更" : undefined,
					},
					{
						name: "name",
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
						placeholder: "如: 杭州市上城区延安路98号B1层后厨收货通道",
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
				customerId: values.customerId,
				name: values.name,
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
			const id = record?.id;
			if (!id) {
				toast.error("缺少门店唯一标识，无法更新");
				return;
			}

			const res = await updateStoreAction(id, {
				name: values.name,
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
				? `编辑门店档案: ${record?.name || ""}`
				: `门店档案详情: ${record?.name || ""}`;

	const description =
		mode === "create"
			? "门店必须归属有效客户企业并绑定配送区域"
			: mode === "edit"
				? "更新门店名称、收货地址、现场联系人及配送调度参数"
				: "居中查看履约门店主数据与收货配送路线配置";

	return (
		<FormModal<StoreFormData>
			key={`${mode}-${record?.id || "new"}-${open ? "open" : "closed"}`}
			open={open}
			inline={inline}
			mode={mode}
			subject={CustomerStoreSubject}
			title={title}
			description={description}
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
							{record.customer?.name || record.customerId}
						</div>
					</div>
				) : null
			}
		/>
	);
}
