"use server";

import { revalidatePath } from "next/cache";
import { getMigrationManagementService } from "./service";
import { requireControlAdminSession } from "../../shared/server/session";

/**
 * 触发平台控制数据库升级 Server Action
 */
export async function runPlatformMigrationAction(): Promise<{
  success: boolean;
  appliedCount?: number;
  appliedVersions?: string[];
  error?: string;
}> {
  try {
    const user = await requireControlAdminSession();
    const service = getMigrationManagementService();
    const result = await service.upgradePlatformDatabase(user);
    revalidatePath("/migrations");
    return { success: true, ...result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "平台升级失败";
    return { success: false, error: message };
  }
}

/**
 * 触发租户舰队批量或单租户升级 Server Action
 */
export async function runTenantFleetUpgradeAction(
  targetOrgId?: string,
): Promise<{
  success: boolean;
  upgradedCount?: number;
  failedCount?: number;
  error?: string;
}> {
  try {
    const user = await requireControlAdminSession();
    const service = getMigrationManagementService();
    const result = await service.upgradeTenantFleet(user, targetOrgId);
    revalidatePath("/migrations");
    return { success: true, ...result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "舰队升级失败";
    return { success: false, error: message };
  }
}
