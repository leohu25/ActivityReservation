import {
	StandardAction,
	STANDARD_DATA_SCOPES,
	type FeaturePagePermissionDescriptor,
} from "@base/authorization";
import { defineListSearchParams } from "@base/ui";

/** BOM 受控实体标识 (SSoT) */
export const BomSubject = "Bom";
export type BomSubject = typeof BomSubject;
export const BomResource = "production_center.bom";
export type BomResource = typeof BomResource;

export const BomVersionSubject = "BomVersion";
export type BomVersionSubject = typeof BomVersionSubject;
export const BomVersionResource = "production_center.bom_version";
export type BomVersionResource = typeof BomVersionResource;

export const ProductDefaultBomSubject = "ProductDefaultBom";
export type ProductDefaultBomSubject = typeof ProductDefaultBomSubject;
export const ProductDefaultBomResource = "production_center.product_default_bom";
export type ProductDefaultBomResource = typeof ProductDefaultBomResource;

/** BOM 核心操作枚举 */
export const BomAction = {
	...StandardAction,
	PUBLISH: "publish",
	SET_DEFAULT: "set_default",
} as const;

/** BOM 业务类型枚举 */
export const BOM_TYPES = {
	PROCESSING: "PROCESSING", // 单品加工 (主原料加工为成品)
	FORMULA: "FORMULA",       // 组合配方 (多原料组合为成品)
	PACKAGING: "PACKAGING",   // 包装装配 (散装物料与包材组成包装商品)
} as const;

export type BomType = (typeof BOM_TYPES)[keyof typeof BOM_TYPES];

export const BOM_TYPE_OPTIONS: readonly { readonly value: string; readonly label: string }[] = [
	{ value: "ALL", label: "全部" },
	{ value: BOM_TYPES.PROCESSING, label: "单品" },
	{ value: BOM_TYPES.FORMULA, label: "组合" },
	{ value: BOM_TYPES.PACKAGING, label: "包装" },
] as const;

/** 数量模式枚举 */
export const QUANTITY_MODES = {
	FIXED: "FIXED", // 固定数量模式
	RATIO: "RATIO", // 比例配方模式
} as const;

export type QuantityMode = (typeof QUANTITY_MODES)[keyof typeof QUANTITY_MODES];

/** BOM 版本状态枚举 */
export const BOM_VERSION_STATUS = {
	DRAFT: "DRAFT",         // 草稿 (可编辑)
	PUBLISHED: "PUBLISHED", // 已发布 (不可变，生产可用)
	RETIRED: "RETIRED",     // 已退役 (历史归档)
} as const;

export type BomVersionStatus = (typeof BOM_VERSION_STATUS)[keyof typeof BOM_VERSION_STATUS];

/** 物料角色枚举 */
export const MATERIAL_ROLES = {
	MAIN: "MAIN",                     // 主料
	AUXILIARY: "AUXILIARY",           // 辅料
	PACKAGING: "PACKAGING",           // 包材
	PROCESSING_AID: "PROCESSING_AID", // 加工助剂
} as const;

export type MaterialRole = (typeof MATERIAL_ROLES)[keyof typeof MATERIAL_ROLES];

/** 产出角色枚举 */
export const OUTPUT_ROLES = {
	PRIMARY: "PRIMARY",     // 主产品 (单版本严格唯一，即 BOM 商品)
	BYPRODUCT: "BYPRODUCT", // 联副产品
} as const;

export type OutputRole = (typeof OUTPUT_ROLES)[keyof typeof OUTPUT_ROLES];

/** 供应策略枚举 */
export const SUPPLY_POLICIES = {
	EXTERNAL: "EXTERNAL",               // 外购
	MAKE: "MAKE",                       // 生产自制
	PRODUCT_DEFAULT: "PRODUCT_DEFAULT", // 跟随商品默认方案
} as const;

export type SupplyPolicy = (typeof SUPPLY_POLICIES)[keyof typeof SUPPLY_POLICIES];

