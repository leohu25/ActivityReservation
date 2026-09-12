import {
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";

/** 企业信息实体与资源标识 (SSoT) */
export const CompanyProfileSubject = "CompanyProfile";
export const CompanyProfileResource = "settings.company";

/** 企业信息受控字段字典 */
export const CompanyProfileField = {
  COMPANY_NAME: "companyName",
  SHORT_NAME: "shortName",
  CREDIT_CODE: "creditCode",
  LEGAL_PERSON: "legalPerson",
  CONTACT_PHONE: "contactPhone",
  CONTACT_EMAIL: "contactEmail",
  ADDRESS: "address",
  TIMEZONE: "timezone",
  CURRENCY: "currency",
} as const;

export type CompanyProfileField =
  (typeof CompanyProfileField)[keyof typeof CompanyProfileField];

/** 企业信息受控字段元数据定义 */
export const companyProfileConfigurableFields = [
  {
    field: CompanyProfileField.COMPANY_NAME,
    label: "企业全称",
    isSensitive: false,
  },
  {
    field: CompanyProfileField.SHORT_NAME,
    label: "企业简称",
    isSensitive: false,
  },
  {
    field: CompanyProfileField.CREDIT_CODE,
    label: "统一社会信用代码",
    isSensitive: false,
  },
  {
    field: CompanyProfileField.LEGAL_PERSON,
    label: "企业法定代表人",
    isSensitive: false,
  },
  {
    field: CompanyProfileField.CONTACT_PHONE,
    label: "联系电话 (敏感)",
    isSensitive: true,
  },
  {
    field: CompanyProfileField.CONTACT_EMAIL,
    label: "联系邮箱",
    isSensitive: false,
  },
  { field: CompanyProfileField.ADDRESS, label: "通讯地址", isSensitive: false },
  { field: CompanyProfileField.TIMEZONE, label: "时区", isSensitive: false },
  {
    field: CompanyProfileField.CURRENCY,
    label: "默认币种",
    isSensitive: false,
  },
] as const;

/**
 * 企业信息设置页面纯数据权限契约 (SSoT)
 */
export const companyProfilePageContract: FeaturePagePermissionDescriptor = {
  resource: CompanyProfileResource,
  subject: CompanyProfileSubject,
  label: "企业信息",
  path: "/settings/company",
  actions: [
    { action: StandardAction.READ, label: "查看信息" },
    { action: StandardAction.UPDATE, label: "修改资料" },
  ],
  configurableFields: companyProfileConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;

/** 兼容别名导出 */
export const companySettingsPageContract = companyProfilePageContract;
