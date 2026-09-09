"use server";

import { revalidatePath } from "next/cache";
import type {
  ProvisionTenantInput,
  ProvisionTenantResult,
  MigrationDashboardData,
} from "./types";
import { getControlAdminService } from "./server/auth-runtime";
import { requireControlAdminSession } from "./server/session";

/**
 * 控制平面超管开通新租户 Server Action
 * 自包含在 @chenrun/feature-control-admin 垂直切片内部
 */
export async function provisionTenantAction(
  formData: FormData,
): Promise<{ success: boolean; data?: ProvisionTenantResult; error?: string }> {
  try {
    const name = (formData.get("name") as string)?.trim();
    const slug = (formData.get("slug") as string)?.trim().toLowerCase();
    const adminEmail = (formData.get("adminEmail") as string)?.trim();
    const adminName =
      (formData.get("adminName") as string)?.trim() || undefined;
    const clusterCode =
      (formData.get("clusterCode") as string)?.trim() || undefined;
    const initialPassword =
      (formData.get("initialPassword") as string)?.trim() || undefined;

    if (!name || !slug || !adminEmail) {
      return { success: false, error: "租户名称、Slug 和管理员邮箱为必填项" };
    }

    const input: ProvisionTenantInput = {
      name,
      slug,
      adminEmail,
      adminName,
      clusterCode,
      initialPassword,
    };

    const user = await requireControlAdminSession();
    const service = getControlAdminService();
    const result = await service.provisionTenant(input, user);

    revalidatePath("/");
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "未知开通错误";
    return { success: false, error: message };
  }
}

/**
 * 控制平面超管启停切换租户状态 Server Action
 * 自包含在 @chenrun/feature-control-admin 垂直切片内部
 */
export async function toggleTenantStatusAction(
  organizationId: string,
): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    const user = await requireControlAdminSession();
    const service = getControlAdminService();
    const nextStatus = await service.toggleTenantStatus(organizationId, user);

    revalidatePath("/");
    return { success: true, status: nextStatus };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "操作失败";
    return { success: false, error: message };
  }
}

/**
 * 获取平台与租户舰队数据迁移看板数据 Server Action
 */
export async function fetchMigrationDashboardAction(): Promise<{
  success: boolean;
  data?: MigrationDashboardData;
  error?: string;
}> {
  try {
    const user = await requireControlAdminSession();
    const service = getControlAdminService();
    const data = await service.getMigrationDashboard(user);
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "获取看板数据失败";
    return { success: false, error: message };
  }
}

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
    const service = getControlAdminService();
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
    const service = getControlAdminService();
    const result = await service.upgradeTenantFleet(user, targetOrgId);
    revalidatePath("/migrations");
    return { success: true, ...result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "舰队升级失败";
    return { success: false, error: message };
  }
}
