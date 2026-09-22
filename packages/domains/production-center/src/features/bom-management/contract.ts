import {
	StandardAction,
	type FeaturePagePermissionDescriptor,
} from "@base/authorization";
import { defineListSearchParams } from "@base/ui";

/** BOM 受控实体标识 (SSoT) */
export const BomSubject = "Bom";
export type BomSubject = typeof BomSubject;

export const BomVersionSubject = "BomVersion";
export type BomVersionSubject = typeof BomVersionSubject;

export const ProductDefaultBomSubject = "ProductDefaultBom";
export type ProductDefaultBomSubject = typeof ProductDefaultBomSubject;

/** BOM 核心操作枚举 */
export const BomAction = {
	...StandardAction,
	PUBLISH: "publish",
	RETIRE: "retire",
	SET_DEFAULT: "set_default",
	CALCULATE: "calculate",
	EXPLODE: "explode",
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
	resource: "production_center.bom",
	subject: BomSubject,
	label: "生产BOM管理",
	path: "/production/bom",
	actions: [
		{ action: StandardAction.READ, label: "查看BOM列表与详情" },
		{ action: StandardAction.CREATE, label: "新建生产BOM" },
		{ action: StandardAction.UPDATE, label: "编辑生产BOM" },
		{ action: StandardAction.DELETE, label: "删除生产BOM" },
		{ action: BomAction.PUBLISH, label: "发布BOM版本" },
		{ action: BomAction.RETIRE, label: "退役BOM版本" },
		{ action: BomAction.SET_DEFAULT, label: "设置默认BOM" },
		{ action: BomAction.CALCULATE, label: "BOM试算" },
		{ action: BomAction.EXPLODE, label: "多级BOM展开" },
	],
};
