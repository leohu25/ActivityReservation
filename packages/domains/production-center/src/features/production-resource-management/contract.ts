import {
	StandardAction,
	type FeaturePagePermissionDescriptor,
} from "@base/authorization";

export const WorkshopSubject = "Workshop";
export type WorkshopSubject = typeof WorkshopSubject;

export const ProductionLineSubject = "ProductionLine";
export type ProductionLineSubject = typeof ProductionLineSubject;

export const ProductionResourceAction = {
	...StandardAction,
} as const;

export const productionResourcePageContract: FeaturePagePermissionDescriptor = {
	resource: "production_center.resource",
	subject: ProductionLineSubject,
	label: "车间与产线",
	path: "/production/resources",
	actions: [
		{ action: StandardAction.READ, label: "查看产线" },
		{ action: StandardAction.CREATE, label: "新建产线" },
		{ action: StandardAction.UPDATE, label: "修改产线" },
		{ action: StandardAction.DELETE, label: "删除产线" },
	],
};
