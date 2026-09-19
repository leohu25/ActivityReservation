import { z } from "@base/ui";

/**
 * 创建业务角色 Schema (SSoT)
 */
export const createRoleSchema = z.object({
  roleCode: z
    .string()
    .min(2, "角色代码至少2个字符")
    .max(32, "角色代码最多32个字符")
    .regex(
      /^[a-z][a-z0-9_]{1,31}$/,
      "角色代码须以小写字母开头，仅由小写字母、数字与下划线组成",
    ),
  roleName: z
    .string()
    .min(1, "角色显示名称不能为空")
    .max(50, "角色显示名称最多50个字符"),
  description: z
    .string()
    .max(200, "角色描述最多200个字符")
    .optional()
    .default(""),
});

export type CreateRoleSchema = z.infer<typeof createRoleSchema>;

/**
 * 更新业务角色 Schema (SSoT)
 */
export const updateRoleSchema = z.object({
  roleName: z
    .string()
    .min(1, "角色显示名称不能为空")
    .max(50, "角色显示名称最多50个字符"),
  description: z
    .string()
    .max(200, "角色描述最多200个字符")
    .optional()
    .default(""),
});

export type UpdateRoleSchema = z.infer<typeof updateRoleSchema>;

export function parseCreateRoleInput(input: unknown): CreateRoleSchema {
  return createRoleSchema.parse(input);
}

export function parseUpdateRoleInput(input: unknown): UpdateRoleSchema {
  return updateRoleSchema.parse(input);
}
