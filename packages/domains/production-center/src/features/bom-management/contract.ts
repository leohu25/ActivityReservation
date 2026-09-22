import {
	StandardAction,
	type FeaturePagePermissionDescriptor,
} from "@base/authorization";

export const BomSubject = "Bom";
export type BomSubject = typeof BomSubject;

export const BomVersionSubject = "BomVersion";
export type BomVersionSubject = typeof BomVersionSubject;

export const ProductDefaultBomSubject = "ProductDefaultBom";
export type ProductDefaultBomSubject = typeof ProductDefaultBomSubject;

export const BomAction = {
	...StandardAction,
	PUBLISH: "publish",
	RETIRE: "retire",
	SET_DEFAULT: "set_default",
	CALCULATE: "calculate",
	EXPLODE: "explode",
} as const;

export const bomPageContract: FeaturePagePermissionDescriptor = {
	resource: "production_center.bom",
	subject: BomSubject,
	label: "生产BOM管理",
	path: "/production/bom",
	actions: [
		{ action: StandardAction.READ, label: "查看BOM" },
		{ action: StandardAction.CREATE, label: "新建BOM" },
		{ action: StandardAction.UPDATE, label: "修改BOM" },
		{ action: StandardAction.DELETE, label: "删除BOM" },
		{ action: BomAction.PUBLISH, label: "发布BOM" },
		{ action: BomAction.RETIRE, label: "废止BOM" },
		{ action: BomAction.SET_DEFAULT, label: "设置默认BOM" },
		{ action: BomAction.CALCULATE, label: "BOM试算" },
		{ action: BomAction.EXPLODE, label: "多级展开" },
	],
};
