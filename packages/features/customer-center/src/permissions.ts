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

/** 客户主数据受控字段定义 */
export const CustomerField = {
  CUSTOMER_CODE: "customerCode",
  CUSTOMER_NAME: "customerName",
  CATEGORY: "categoryCode",
  CONTACT_PERSON: "contactPerson",
  CONTACT_PHONE: "contactPhone",
  SETTLEMENT_METHOD: "settlementMethod",
  DEFAULT_TAX_RATE: "defaultTaxRate",
  CREDIT_LIMIT: "creditLimit",
  STATUS: "status",
} as const;

export const customerConfigurableFields = [
  { field: CustomerField.CUSTOMER_CODE, label: "客户编码", isSensitive: false },
  { field: CustomerField.CUSTOMER_NAME, label: "客户名称", isSensitive: false },
  { field: CustomerField.CATEGORY, label: "客户分类", isSensitive: false },
  { field: CustomerField.CONTACT_PERSON, label: "联系人姓名", isSensitive: false },
  { field: CustomerField.CONTACT_PHONE, label: "联系人电话 (敏感)", isSensitive: true },
  { field: CustomerField.SETTLEMENT_METHOD, label: "结算方式", isSensitive: false },
  { field: CustomerField.DEFAULT_TAX_RATE, label: "默认税率", isSensitive: false },
  { field: CustomerField.CREDIT_LIMIT, label: "授信额度 (敏感资产)", isSensitive: true },
  { field: CustomerField.STATUS, label: "客户状态", isSensitive: false },
] as const;

/** 门店档案受控字段定义 */
export const CustomerStoreField = {
  STORE_CODE: "storeCode",
  STORE_NAME: "storeName",
  CUSTOMER_CODE: "customerCode",
  REGION_CODE: "regionCode",
  DELIVERY_PERIOD: "deliveryPeriod",
  ADDRESS: "address",
  CONTACT_PERSON: "contactPerson",
  CONTACT_PHONE: "contactPhone",
  STATUS: "status",
} as const;

export const customerStoreConfigurableFields = [
  { field: CustomerStoreField.STORE_CODE, label: "门店编码", isSensitive: false },
  { field: CustomerStoreField.STORE_NAME, label: "门店名称", isSensitive: false },
  { field: CustomerStoreField.CUSTOMER_CODE, label: "所属客户", isSensitive: false },
  { field: CustomerStoreField.REGION_CODE, label: "所属区域", isSensitive: false },
  { field: CustomerStoreField.DELIVERY_PERIOD, label: "配送时段", isSensitive: false },
  { field: CustomerStoreField.ADDRESS, label: "配送地址", isSensitive: false },
  { field: CustomerStoreField.CONTACT_PERSON, label: "联系人姓名", isSensitive: false },
  { field: CustomerStoreField.CONTACT_PHONE, label: "联系人电话 (敏感)", isSensitive: true },
  { field: CustomerStoreField.STATUS, label: "门店状态", isSensitive: false },
] as const;

/** 报价单受控字段定义 */
export const CustomerQuoteField = {
  QUOTE_ID: "quoteId",
  DISPLAY_NAME: "displayName",
  SCOPE_TYPE: "scopeType",
  EFFECTIVE_DATE: "effectiveDate",
  EXPIRY_DATE: "expiryDate",
  STATUS: "status",
} as const;

export const customerQuoteConfigurableFields = [
  { field: CustomerQuoteField.QUOTE_ID, label: "报价单号", isSensitive: false },
  { field: CustomerQuoteField.DISPLAY_NAME, label: "对外简称", isSensitive: false },
  { field: CustomerQuoteField.SCOPE_TYPE, label: "定价适用维度", isSensitive: false },
  { field: CustomerQuoteField.EFFECTIVE_DATE, label: "生效日期", isSensitive: false },
  { field: CustomerQuoteField.EXPIRY_DATE, label: "失效日期", isSensitive: false },
  { field: CustomerQuoteField.STATUS, label: "单据状态", isSensitive: false },
] as const;

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
    fields: customerConfigurableFields.map(({ field }) => field),
    actionMetadata: {
      [CustomerAction.READ]: {
        label: "查看客户",
        scopes: STANDARD_DATA_SCOPES,
        fields: customerConfigurableFields.map(({ field }) => field),
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
    fields: customerStoreConfigurableFields.map(({ field }) => field),
    actionMetadata: {
      [CustomerAction.READ]: {
        label: "查看门店",
        scopes: STANDARD_DATA_SCOPES,
        fields: customerStoreConfigurableFields.map(({ field }) => field),
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
    fields: customerQuoteConfigurableFields.map(({ field }) => field),
    actionMetadata: {
      [CustomerAction.READ]: {
        label: "查看报价单",
        scopes: STANDARD_DATA_SCOPES,
        fields: customerQuoteConfigurableFields.map(({ field }) => field),
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
