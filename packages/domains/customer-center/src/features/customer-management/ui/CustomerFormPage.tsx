"use client";

import { useMemo, useCallback } from "react";
import {
	FormPage,
	Badge,
	TagMultiSelect,
	useSafeRouter,
	updateTabTitle,
	type FormPageMode,
	type FormPageSection,
	type FormFieldSchema,
	toast,
} from "@base/ui";
import { CustomerSubject, MasterDataStatus } from "../contract";
import { createCustomerAction, updateCustomerAction } from "../actions";
import { createCustomerSchema } from "../schema";
import type {
	CustomerCategoryItem,
	CustomerTagItem,
	CustomerListItem,
} from "../types";

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

export const customerFormZodSchema = createCustomerSchema;

export interface CustomerFormPageProps {
	readonly mode?: FormPageMode;
	readonly record?: CustomerListItem | null;
	readonly categoryOptions?: readonly CustomerCategoryItem[];
	readonly tagOptions?: readonly CustomerTagItem[];
	readonly onBack?: () => void;
	readonly backUrl?: string;
}

/**
 * 客户中心全屏单据工作台 (CustomerFormPage)
 * - 高度物理内聚：字段分组、初始值装配与提交逻辑收敛于单一文件，践行“少即是多”
 * - 纯净响应式派生：无冗余本地状态，表单标题随输入与保存实时同步，对齐主流 ERP 交互范式
 */
export function CustomerFormPage({
	mode = "create",
	record,
	categoryOptions = [],
	tagOptions = [],
	onBack,
	backUrl = "/customer/customers",
}: CustomerFormPageProps) {
	const router = useSafeRouter();
	const isView = mode === "view";

	// 初始值装配（纯函数派生）
	const initialValues = useMemo<CustomerFormData>(() => {
		if (!record || mode === "create") {
			return {
				...DEFAULT_CUSTOMER_VALUES,
				categoryId: categoryOptions[0]?.id || "",
			};
		}

		let existingTagIds: string[] = [];
		if (record.customerTags) {
			existingTagIds = record.customerTags
				.split(",")
				.map((t: string) => t.trim())
				.filter(Boolean);
		}

		return {
			name: record.name || "",
			categoryId: record.categoryId || categoryOptions[0]?.id || "",
			contactPerson: record.contactPerson || "",
			contactPhone: record.contactPhone || "",
			settlementMethod:
				(record.settlementMethod as "MONTHLY" | "CASH" | "PREPAID") || "MONTHLY",
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
	}, [record, mode, categoryOptions]);

	// 字段分组定义（工业风全屏三区块布局：基础信息、结算与授信、业务归属）
	const sections = useMemo<FormPageSection[]>(() => {
		const baseFields: FormFieldSchema[] = [
			{
				name: "name",
				label: "客户企业名称",
				type: "text",
				required: true,
				placeholder: "如: 绿叶餐饮管理有限公司",
			},
			{
				name: "categoryId",
				label: "客户分类",
				type: "combobox",
				required: true,
				placeholder: "请选择或搜索客户分类",
				searchPlaceholder: "输入分类名称过滤...",
				emptyText: "未找到对应客户分类",
				options: categoryOptions.map((c) => ({
					value: c.id,
					label: c.name,
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
		];

		const settleFields: FormFieldSchema[] = [
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
		];

		const bizFields: FormFieldSchema[] = [
			{
				name: "tagIds",
				label: "业务标签",
				type: "custom",
				hint: "可多选",
				span: 2,
				render: ({
					value,
					onChange,
				}: {
					value: unknown;
					onChange: (v: unknown) => void;
				}) => (
					<TagMultiSelect
						options={tagOptions.map((t) => ({
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
				type: "text",
				placeholder: "业务经理姓名",
			},
			{
				name: "serviceTime",
				label: "服务收货时间",
				type: "text",
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
	}, [categoryOptions, tagOptions]);

	const handleSubmit = useCallback(
		async (values: CustomerFormData) => {
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
					return;
				}
				toast.success("客户档案创建成功");

				// 对齐主流 ERP 范式：创建后无缝切换为已保存单据，留在当前 Tab 继续后续操作
				const created = res.data;
				if (created?.id) {
					updateTabTitle(`编辑: ${values.name}`);
					router?.replace(`/customer/customers/${created.id}?mode=edit`);
				}
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
					toast.error(res.error || "更新客户档案失败");
					return;
				}
				toast.success("客户档案保存成功");

				// 保存成功后更新 Tab 标题为最新客户名，留在当前页
				updateTabTitle(`编辑: ${values.name}`);
			}
		},
		[mode, record?.id, router],
	);

	const statusBadge = record?.status ? (
		<Badge
			variant={
				record.status === MasterDataStatus.ACTIVE ? "success" : "secondary"
			}
			size="sm"
		>
			{record.status === MasterDataStatus.ACTIVE ? "正常在用" : "已停用"}
		</Badge>
	) : null;

	const docNumber = record?.id
		? `CUST-${record.id.slice(0, 8).toUpperCase()}`
		: undefined;

	return (
		<FormPage<CustomerFormData>
			mode={mode}
			title={(values) =>
				mode === "create"
					? "新建客户"
					: mode === "edit"
						? `编辑: ${values.name || record?.name || ""}`
						: `查看: ${record?.name || ""}`
			}
			tabTitle={
				mode === "create"
					? "新建客户"
					: mode === "edit"
						? `编辑: ${record?.name || "客户"}`
						: `客户: ${record?.name || "详情"}`
			}
			badge="客户"
			documentNumber={docNumber}
			statusBadge={statusBadge}
			sections={sections}
			initialValues={initialValues}
			schema={createCustomerSchema}
			subject={CustomerSubject}
			onBack={onBack}
			backUrl={backUrl}
			onSubmit={isView ? undefined : handleSubmit}
			submitText={mode === "create" ? "保存客户" : "保存更新"}
			cancelText="返回客户列表"
		/>
	);
}
