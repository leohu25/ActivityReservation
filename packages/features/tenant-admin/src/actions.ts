"use server";

import { revalidatePath } from "next/cache";
import type { RolePermissionPayload } from "@chenrun/authorization";
import type { TenantRoleItem } from "./types";
import {
  getTenantRoleService,
  requireTenantAdminSession,
} from "./server/session";

/** 保存或更新角色四层权限 Server Action */
export async function saveRolePermissionsAction(
  role: string,
  payload: RolePermissionPayload,
): Promise<{ success: boolean; data?: TenantRoleItem; error?: string }> {
  try {
    const session = await requireTenantAdminSession();
    const service = getTenantRoleService();

    const data = await service.saveRolePermissions({
      organizationId: session.organizationId,
      role,
      payload,
    });

    revalidatePath("/settings/roles");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "保存角色权限失败";
    return { success: false, error: message };
  }
}

/** 新增自定义角色 Server Action */
export async function createRoleAction(
  roleCode: string,
  roleName?: string,
  description?: string,
): Promise<{ success: boolean; data?: TenantRoleItem; error?: string }> {
  try {
    const session = await requireTenantAdminSession();
    const service = getTenantRoleService();

    const data = await service.createRole({
      organizationId: session.organizationId,
      roleCode,
      roleName,
      description,
    });

    revalidatePath("/settings/roles");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "创建角色失败";
    return { success: false, error: message };
  }
}

/** 删除自定义角色 Server Action */
export async function deleteRoleAction(
  role: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireTenantAdminSession();
    const service = getTenantRoleService();

    await service.deleteRole(session.organizationId, role);

    revalidatePath("/settings/roles");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "删除角色失败";
    return { success: false, error: message };
  }
}
