import {
	StandardAction,
	type TenantFeatureManifest,
} from "@base/authorization";
import {
	WarehouseSubject,
	warehousePageContract,
} from "./features/warehouse-management/contract";

export const warehouseCenterManifest: TenantFeatureManifest = {
	id: "warehouse-center",
	name: "仓储中心",
	pages: [
		{
			pageKey: "warehouse-master",
			defaultLabel: "仓库与库位",
			group: "仓储中心",
			href: "/warehouse/master",
			defaultIcon: "Warehouse",
			requiredAction: StandardAction.READ,
			requiredSubject: WarehouseSubject,
		},
	],
	permissionModules: [
		{
			moduleKey: "warehouse-center",
			label: "仓储中心",
			iconName: "Warehouse",
			order: 22,
			pages: [warehousePageContract],
		},
	],
};
