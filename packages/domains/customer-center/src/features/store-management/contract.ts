import {
	STANDARD_DATA_SCOPES,
	StandardAction,
	type FeaturePagePermissionDescriptor,
} from "@base/authorization";

/** 门店档案实体与资源标识 (SSoT) */
export const CustomerStoreSubject = "CustomerStore";
export type CustomerStoreSubject = typeof CustomerStoreSubject;
export const CustomerStoreResource = "customer.store";
export type CustomerStoreResource = typeof CustomerStoreResource;

/** 门店档案受控字段定义 */
export const CustomerStoreField = {
	NAME: "name",
	CUSTOMER_ID: "customerId",
	REGION_CODE: "regionCode",
	DELIVERY_PERIOD: "deliveryPeriod",
	ADDRESS: "address",
	CONTACT_PERSON: "contactPerson",
	CONTACT_PHONE: "contactPhone",
	STATUS: "status",
} as const;

/** 门店档案受控字段元数据定义 */
export const customerStoreConfigurableFields = [
	{
		field: CustomerStoreField.NAME,
		label: "门店名称",
		isSensitive: false,
	},
	{
		field: CustomerStoreField.CUSTOMER_ID,
		label: "所属客户",
		isSensitive: false,
	},
	{
		field: CustomerStoreField.REGION_CODE,
		label: "所属区域",
		isSensitive: false,
	},
	{
		field: CustomerStoreField.DELIVERY_PERIOD,
		label: "配送时段",
		isSensitive: false,
	},
	{ field: CustomerStoreField.ADDRESS, label: "配送地址", isSensitive: false },
	{
		field: CustomerStoreField.CONTACT_PERSON,
		label: "联系人姓名",
		isSensitive: false,
	},
	{
		field: CustomerStoreField.CONTACT_PHONE,
		label: "联系人电话 (敏感)",
		isSensitive: true,
	},
	{ field: CustomerStoreField.STATUS, label: "门店状态", isSensitive: false },
] as const;

/**
 * 客户中心 - 门店档案页面纯数据权限契约 (SSoT)
 */
export const storePageContract: FeaturePagePermissionDescriptor = {
	resource: CustomerStoreResource,
	subject: CustomerStoreSubject,
	label: "门店档案",
	path: "/customer/stores",
	actions: [
		{
			action: StandardAction.READ,
			label: "查看门店",
			supportedScopes: STANDARD_DATA_SCOPES,
		},
		{ action: StandardAction.CREATE, label: "新建门店" },
		{
			action: StandardAction.UPDATE,
			label: "修改门店",
			supportedScopes: STANDARD_DATA_SCOPES,
		},
		{ action: StandardAction.DELETE, label: "删除门店" },
		{ action: StandardAction.EXPORT, label: "导出门店" },
	],
	configurableFields: customerStoreConfigurableFields.map((f) => ({
		field: f.field,
		label: f.label,
		sensitive: f.isSensitive,
	})),
} as const;