/** BOM 核心字段枚举 (消除魔法字符串) */
export const BomField = {
	CODE: "code",
	NAME: "name",
	BOM_TYPE: "bomType",
	VERSION_NUMBER: "versionNumber",
	PRODUCT_ID: "productId",
	PRODUCTION_LINE_ID: "productionLineId",
	STATUS: "status",
	IS_DEFAULT: "isDefault",
	QUANTITY_MODE: "quantityMode",
	TOTAL_YIELD_RATE: "totalYieldRate",
	DEFAULT_COOKED_YIELD_RATE: "defaultCookedYieldRate",
	MINIMUM_BATCH_QUANTITY: "minimumBatchQuantity",
	DESCRIPTION: "description",
} as const;

/** BOM 受控字段元数据定义（供角色权限工作台配置查看/编辑/隐藏策略） */
export const bomConfigurableFields = [
	{ field: BomField.CODE, label: "BOM编码", sensitive: false },
	{ field: BomField.NAME, label: "BOM名称", sensitive: false },
	{ field: BomField.BOM_TYPE, label: "BOM类型", sensitive: false },
	{ field: BomField.VERSION_NUMBER, label: "版本号", sensitive: false },
	{ field: BomField.PRODUCT_ID, label: "产出物料/商品", sensitive: false },
	{ field: BomField.PRODUCTION_LINE_ID, label: "所属产线", sensitive: false },
	{ field: BomField.STATUS, label: "版本状态", sensitive: false },
	{ field: BomField.IS_DEFAULT, label: "是否默认BOM", sensitive: false },
	{ field: BomField.QUANTITY_MODE, label: "用量模式", sensitive: false },
	{ field: BomField.TOTAL_YIELD_RATE, label: "综合成品率(%)", sensitive: true },
	{ field: BomField.DEFAULT_COOKED_YIELD_RATE, label: "熟制得率(%)", sensitive: true },
	{ field: BomField.MINIMUM_BATCH_QUANTITY, label: "起产批量/批量约束", sensitive: false },
	{ field: BomField.DESCRIPTION, label: "说明备注", sensitive: false },
] as const;

/** BOM 列表 URL 查询参数契约 (Nuqs 兼容) */
export const bomSearchParams = defineListSearchParams({
	bomType: "",
	categoryId: "",
	status: "",
});

export type BomSearchParams = Awaited<
	ReturnType<typeof bomSearchParams.parse>
>;

/** BOM 中心页面权限契约 (SSoT) */
export const bomPageContract: FeaturePagePermissionDescriptor = {
	resource: BomResource,
	subject: BomSubject,
	label: "生产BOM管理",
	path: "/production/bom",
	actions: [
		{
			action: StandardAction.READ,
			label: "查看BOM列表与详情",
			supportedScopes: STANDARD_DATA_SCOPES,
		},
		{ action: StandardAction.CREATE, label: "新建生产BOM" },
		{ action: StandardAction.UPDATE, label: "编辑生产BOM" },
		{ action: StandardAction.DELETE, label: "删除生产BOM" },
		{ action: BomAction.PUBLISH, label: "发布BOM版本" },
		{ action: BomAction.SET_DEFAULT, label: "设置默认BOM" },
	],
	configurableFields: bomConfigurableFields.map((f) => ({
		field: f.field,
		label: f.label,
		sensitive: f.sensitive,
	})),
};

export const bomVersionPageContract: FeaturePagePermissionDescriptor = {
	resource: BomVersionResource,
	subject: BomVersionSubject,
	label: "生产BOM版本明细",
	path: "/production/bom/versions",
	actions: [
		{ action: StandardAction.READ, label: "查看版本" },
		{ action: StandardAction.CREATE, label: "新建版本" },
		{ action: StandardAction.UPDATE, label: "修改版本" },
		{ action: StandardAction.DELETE, label: "删除版本" },
	],
};

export const productDefaultBomPageContract: FeaturePagePermissionDescriptor = {
	resource: ProductDefaultBomResource,
	subject: ProductDefaultBomSubject,
	label: "默认BOM配置",
	path: "/production/bom/defaults",
	actions: [
		{ action: StandardAction.READ, label: "查看默认配置" },
		{ action: StandardAction.UPDATE, label: "修改默认配置" },
	],
};
