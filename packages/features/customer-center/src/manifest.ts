import {
  STANDARD_DATA_SCOPES,
  type TenantFeatureManifest,
} from "@chenrun/authorization";
import {
  CustomerAction,
  CustomerResource,
  CustomerSubject,
  CustomerStoreResource,
  CustomerStoreSubject,
  CustomerCategoryTagResource,
  CustomerCategorySubject,
  CustomerQuoteResource,
  CustomerQuoteSubject,
  customerConfigurableFields,
  customerStoreConfigurableFields,
  customerQuoteConfigurableFields,
  customerPermissionDefinitions,
} from "./permissions";

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
  permissions: customerPermissionDefinitions,
  permissionModules: [
    {
      moduleKey: "customer",
      label: "客户中心",
      iconName: "UserCheck",
      order: 10,
      pages: [
        {
          resource: CustomerResource,
          subject: CustomerSubject,
          label: "客户档案",
          path: "/customer/customers",
          actions: [
            {
              action: CustomerAction.READ,
              label: "查看客户",
              supportedScopes: STANDARD_DATA_SCOPES,
            },
            { action: CustomerAction.CREATE, label: "新建客户" },
            {
              action: CustomerAction.UPDATE,
              label: "修改客户",
              supportedScopes: STANDARD_DATA_SCOPES,
            },
            { action: CustomerAction.EXPORT, label: "导出数据" },
          ],
          configurableFields: customerConfigurableFields.map((f) => ({
            field: f.field,
            label: f.label,
            sensitive: f.isSensitive,
          })),
        },
        {
          resource: CustomerStoreResource,
          subject: CustomerStoreSubject,
          label: "门店档案",
          path: "/customer/stores",
          actions: [
            {
              action: CustomerAction.READ,
              label: "查看门店",
              supportedScopes: STANDARD_DATA_SCOPES,
            },
            { action: CustomerAction.CREATE, label: "新建门店" },
            {
              action: CustomerAction.UPDATE,
              label: "修改门店",
              supportedScopes: STANDARD_DATA_SCOPES,
            },
            { action: CustomerAction.EXPORT, label: "导出门店" },
          ],
          configurableFields: customerStoreConfigurableFields.map((f) => ({
            field: f.field,
            label: f.label,
            sensitive: f.isSensitive,
          })),
        },
        {
          resource: CustomerCategoryTagResource,
          subject: CustomerCategorySubject,
          label: "分类与标签",
          path: "/customer/categories-tags",
          actions: [
            { action: CustomerAction.READ, label: "查看分类/标签" },
            { action: CustomerAction.CREATE, label: "新建分类/标签" },
            { action: CustomerAction.UPDATE, label: "修改分类/标签" },
            { action: CustomerAction.DELETE, label: "删除分类/标签" },
          ],
        },
        {
          resource: CustomerQuoteResource,
          subject: CustomerQuoteSubject,
          label: "门店报价单",
          path: "/customer/quotes",
          actions: [
            {
              action: CustomerAction.READ,
              label: "查看报价",
              supportedScopes: STANDARD_DATA_SCOPES,
            },
            { action: CustomerAction.CREATE, label: "新建报价单" },
            {
              action: CustomerAction.UPDATE,
              label: "修改报价单",
              supportedScopes: STANDARD_DATA_SCOPES,
            },
            {
              action: CustomerAction.AUDIT,
              label: "审核报价单",
              supportedScopes: STANDARD_DATA_SCOPES,
            },
            { action: CustomerAction.EXPORT, label: "导出报价单" },
          ],
          configurableFields: customerQuoteConfigurableFields.map((f) => ({
            field: f.field,
            label: f.label,
            sensitive: f.isSensitive,
          })),
        },
      ],
    },
  ],
};
