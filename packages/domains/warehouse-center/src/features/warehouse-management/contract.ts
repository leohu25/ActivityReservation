import {
	StandardAction,
	type FeaturePagePermissionDescriptor,
} from "@base/authorization";

export const WarehouseSubject = "Warehouse";
export type WarehouseSubject = typeof WarehouseSubject;

export const WarehouseLocationSubject = "WarehouseLocation";
export type WarehouseLocationSubject = typeof WarehouseLocationSubject;

export const WarehouseAction = {
	...StandardAction,
} as const;

export const warehousePageContract: FeaturePagePermissionDescriptor = {
	resource: "warehouse_center.warehouse",
	subject: WarehouseSubject,
	label: "仓库与库位",
	path: "/warehouse/master",
	actions: [
		{ action: StandardAction.READ, label: "查看仓库" },
		{ action: StandardAction.CREATE, label: "新建仓库" },
		{ action: StandardAction.UPDATE, label: "修改仓库" },
		{ action: StandardAction.DELETE, label: "删除仓库" },
		{ action: StandardAction.EXPORT, label: "导出仓库" },
	],
};
