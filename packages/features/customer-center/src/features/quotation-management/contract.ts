import {
  STANDARD_DATA_SCOPES,
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@chenrun/authorization";

/** 门店报价单实体与资源标识 (SSoT) */
export const CustomerQuoteSubject = "CustomerQuote";
export const CustomerQuoteResource = "customer_quote";

/** 报价单受控字段定义 */
export const CustomerQuoteField = {
  QUOTE_ID: "quoteId",
  DISPLAY_NAME: "displayName",
  SCOPE_TYPE: "scopeType",
  EFFECTIVE_DATE: "effectiveDate",
  EXPIRY_DATE: "expiryDate",
  STATUS: "status",
} as const;

/** 报价单受控字段元数据定义 */
export const customerQuoteConfigurableFields = [
  { field: CustomerQuoteField.QUOTE_ID, label: "报价单号", isSensitive: false },
  {
    field: CustomerQuoteField.DISPLAY_NAME,
    label: "对外简称",
    isSensitive: false,
  },
  {
    field: CustomerQuoteField.SCOPE_TYPE,
    label: "定价适用维度",
    isSensitive: false,
  },
  {
    field: CustomerQuoteField.EFFECTIVE_DATE,
    label: "生效日期",
    isSensitive: false,
  },
  {
    field: CustomerQuoteField.EXPIRY_DATE,
    label: "失效日期",
    isSensitive: false,
  },
  { field: CustomerQuoteField.STATUS, label: "单据状态", isSensitive: false },
] as const;

/**
 * 客户中心 - 门店报价单页面纯数据权限契约 (SSoT)
 */
export const quotePageContract: FeaturePagePermissionDescriptor = {
  resource: CustomerQuoteResource,
  subject: CustomerQuoteSubject,
  label: "门店报价单",
  path: "/customer/quotes",
  actions: [
    {
      action: StandardAction.READ,
      label: "查看报价",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.CREATE, label: "新建报价单" },
    {
      action: StandardAction.UPDATE,
      label: "修改报价单",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    {
      action: "audit",
      label: "审核报价单",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.EXPORT, label: "导出报价单" },
  ],
  configurableFields: customerQuoteConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;
