import { StandardAction } from "@base/authorization";
import type { TenantFeatureManifest } from "@base/authorization";
import {
	CustomerSubject,
	customerPageContract,
} from "./features/customer-management/contract";
import {
	CustomerCategorySubject,
	customerCategoryPageContract,
} from "./features/customer-management/category/contract";
import {
	CustomerTagSubject,
	customerTagPageContract,
} from "./features/customer-management/tag/contract";
import {
	CustomerStoreSubject,
	storePageContract,
} from "./features/store-management/contract";
import {
	CustomerQuoteSubject,
	quotePageContract,
} from "./features/quotation-management/contract";

export const customerManifest: TenantFeatureManifest = {
	id: "customer-center",
	name: "客户中心",
	pages: [
		{
			pageKey: "customer-customers",
			defaultLabel: "客户档案",
			href: "/customer/customers",
			defaultIcon: "Users",
			requiredAction: StandardAction.READ,
			requiredSubject: CustomerSubject,
		},
		{
			pageKey: "customer-stores",
			defaultLabel: "门店档案",
			href: "/customer/stores",
			defaultIcon: "Store",
			requiredAction: StandardAction.READ,
			requiredSubject: CustomerStoreSubject,
		},
		{
			pageKey: "customer-categories",
			defaultLabel: "客户分类",
			href: "/customer/categories",
			defaultIcon: "FolderTree",
			requiredAction: StandardAction.READ,
			requiredSubject: CustomerCategorySubject,
		},
		{
			pageKey: "customer-tags",
			defaultLabel: "业务标签",
			href: "/customer/tags",
			defaultIcon: "Tag",
			requiredAction: StandardAction.READ,
			requiredSubject: CustomerTagSubject,
		},
		{
			pageKey: "customer-quotes",
			defaultLabel: "门店报价单",
			href: "/customer/quotes",
			defaultIcon: "Receipt",
			requiredAction: StandardAction.READ,
			requiredSubject: CustomerQuoteSubject,
		},
	],
	permissionModules: [
		{
			moduleKey: "customer",
			label: "客户中心",
			iconName: "UserCheck",
			order: 10,
			pages: [
				customerPageContract,
				storePageContract,
				customerCategoryPageContract,
				customerTagPageContract,
				quotePageContract,
			],
		},
	],
};
