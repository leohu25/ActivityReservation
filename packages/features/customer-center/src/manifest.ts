import type { TenantFeatureManifest } from "@base/authorization";
import {
  CustomerSubject,
  customerPageContract,
} from "./features/customer-management/contract";
import {
  CustomerCategorySubject,
  categoryTagPageContract,
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
  order: 10,
  navSections: [
    {
      id: "customer",
      order: 10,
      items: [
        {
          id: "group-customer-center",
          label: "客户中心",
          icon: "UserCheck",
          items: [
            {
              id: "customer-customers",
              label: "客户档案",
              href: "/customer/customers",
              requiredAction: "read",
              requiredSubject: CustomerSubject,
            },
            {
              id: "customer-stores",
              label: "门店档案",
              href: "/customer/stores",
              requiredAction: "read",
              requiredSubject: CustomerStoreSubject,
            },
            {
              id: "customer-categories-tags",
              label: "分类与标签",
              href: "/customer/categories-tags",
              requiredAction: "read",
              requiredSubject: CustomerCategorySubject,
            },
            {
              id: "customer-quotes",
              label: "门店报价单",
              href: "/customer/quotes",
              requiredAction: "read",
              requiredSubject: CustomerQuoteSubject,
            },
          ],
        },
      ],
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
        categoryTagPageContract,
        quotePageContract,
      ],
    },
  ],
};
