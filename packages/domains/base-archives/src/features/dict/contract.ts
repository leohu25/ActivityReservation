import {
	StandardAction,
	type FeaturePagePermissionDescriptor,
} from "@base/authorization";
import { defineListSearchParams } from "@base/ui";

/**
 * 系统通用数据字典类型常量定义 (SSoT)
 * 供系统各业务切片统一导入，保证全链路强类型与类型一致性
 */
export const DICT_TYPES = {
	// 客户与销售
	CUSTOMER_LEVEL: "CUSTOMER_LEVEL", // 客户级别 (如：战略客户、核心客户、普通客户)
	CUSTOMER_SOURCE: "CUSTOMER_SOURCE", // 客户来源 (如：线上广告、主动拜访、老客转介)
	INDUSTRY_TYPE: "INDUSTRY_TYPE", // 行业分类 (如：餐饮食品、电子电器、机械制造)

	// 业务标签
	CUSTOMER_TAG_TYPE: "CUSTOMER_TAG_TYPE", // 客户标签业务类型 (如：配送策略、结算方式、信用分级)
	TAG_BUSINESS_TYPE: "TAG_BUSINESS_TYPE", // 标签业务类型 (通用业务标签分类)

	// 财务与结算
	SETTLEMENT_TYPE: "SETTLEMENT_TYPE", // 结算方式 (如：现款现结、月结30天、预付款)
	INVOICE_TYPE: "INVOICE_TYPE", // 发票类型 (如：增值税专用发票、普通发票)

	// 物料与生产
	UNIT_MEASURE: "UNIT_MEASURE", // 计量单位 (如：件、公斤、米、箱)
	ORDER_PRIORITY: "ORDER_PRIORITY", // 订单优先级 (如：普通、急单、特急)
} as const;

export type DictType = (typeof DICT_TYPES)[keyof typeof DICT_TYPES] | (string & {});

/** 常用内置字典类型元数据列表（供前端下拉分类筛选与新建选择） */
export const DICT_TYPE_OPTIONS: readonly { readonly value: string; readonly label: string }[] = [
	{ value: DICT_TYPES.CUSTOMER_LEVEL, label: "客户级别 (CUSTOMER_LEVEL)" },
	{ value: DICT_TYPES.CUSTOMER_SOURCE, label: "客户来源 (CUSTOMER_SOURCE)" },
	{ value: DICT_TYPES.INDUSTRY_TYPE, label: "行业分类 (INDUSTRY_TYPE)" },
	{ value: DICT_TYPES.CUSTOMER_TAG_TYPE, label: "客户标签业务类型 (CUSTOMER_TAG_TYPE)" },
	{ value: DICT_TYPES.TAG_BUSINESS_TYPE, label: "标签业务类型 (TAG_BUSINESS_TYPE)" },
	{ value: DICT_TYPES.SETTLEMENT_TYPE, label: "结算方式 (SETTLEMENT_TYPE)" },
	{ value: DICT_TYPES.INVOICE_TYPE, label: "发票类型 (INVOICE_TYPE)" },
	{ value: DICT_TYPES.UNIT_MEASURE, label: "计量单位 (UNIT_MEASURE)" },
	{ value: DICT_TYPES.ORDER_PRIORITY, label: "订单优先级 (ORDER_PRIORITY)" },
];

/**
 * 字典项 URL 列表查询参数契约
 */
export const dictItemSearchParams = defineListSearchParams({
	type: "",
	status: "",
});

export type DictItemSearchParams = Awaited<
	ReturnType<typeof dictItemSearchParams.parse>
>;

/** 字典项资源与实体标识 (SSoT) */
export const TenantDictItemSubject = "TenantDictItem";
export type TenantDictItemSubject = typeof TenantDictItemSubject;

export const TenantDictItemResource = "base_archives.dict";
export type TenantDictItemResource = typeof TenantDictItemResource;

export const TenantDictItemAction = {
	...StandardAction,
	TOGGLE_STATUS: "toggle_status",
} as const;

export const TenantDictItemField = {
	TYPE: "type",
	CODE: "code",
	NAME: "name",
	STATUS: "status",
	SORT: "sort",
	IS_DEFAULT: "isDefault",
	REMARK: "remark",
} as const;

/** 字典项受控字段元数据定义 */
export const tenantDictItemConfigurableFields = [
	{ field: TenantDictItemField.TYPE, label: "字典类型", sensitive: false },
	{ field: TenantDictItemField.CODE, label: "字典项编码", sensitive: false },
	{ field: TenantDictItemField.NAME, label: "字典项名称", sensitive: false },
	{ field: TenantDictItemField.STATUS, label: "启停状态", sensitive: false },
	{ field: TenantDictItemField.SORT, label: "排序权重", sensitive: false },
	{ field: TenantDictItemField.IS_DEFAULT, label: "是否默认", sensitive: false },
	{ field: TenantDictItemField.REMARK, label: "备注说明", sensitive: false },
] as const;

export const tenantDictItemPageContract: FeaturePagePermissionDescriptor = {
	resource: TenantDictItemResource,
	subject: TenantDictItemSubject,
	label: "数据字典",
	path: "/archives/dict",
	actions: [
		{ action: StandardAction.READ, label: "查看字典项" },
		{ action: StandardAction.CREATE, label: "新建字典项" },
		{ action: StandardAction.UPDATE, label: "修改字典项" },
		{ action: StandardAction.DELETE, label: "删除字典项" },
		{ action: TenantDictItemAction.TOGGLE_STATUS, label: "启用/停用字典项" },
		{ action: StandardAction.EXPORT, label: "导出字典项" },
	],
	configurableFields: tenantDictItemConfigurableFields.map((f) => ({
		field: f.field,
		label: f.label,
		sensitive: f.sensitive,
	})),
} as const;
