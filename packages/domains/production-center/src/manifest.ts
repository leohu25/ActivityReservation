import {
	StandardAction,
	type TenantFeatureManifest,
} from "@base/authorization";
import {
	ProductionLineSubject,
	productionResourcePageContract,
} from "./features/production-resource-management/contract";
import {
	OperationSubject,
	processPageContract,
} from "./features/process-management/contract";
import {
	BomSubject,
	bomPageContract,
} from "./features/bom-management/contract";

export const productionCenterManifest: TenantFeatureManifest = {
	id: "production-center",
	name: "生产中心",
	pages: [
		{
			pageKey: "production-bom",
			defaultLabel: "生产BOM管理",
			group: "生产中心",
			href: "/production/bom",
			defaultIcon: "Layers",
			requiredAction: StandardAction.READ,
			requiredSubject: BomSubject,
		},
		{
			pageKey: "production-resources",
			defaultLabel: "车间与产线",
			group: "生产中心",
			href: "/production/resources",
			defaultIcon: "Factory",
			requiredAction: StandardAction.READ,
			requiredSubject: ProductionLineSubject,
		},
		{
			pageKey: "process-operations",
			defaultLabel: "工序主数据",
			group: "生产中心",
			href: "/production/operations",
			defaultIcon: "GitFork",
			requiredAction: StandardAction.READ,
			requiredSubject: OperationSubject,
		},
	],
	permissionModules: [
		{
			moduleKey: "production-center",
			label: "生产中心",
			iconName: "Layers",
			order: 23,
			pages: [
				bomPageContract,
				productionResourcePageContract,
				processPageContract,
			],
		},
	],
};
