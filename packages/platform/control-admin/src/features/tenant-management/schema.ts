import { z } from "@base/ui";

/** 开通新租户与独立物理库校验 Schema (SSoT) */
export const provisionTenantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "租户名称为必填项")
    .max(50, "租户名称不能超过 50 个字符"),
  slug: z
    .string()
    .trim()
    .min(2, "租户标识 (Slug) 最少 2 个字符")
    .max(30, "租户标识不能超过 30 个字符")
    .regex(
      /^[a-z0-9-]+$/,
      "租户标识仅支持小写字母、数字和中划线 (-)，用于子域名或路由",
    ),
  adminAccount: z
    .string()
    .trim()
    .min(2, "管理员账号最少 2 个字符")
    .max(50, "管理员账号不能超过 50 个字符")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "管理员账号仅支持字母、数字、下划线与连字符",
    )
    .default("admin"),
  adminEmail: z
    .string()
    .trim()
    .email("请输入合法的管理员邮箱格式")
    .optional()
    .or(z.literal("")),
  adminName: z
    .string()
    .trim()
    .max(30, "管理员姓名不能超过 30 个字符")
    .optional()
    .default(""),
  clusterCode: z
    .string()
    .trim()
    .optional()
    .default("primary"),
  initialPassword: z
    .string()
    .optional()
    .default(""),
});

export type ProvisionTenantSchema = z.infer<typeof provisionTenantSchema>;

export const parseProvisionTenantInput = (raw: unknown): ProvisionTenantSchema =>
  provisionTenantSchema.parse(raw);
