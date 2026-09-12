import {
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@chenrun/authorization";

/** 基础设置实体与资源标识 (SSoT) */
export const GeneralSettingsSubject = "GeneralSettings";
export const GeneralSettingsResource = "settings.general";

/** 基础设置受控字段字典 */
export const GeneralSettingsField = {
  SYSTEM_NAME: "systemName",
  DEFAULT_PAGE_SIZE: "defaultPageSize",
  ORDER_PREFIX: "orderPrefix",
  DATE_FORMAT: "dateFormat",
  AMOUNT_PRECISION: "amountPrecision",
} as const;

export type GeneralSettingsField =
  (typeof GeneralSettingsField)[keyof typeof GeneralSettingsField];

/** 基础设置受控字段元数据定义 */
export const generalSettingsConfigurableFields = [
  {
    field: GeneralSettingsField.SYSTEM_NAME,
    label: "系统显示名称",
    isSensitive: false,
  },
  {
    field: GeneralSettingsField.DEFAULT_PAGE_SIZE,
    label: "默认分页大小",
    isSensitive: false,
  },
  {
    field: GeneralSettingsField.ORDER_PREFIX,
    label: "单据前缀规范",
    isSensitive: false,
  },
  {
    field: GeneralSettingsField.DATE_FORMAT,
    label: "日期显示格式",
    isSensitive: false,
  },
  {
    field: GeneralSettingsField.AMOUNT_PRECISION,
    label: "金额小数精度",
    isSensitive: false,
  },
] as const;

/**
 * 基础设置页面纯数据权限契约 (SSoT)
 */
export const generalSettingsPageContract: FeaturePagePermissionDescriptor = {
  resource: GeneralSettingsResource,
  subject: GeneralSettingsSubject,
  label: "基础设置",
  path: "/settings/general",
  actions: [
    { action: StandardAction.READ, label: "查看设置" },
    { action: StandardAction.UPDATE, label: "保存配置" },
  ],
  configurableFields: generalSettingsConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;
