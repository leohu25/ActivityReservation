import { z } from "@base/ui";

/**
 * 租户基础设施与企业信息更新校验 Schema
 */
export const updateCompanyProfileSchema = z.object({
  systemName: z
    .string()
    .trim()
    .min(1, "系统显示名称为必填项")
    .max(64, "系统显示名称不能超过 64 个字符")
    .default("企业数字化协同平台"),
  logoUrl: z
    .string()
    .trim()
    .max(1000, "Logo 链接不能超过 1000 个字符")
    .nullable()
    .optional(),
  companyName: z
    .string()
    .trim()
    .min(1, "企业全称为必填项")
    .max(128, "企业全称不能超过 128 个字符"),
  shortName: z
    .string()
    .trim()
    .max(64, "企业简称不能超过 64 个字符")
    .nullable()
    .optional(),
  creditCode: z
    .string()
    .trim()
    .max(32, "统一社会信用代码不能超过 32 个字符")
    .nullable()
    .optional(),
  legalPerson: z
    .string()
    .trim()
    .max(64, "法人代表不能超过 64 个字符")
    .nullable()
    .optional(),
  contactPhone: z
    .string()
    .trim()
    .max(32, "联系电话不能超过 32 个字符")
    .nullable()
    .optional(),
  contactEmail: z
    .string()
    .trim()
    .email()
    .or(z.literal(""))
    .nullable()
    .optional(),
  address: z
    .string()
    .trim()
    .max(256, "经营注册地址不能超过 256 个字符")
    .nullable()
    .optional(),
  timezone: z.string().trim().min(1, "时区设置不能为空").default("Asia/Shanghai").optional(),
  currency: z.string().trim().min(1, "币种设置不能为空").default("CNY").optional(),
});

export type UpdateCompanyProfileSchemaInput = z.infer<
  typeof updateCompanyProfileSchema
>;

/**
 * 租户基础通用偏好更新校验 Schema
 */
export const updateGeneralSettingsSchema = z.object({
  systemName: z
    .string()
    .trim()
    .min(1, "系统显示名称为必填项")
    .max(64, "系统显示名称不能超过 64 个字符")
    .default("企业数字化协同平台"),
  defaultPageSize: z
    .number()
    .int()
    .refine((val) => [10, 20, 50, 100].includes(val), {
      message: "默认分页大小必须为 10, 20, 50 或 100",
    })
    .default(10),
  orderPrefix: z
    .string()
    .trim()
    .min(1, "单据编号前缀不能为空")
    .max(16, "单据编号前缀不能超过 16 个字符")
    .default("DOC-"),
  dateFormat: z
    .string()
    .trim()
    .min(1, "日期格式不能为空")
    .default("YYYY-MM-DD"),
  amountPrecision: z.number().int().min(0).max(4).default(2),
});

export type UpdateGeneralSettingsSchemaInput = z.infer<
  typeof updateGeneralSettingsSchema
>;

/**
 * 租户安全策略更新校验 Schema
 */
export const updateSecuritySettingsSchema = z.object({
  sessionIdleTimeoutMinutes: z
    .number()
    .int()
    .refine((val) => [15, 30, 60, 480].includes(val), {
      message: "空闲超时策略必须为 15, 30, 60 或 480 分钟",
    })
    .default(60),
  forceChangeInitialPassword: z.boolean().default(true),
  passwordMinLength: z.number().int().min(6).max(32).default(8),
  requireSpecialChar: z.boolean().default(true),
});

export type UpdateSecuritySettingsSchemaInput = z.infer<
  typeof updateSecuritySettingsSchema
>;
