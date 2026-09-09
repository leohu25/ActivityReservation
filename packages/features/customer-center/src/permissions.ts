import { STANDARD_DATA_SCOPES, StandardAction } from "@chenrun/authorization";

export const CustomerAction = {
  ...StandardAction,
  AUDIT: "audit",
} as const;

export const CustomerSubject = "Customer";
export const CustomerStoreSubject = "CustomerStore";
export const CustomerCategorySubject = "CustomerCategory";
export const CustomerTagSubject = "CustomerTag";
export const CustomerQuoteSubject = "CustomerQuote";

export const CustomerResource = "customer";
export const CustomerStoreResource = "customer_store";
export const CustomerCategoryTagResource = "customer_category_tag";
export const CustomerQuoteResource = "customer_quote";

/** 客户中心受控权限定义 */
export const customerPermissionDefinitions = [
  {
    resource: CustomerResource,
    subject: CustomerSubject,
    label: "客户档案",
    actions: [
      CustomerAction.READ,
      CustomerAction.CREATE,
      CustomerAction.UPDATE,
      CustomerAction.DELETE,
    ] as const,
    actionMetadata: {
      [CustomerAction.READ]: {
        label: "查看客户",
        scopes: STANDARD_DATA_SCOPES,
      },
      [CustomerAction.CREATE]: {
        label: "新建客户",
      },
      [CustomerAction.UPDATE]: {
        label: "编辑客户/停用",
      },
      [CustomerAction.DELETE]: {
        label: "删除客户",
      },
    },
  },
  {
    resource: CustomerStoreResource,
    subject: CustomerStoreSubject,
    label: "门店档案",
    actions: [
      CustomerAction.READ,
      CustomerAction.CREATE,
      CustomerAction.UPDATE,
      CustomerAction.DELETE,
    ] as const,
    actionMetadata: {
      [CustomerAction.READ]: {
        label: "查看门店",
        scopes: STANDARD_DATA_SCOPES,
      },
      [CustomerAction.CREATE]: {
        label: "新建门店",
      },
      [CustomerAction.UPDATE]: {
        label: "编辑门店/停用",
      },
      [CustomerAction.DELETE]: {
        label: "删除门店",
      },
    },
  },
  {
    resource: CustomerCategoryTagResource,
    subject: CustomerCategorySubject,
    label: "分类与标签设置",
    actions: [
      CustomerAction.READ,
      CustomerAction.CREATE,
      CustomerAction.UPDATE,
      CustomerAction.DELETE,
    ] as const,
    actionMetadata: {
      [CustomerAction.READ]: {
        label: "查看分类标签",
      },
      [CustomerAction.CREATE]: {
        label: "新增分类/标签",
      },
      [CustomerAction.UPDATE]: {
        label: "编辑/启停",
      },
      [CustomerAction.DELETE]: {
        label: "删除分类/标签",
      },
    },
  },
  {
    resource: CustomerQuoteResource,
    subject: CustomerQuoteSubject,
    label: "门店报价单",
    actions: [
      CustomerAction.READ,
      CustomerAction.CREATE,
      CustomerAction.UPDATE,
      CustomerAction.AUDIT,
    ] as const,
    actionMetadata: {
      [CustomerAction.READ]: {
        label: "查看报价单",
        scopes: STANDARD_DATA_SCOPES,
      },
      [CustomerAction.CREATE]: {
        label: "拟定报价单",
      },
      [CustomerAction.UPDATE]: {
        label: "编辑/作废报价单",
      },
      [CustomerAction.AUDIT]: {
        label: "审核生效报价单",
      },
    },
  },
] as const;
