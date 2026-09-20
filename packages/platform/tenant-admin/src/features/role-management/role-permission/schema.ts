import { z } from "@base/ui";

/**
 * 角色权限保存 Payload Schema (SSoT)
 */
export const saveRolePermissionsSchema = z.object({
  role: z.string().min(1, "角色标识不能为空"),
  payload: z.object({
    policies: z.array(
      z.object({
        resource: z.string().min(1),
        action: z.string().min(1),
        scope: z.string().optional(),
      }),
    ).optional(),
    fieldPolicies: z.record(z.string(), z.string()).optional(),
  }),
});

export type SaveRolePermissionsSchema = z.infer<
  typeof saveRolePermissionsSchema
>;
