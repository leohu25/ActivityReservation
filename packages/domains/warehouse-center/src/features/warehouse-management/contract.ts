import {
	StandardAction,
	type FeaturePagePermissionDescriptor,
} from "@base/authorization";

export const WarehouseSubject = "Warehouse";
export type WarehouseSubject = typeof WarehouseSubject;
export const WarehouseResource = "warehouse_center.warehouse";
export type WarehouseResource = typeof WarehouseResource;

export const WarehouseLocationSubject = "WarehouseLocation";
export type WarehouseLocationSubject = typeof WarehouseLocationSubject;
export const WarehouseLocationResource = "warehouse_center.warehouse_location";
export type WarehouseLocationResource = typeof WarehouseLocationResource;

export const WarehouseAction = {
	...StandardAction,
} as const;

export const warehousePageContract: FeaturePagePermissionDescriptor = {
	resource: WarehouseResource,
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

export const warehouseLocationPageContract: FeaturePagePermissionDescriptor = {
	resource: WarehouseLocationResource,
	subject: WarehouseLocationSubject,
	label: "库区库位管理",
	path: "/warehouse/locations",
	actions: [
		{ action: StandardAction.READ, label: "查看库位" },
		{ action: StandardAction.CREATE, label: "新建库位" },
		{ action: StandardAction.UPDATE, label: "修改库位" },
		{ action: StandardAction.DELETE, label: "删除库位" },
	],
};
