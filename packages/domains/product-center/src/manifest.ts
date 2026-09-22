import {
	StandardAction,
	type TenantFeatureManifest,
} from "@base/authorization";
import {
	ProductSubject,
	productPageContract,
} from "./features/product-management/contract";

export const productCenterManifest: TenantFeatureManifest = {
	id: "product-center",
	name: "商品中心",
	pages: [
		{
			pageKey: "product-master",
			defaultLabel: "商品物料档案",
			group: "商品中心",
			href: "/product/master",
			defaultIcon: "Package",
			requiredAction: StandardAction.READ,
			requiredSubject: ProductSubject,
		},
	],
	permissionModules: [
		{
			moduleKey: "product-center",
			label: "商品中心",
			iconName: "Package",
			order: 20,
			pages: [productPageContract],
		},
	],
};
