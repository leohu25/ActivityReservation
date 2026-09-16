import { StandardAction } from "@base/authorization";
import type { TenantFeatureManifest } from "@base/authorization";
import {
  CustomerSubject,
  customerPageContract,
} from "./features/customer-management/contract";
import {
  CustomerCategorySubject,
  CustomerTagSubject,
  customerCategoryPageContract,
  customerTagPageContract,
} from "./features/customer-management/classification/contract";
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
      pageKey: "customer-categories-tags",
      defaultLabel: "分类与标签",
      href: "/customer/categories-tags",
      defaultIcon: "Tags",
      requiredAction: StandardAction.READ,
      requiredSubject: CustomerCategorySubject,
      subjects: [CustomerCategorySubject, CustomerTagSubject],
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
