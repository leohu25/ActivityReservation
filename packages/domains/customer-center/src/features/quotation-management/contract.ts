import {
	STANDARD_DATA_SCOPES,
	StandardAction,
	type FeaturePagePermissionDescriptor,
} from "@base/authorization";
import { defineListSearchParams } from "@base/ui";

/**
 * 列表 URL 契约（少即是多）：page/pageSize/keyword 由基座约定，业务只扩展默认值。
 */
export const customerQuoteSearchParams = defineListSearchParams({
	quoteType: "",
	status: "",
});
export type CustomerQuoteSearchParams = Awaited<
	ReturnType<typeof customerQuoteSearchParams.parse>
>;

/** 门店报价单实体与资源标识 (SSoT) */
export const CustomerQuoteSubject = "CustomerQuote";
export type CustomerQuoteSubject = typeof CustomerQuoteSubject;
export const CustomerQuoteResource = "customer.quote";
export type CustomerQuoteResource = typeof CustomerQuoteResource;

export const CustomerQuoteAction = {
	...StandardAction,
	AUDIT: "audit",
} as const;

/** 报价单受控字段定义 */
export const CustomerQuoteField = {
	QUOTE_NO: "quoteNo",
	DISPLAY_NAME: "displayName",
	QUOTE_TYPE: "quoteType",
	EFFECTIVE_DATE: "effectiveDate",
	EXPIRY_DATE: "expiryDate",
	STATUS: "status",
} as const;

/** 报价单生命周期状态 (SSoT) */
export const CustomerQuoteStatus = {
	DRAFT: "DRAFT",
	ACTIVE: "ACTIVE",
	VOIDED: "VOIDED",
} as const;

export type CustomerQuoteStatus =
	(typeof CustomerQuoteStatus)[keyof typeof CustomerQuoteStatus];

/** 报价单受控字段元数据定义 */
export const customerQuoteConfigurableFields = [
	{ field: CustomerQuoteField.QUOTE_NO, label: "报价单号", isSensitive: false },
	{
		field: CustomerQuoteField.DISPLAY_NAME,
		label: "对外简称",
		isSensitive: false,
	},
	{
		field: CustomerQuoteField.QUOTE_TYPE,
		label: "报价单类型",
		isSensitive: false,
	},
	{
		field: CustomerQuoteField.EFFECTIVE_DATE,
		label: "生效日期",
		isSensitive: false,
	},
	{
		field: CustomerQuoteField.EXPIRY_DATE,
		label: "失效日期",
		isSensitive: false,
	},
	{ field: CustomerQuoteField.STATUS, label: "单据状态", isSensitive: false },
] as const;

/**
 * 客户中心 - 门店报价单页面纯数据权限契约 (SSoT)
 */
export const quotePageContract: FeaturePagePermissionDescriptor = {
	resource: CustomerQuoteResource,
	subject: CustomerQuoteSubject,
	label: "门店报价单",
	path: "/customer/quotes",
	actions: [
		{
			action: StandardAction.READ,
			label: "查看报价单",
			supportedScopes: STANDARD_DATA_SCOPES,
		},
		{ action: StandardAction.CREATE, label: "新建报价单" },
		{ action: StandardAction.UPDATE, label: "修改报价单" },
		{ action: CustomerQuoteAction.AUDIT, label: "审核/生效报价单" },
		{ action: StandardAction.DELETE, label: "作废报价单" },
		{ action: StandardAction.EXPORT, label: "导出报价单" },
	],
	configurableFields: customerQuoteConfigurableFields.map((f) => ({
		field: f.field,
		label: f.label,
		sensitive: f.isSensitive,
	})),
} as const;
