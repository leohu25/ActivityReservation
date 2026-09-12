import {
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";

/** 安全设置实体与资源标识 (SSoT) */
export const SecuritySettingsSubject = "SecuritySettings";
export const SecuritySettingsResource = "settings.security";

/** 安全设置受控字段字典 */
export const SecuritySettingsField = {
  PASSWORD_MIN_LENGTH: "passwordMinLength",
  REQUIRE_SPECIAL_CHAR: "requireSpecialChar",
  REQUIRE_NUMBER: "requireNumber",
  PASSWORD_EXPIRE_DAYS: "passwordExpireDays",
  MAX_LOGIN_ATTEMPTS: "maxLoginAttempts",
  LOCKOUT_DURATION_MINS: "lockoutDurationMinutes",
  SESSION_TIMEOUT_MINS: "sessionTimeoutMinutes",
  ENABLE_MFA: "enableMfa",
} as const;

export type SecuritySettingsField =
  (typeof SecuritySettingsField)[keyof typeof SecuritySettingsField];

/** 安全设置受控字段元数据定义 */
export const securitySettingsConfigurableFields = [
  {
    field: SecuritySettingsField.PASSWORD_MIN_LENGTH,
    label: "密码最小长度",
    isSensitive: false,
  },
  {
    field: SecuritySettingsField.REQUIRE_SPECIAL_CHAR,
    label: "强制特殊字符",
    isSensitive: false,
  },
  {
    field: SecuritySettingsField.REQUIRE_NUMBER,
    label: "强制包含数字",
    isSensitive: false,
  },
  {
    field: SecuritySettingsField.PASSWORD_EXPIRE_DAYS,
    label: "密码过期轮换天数",
    isSensitive: false,
  },
  {
    field: SecuritySettingsField.MAX_LOGIN_ATTEMPTS,
    label: "连续登录错误封禁次数",
    isSensitive: false,
  },
  {
    field: SecuritySettingsField.LOCKOUT_DURATION_MINS,
    label: "账号临时锁定时长(分钟)",
    isSensitive: false,
  },
  {
    field: SecuritySettingsField.SESSION_TIMEOUT_MINS,
    label: "会话超时注销时间(分钟)",
    isSensitive: false,
  },
  {
    field: SecuritySettingsField.ENABLE_MFA,
    label: "强制全员双因子认证(MFA)",
    isSensitive: false,
  },
] as const;

/**
 * 安全设置页面纯数据权限契约 (SSoT)
 */
export const securitySettingsPageContract: FeaturePagePermissionDescriptor = {
  resource: SecuritySettingsResource,
  subject: SecuritySettingsSubject,
  label: "安全设置",
  path: "/settings/security",
  actions: [
    { action: StandardAction.READ, label: "查看安全策略" },
    { action: StandardAction.UPDATE, label: "修改策略" },
  ],
  configurableFields: securitySettingsConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;
