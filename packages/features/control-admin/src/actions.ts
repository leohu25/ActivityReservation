"use server";

import { revalidatePath } from "next/cache";
import type { ProvisionTenantInput, ProvisionTenantResult } from "./types";
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
