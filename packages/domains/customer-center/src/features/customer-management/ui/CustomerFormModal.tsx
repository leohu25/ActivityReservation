"use client";

import React, { useMemo } from "react";
import {
	FormModal,
	TagMultiSelect,
	type FormModalMode,
	type FormModalSection,
	toast,
} from "@base/ui";
import { CustomerSubject } from "../contract";
import { createCustomerAction, updateCustomerAction } from "../actions";
import { createCustomerSchema } from "../schema";
import type {
	CustomerCategoryItem,
	CustomerTagItem,
	CustomerListItem,
} from "../types";

export interface CustomerFormModalProps {
	readonly open: boolean;
	readonly mode: FormModalMode;
	readonly record?: CustomerListItem | null;
	readonly categoryOptions?: readonly CustomerCategoryItem[];
	readonly tagOptions?: readonly CustomerTagItem[];
	readonly onClose: () => void;
	readonly onSuccess?: () => void;
	readonly inline?: boolean;
}

export type CustomerFormData = {
	name: string;
	categoryId: string;
	contactPerson: string;
	contactPhone: string;
	settlementMethod: "MONTHLY" | "CASH" | "PREPAID";
	defaultTaxRate: number | null;
	creditLimit: number | null;
	salesPerson: string;
	serviceTime: string;
	tagIds: string[];
};

/** 统一使用 schema.ts 的单一度量源（SSoT） */
export const customerFormZodSchema = createCustomerSchema;

export const DEFAULT_CUSTOMER_VALUES: CustomerFormData = {
	name: "",
	categoryId: "",
	contactPerson: "",
	contactPhone: "",
	settlementMethod: "MONTHLY",
	defaultTaxRate: 9,
	creditLimit: null,
	salesPerson: "",
	serviceTime: "",
	tagIds: [],
};

/**
 * 客户中心通用 CRUD 三态模态框（新增/编辑/居中查看）
 * - 新增与编辑共用同一表单，编辑支持完整字段回填与修改
 * - 查看详情采用居中模态窗，全字段只读置灰，带下属履约门店统计卡片
 * - 声明 subject={CustomerSubject}，由 @base/ui FormModal 统一驱动 CASL 字段权限三态闭环
 */
export function CustomerFormModal({
	open,
	mode,
	record,
	categoryOptions,
	tagOptions,
	onClose,
	onSuccess,
	inline,
}: CustomerFormModalProps) {
	const resolvedCategoryOptions = categoryOptions ?? [];
	const resolvedTagOptions = tagOptions ?? [];

	// 组装初始值：新增时使用默认纯净数据；编辑/查看时回填记录
	const initialValues = useMemo<CustomerFormData>(() => {
		if (!record || mode === "create") {
			return {
				...DEFAULT_CUSTOMER_VALUES,
				categoryId: resolvedCategoryOptions[0]?.id || "",
			};
		}

		// 解析已有标签
		let existingTagIds: string[] = [];
		if (record.customerTags) {
			existingTagIds = record.customerTags
				.split(",")
				.map((t) => t.trim())
				.filter(Boolean);
		}

		return {
			name: record.name || "",
			categoryId: record.categoryId || resolvedCategoryOptions[0]?.id || "",
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
			tagIds: existingTagIds,
		};
	}, [record, mode, resolvedCategoryOptions]);

	// 动态字段结构：按业务分组
	const sections = useMemo<FormModalSection[]>(() => {
		const baseFields = [
			{
				name: "name",
				label: "客户企业名称",
				type: "text" as const,
				required: true,
				placeholder: "如: 绿叶餐饮管理有限公司",
			},
			{
				name: "categoryId",
				label: "客户分类",
				type: "combobox" as const,
				required: true,
				placeholder: "请选择或搜索客户分类",
				searchPlaceholder: "输入分类名称过滤...",
				emptyText: "未找到对应客户分类",
				options: resolvedCategoryOptions.map((c) => ({
					value: c.id,
					label: c.name,
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
				name: "tagIds",
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
						options={resolvedTagOptions.map((t) => ({
							value: t.id,
							label: t.name,
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
	}, [resolvedCategoryOptions, resolvedTagOptions]);

	const handleSubmit = async (values: CustomerFormData) => {
		if (mode === "create") {
			const res = await createCustomerAction({
				name: values.name,
				categoryId: values.categoryId,
				contactPerson: values.contactPerson,
				contactPhone: values.contactPhone,
				settlementMethod: values.settlementMethod,
				defaultTaxRate: values.defaultTaxRate,
				creditLimit: values.creditLimit,
				tagIds: values.tagIds,
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
			const targetId = record?.id;
			if (!targetId) {
				toast.error("缺少客户唯一标识，无法保存修改");
				return;
			}

			const res = await updateCustomerAction(targetId, {
				name: values.name,
				categoryId: values.categoryId,
				contactPerson: values.contactPerson,
				contactPhone: values.contactPhone,
				settlementMethod: values.settlementMethod,
				defaultTaxRate: values.defaultTaxRate,
				creditLimit: values.creditLimit,
				tagIds: values.tagIds,
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
				? `编辑客户档案: ${record?.name || ""}`
				: `客户档案详情: ${record?.name || ""}`;

	const description =
		mode === "create"
			? "录入客户企业信息、联系人及结算规则"
			: mode === "edit"
				? "更新客户全量主数据与授信结算策略"
				: "居中查看客户主数据明细与关联门店概览";

	return (
		<FormModal<CustomerFormData>
			key={`${mode}-${record?.id || "new"}-${open ? "open" : "closed"}`}
			open={open}
			inline={inline}
			mode={mode}
			subject={CustomerSubject}
			title={title}
			description={description}
			sections={sections}
			initialValues={initialValues}
			schema={createCustomerSchema}
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
