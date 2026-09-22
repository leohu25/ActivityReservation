import {
	StandardAction,
	type TenantFeatureManifest,
} from "@base/authorization";
import {
	SupplierSubject,
	supplierPageContract,
} from "./features/supplier-management/contract";

export const supplierCenterManifest: TenantFeatureManifest = {
	id: "supplier-center",
	name: "供应商中心",
	pages: [
		{
			pageKey: "supplier-master",
			defaultLabel: "供应商档案",
			group: "供应商中心",
			href: "/supplier/master",
			defaultIcon: "Truck",
			requiredAction: StandardAction.READ,
			requiredSubject: SupplierSubject,
		},
	],
	permissionModules: [
		{
			moduleKey: "supplier-center",
			label: "供应商中心",
			iconName: "Truck",
			order: 21,
			pages: [supplierPageContract],
		},
	],
};
