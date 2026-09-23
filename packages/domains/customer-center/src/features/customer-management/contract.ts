import { MasterDataStatus } from "@base/shared";
import {
	STANDARD_DATA_SCOPES,
	StandardAction,
	type FeaturePagePermissionDescriptor,
} from "@base/authorization";
import { defineListSearchParams } from "@base/ui";

export { MasterDataStatus };

/**
 * 列表 URL 契约（少即是多）：page/pageSize/keyword 由基座约定，业务只扩展默认值。
 * server-safe：RSC contract 可直接引用，无需 import nuqs parser。
 */
export const customerSearchParams = defineListSearchParams({
	categoryId: "",
	status: "",
});
export type CustomerSearchParams = Awaited<
	ReturnType<typeof customerSearchParams.parse>
>;

/** 客户主数据实体与资源标识 (SSoT) */
export const CustomerSubject = "Customer";
export type CustomerSubject = typeof CustomerSubject;
export const CustomerResource = "customer.customer";
export type CustomerResource = typeof CustomerResource;

/** 客户主数据受控字段字典 */
export const CustomerField = {
	NAME: "name",
	CATEGORY: "categoryId",
	CONTACT_PERSON: "contactPerson",
	CONTACT_PHONE: "contactPhone",
	SETTLEMENT_METHOD: "settlementMethod",
	DEFAULT_TAX_RATE: "defaultTaxRate",
	CREDIT_LIMIT: "creditLimit",
	STATUS: "status",
} as const;

export const CustomerAction = {
	...StandardAction,
	TOGGLE_STATUS: "toggle_status",
} as const;

/** 客户主数据受控字段元数据定义 */
export const customerConfigurableFields = [
	{ field: CustomerField.NAME, label: "客户名称", isSensitive: false },
	{ field: CustomerField.CATEGORY, label: "客户分类", isSensitive: false },
	{
		field: CustomerField.CONTACT_PERSON,
		label: "联系人姓名",
		isSensitive: false,
	},
	{
		field: CustomerField.CONTACT_PHONE,
		label: "联系人电话 (敏感)",
		isSensitive: true,
	},
	{
		field: CustomerField.SETTLEMENT_METHOD,
		label: "结算方式",
		isSensitive: false,
	},
	{
		field: CustomerField.DEFAULT_TAX_RATE,
		label: "默认税率",
		isSensitive: false,
	},
	{
		field: CustomerField.CREDIT_LIMIT,
		label: "授信额度 (敏感资产)",
		isSensitive: true,
	},
	{ field: CustomerField.STATUS, label: "客户状态", isSensitive: false },
] as const;

/**
 * 客户中心 - 客户档案页面纯数据权限契约 (SSoT)
 *
 * 规范：前台 CustomerView 页面组件与后台 manifest.ts 均唯一消费此契约，
 * 杜绝前后台在受控按钮、数据范围与受控字段上的声明脱节。
 */
export const customerPageContract: FeaturePagePermissionDescriptor = {
	resource: CustomerResource,
	subject: CustomerSubject,
	label: "客户档案",
	path: "/customer/customers",
	actions: [
		{
			action: StandardAction.READ,
			label: "查看客户",
			supportedScopes: STANDARD_DATA_SCOPES,
		},
		{ action: StandardAction.CREATE, label: "新建客户" },
		{ action: StandardAction.UPDATE, label: "修改客户" },
		{ action: StandardAction.DELETE, label: "删除客户" },
		{ action: CustomerAction.TOGGLE_STATUS, label: "启用/停用客户" },
		{ action: StandardAction.EXPORT, label: "导出客户列表" },
	],
	configurableFields: customerConfigurableFields.map((f) => ({
		field: f.field,
		label: f.label,
		sensitive: f.isSensitive,
	})),
} as const;
