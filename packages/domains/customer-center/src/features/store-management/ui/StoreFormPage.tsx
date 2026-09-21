"use client";

import { useMemo, useCallback } from "react";
import {
	FormPage,
	Badge,
	useSafeRouter,
	updateTabTitle,
	type FormPageMode,
	type FormPageSection,
	type FormFieldSchema,
	toast,
} from "@base/ui";
import { createStoreAction, updateStoreAction } from "../actions";
import { CustomerStoreSubject, MasterDataStatus } from "../contract";
import { createStoreSchema } from "../schema";
import type { StoreListItem } from "../types";
import type { CustomerListItem } from "../../customer-management/types";

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

export const storeFormZodSchema = createStoreSchema;

export interface StoreFormPageProps {
	readonly mode?: FormPageMode;
	readonly record?: StoreListItem | null;
	readonly customers?: readonly CustomerListItem[];
	readonly onBack?: () => void;
	readonly backUrl?: string;
}

/**
 * 门店档案全屏单据工作台 (StoreFormPage)
 * - 高度物理内聚：字段分组、初始值装配与提交逻辑收敛于单一文件，践行“少即是多”
 * - 纯净响应式派生：无冗余本地状态，表单标题随输入与保存实时同步，对齐主流 ERP 交互范式
 */
export function StoreFormPage({
	mode = "create",
	record,
	customers = [],
	onBack,
	backUrl = "/customer/stores",
}: StoreFormPageProps) {
	const router = useSafeRouter();
	const isView = mode === "view";
	const isEdit = mode === "edit";

	// 初始值装配
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

	// 字段分组定义（工业风全屏分区分块）
	const sections = useMemo<FormPageSection[]>(() => {
		const isCreate = mode === "create";

		const baseFields: FormFieldSchema[] = [
			{
				name: "customerId",
				label: "所属客户企业",
				type: "select",
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
				type: "text",
				required: true,
				placeholder: "如: 绿叶餐饮(西湖银泰店)",
				span: isCreate ? 2 : 1,
			},
		];

		const deliveryFields: FormFieldSchema[] = [
			{
				name: "address",
				label: "配送收货详细地址",
				type: "text",
				required: true,
				span: 2,
				placeholder: "如: 杭州市上城区延安路98号B1层后厨收货通道",
			},
			{
				name: "contactPerson",
				label: "门店现场联系人",
				type: "text",
				required: true,
				placeholder: "如: 李厨师长",
			},
			{
				name: "contactPhone",
				label: "联系人电话",
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
				type: "select",
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
				type: "text",
				placeholder: "如: ROUTE_01_WEST",
			},
			{
				name: "defaultDriver",
				label: "默认配送司机",
				type: "text",
				placeholder: "如: 张师傅",
			},
		];

		const financeFields: FormFieldSchema[] = [
			{
				name: "billingContact",
				label: "财务对账对接人",
				type: "text",
				placeholder: "如: 对账会计姓名",
			},
			{
				name: "billingPhone",
				label: "财务对接电话",
				type: "text",
				placeholder: "如: 13800001111",
			},
		];

		return [
			{
				title: "基础归属",
				fields: baseFields,
				columns: 2,
			},
			{
				title: "现场联系与配送",
				fields: deliveryFields,
				columns: 2,
			},
			{
				title: "财务对接",
				fields: financeFields,
				columns: 2,
			},
		];
	}, [mode, isEdit, customers]);

	const handleSubmit = useCallback(
		async (values: StoreFormData) => {
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
					return;
				}
				toast.success("门店档案创建成功");

				// 对齐主流 ERP 范式：创建后无缝切换为已保存单据，留在当前 Tab 继续后续操作
				const created = res.data;
				if (created?.id) {
					updateTabTitle(`编辑: ${values.name}`);
					router?.replace(`/customer/stores/${created.id}?mode=edit`);
				}
			} else if (mode === "edit") {
				const targetId = record?.id;
				if (!targetId) {
					toast.error("缺少门店唯一标识，无法保存修改");
					return;
				}

				const res = await updateStoreAction(targetId, {
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
					toast.error(res.error || "更新门店档案失败");
					return;
				}
				toast.success("门店档案保存成功");

				// 保存成功后更新 Tab 标题为最新门店名，平滑留在当前页
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
		? record.id.startsWith("store-")
			? record.id.toUpperCase()
			: `STORE-${record.id.slice(0, 8).toUpperCase()}`
		: undefined;

	return (
		<FormPage<StoreFormData>
			mode={mode}
			title={(values) =>
				mode === "create"
					? "新建门店"
					: mode === "edit"
						? `编辑: ${values.name || record?.name || ""}`
						: `查看: ${record?.name || ""}`
			}
			tabTitle={
				mode === "create"
					? "新建门店"
					: mode === "edit"
						? `编辑: ${record?.name || "门店"}`
						: `门店: ${record?.name || "详情"}`
			}
			badge="门店"
			documentNumber={docNumber}
			statusBadge={statusBadge}
			sections={sections}
			initialValues={initialValues}
			schema={createStoreSchema}
			subject={CustomerStoreSubject}
			onBack={onBack}
			backUrl={backUrl}
			onSubmit={isView ? undefined : handleSubmit}
			submitText={mode === "create" ? "保存门店" : "保存更新"}
			cancelText="返回门店列表"
		/>
	);
}
