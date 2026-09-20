import { z } from "@base/ui";

/**
 * 租户迁移触发参数 Schema (SSoT)
 */
export const runTenantFleetUpgradeSchema = z.object({
  targetOrgId: z.string().optional(),
});

export type RunTenantFleetUpgradeSchema = z.infer<
  typeof runTenantFleetUpgradeSchema
>;
