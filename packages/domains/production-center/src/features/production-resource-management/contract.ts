import {
	StandardAction,
	type FeaturePagePermissionDescriptor,
} from "@base/authorization";

export const WorkshopSubject = "Workshop";
export type WorkshopSubject = typeof WorkshopSubject;
export const WorkshopResource = "production_center.workshop";
export type WorkshopResource = typeof WorkshopResource;

export const ProductionLineSubject = "ProductionLine";
export type ProductionLineSubject = typeof ProductionLineSubject;
export const ProductionLineResource = "production_center.production_line";
export type ProductionLineResource = typeof ProductionLineResource;

export const ProductionResourceAction = {
	...StandardAction,
} as const;

export const productionResourcePageContract: FeaturePagePermissionDescriptor = {
	resource: ProductionLineResource,
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

export const workshopPageContract: FeaturePagePermissionDescriptor = {
	resource: WorkshopResource,
	subject: WorkshopSubject,
	label: "生产车间管理",
	path: "/production/workshops",
	actions: [
		{ action: StandardAction.READ, label: "查看车间" },
		{ action: StandardAction.CREATE, label: "新建车间" },
		{ action: StandardAction.UPDATE, label: "修改车间" },
		{ action: StandardAction.DELETE, label: "删除车间" },
	],
};
