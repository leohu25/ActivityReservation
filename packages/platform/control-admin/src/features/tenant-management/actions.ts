"use server";

import { revalidatePath } from "next/cache";
import type {
  ProvisionTenantInput,
  ProvisionTenantResult,
  ControlTenantDetail,
  GetTenantMembersQuery,
  ResetTenantUserPasswordResult,
} from "./types";
import { getTenantManagementService } from "./service";
import { requireControlAdminSession } from "../../shared/server/session";

/**
 * 控制平面超管开通新租户 Server Action
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
    const service = getTenantManagementService();
    const result = await service.provisionTenant(input, user);

    revalidatePath("/tenants");
    revalidatePath("/");
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "未知开通错误";
    return { success: false, error: message };
  }
}

/**
 * 控制平面超管启停切换租户状态 Server Action
 */
export async function toggleTenantStatusAction(
  organizationId: string,
): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    const user = await requireControlAdminSession();
    const service = getTenantManagementService();
    const nextStatus = await service.toggleTenantStatus(organizationId, user);

    revalidatePath("/tenants");
    revalidatePath("/");
    return { success: true, status: nextStatus };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "操作失败";
    return { success: false, error: message };
  }
}

/**
 * 获取租户全景详情（包含物理库拓扑与成员列表，支持搜索过滤与分页）Server Action
 */
export async function getTenantDetailAction(
  organizationId: string,
  query?: GetTenantMembersQuery,
): Promise<{
  success: boolean;
  data?: ControlTenantDetail | null;
  error?: string;
}> {
  try {
    const user = await requireControlAdminSession();
    const service = getTenantManagementService();
    const data = await service.getTenantDetail(organizationId, user, query);
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "获取租户详情失败";
    return { success: false, error: message };
  }
}

/**
 * 控制平面超管重置租户成员密码 Server Action
 */
export async function resetTenantUserPasswordAction(
  organizationId: string,
  userId: string,
  customPassword?: string,
): Promise<{
  success: boolean;
  data?: ResetTenantUserPasswordResult;
  error?: string;
}> {
  try {
    const user = await requireControlAdminSession();
    const service = getTenantManagementService();
    const data = await service.resetTenantUserPassword(
      organizationId,
      userId,
      user,
      customPassword,
    );
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "重置密码失败";
    return { success: false, error: message };
  }
}
