"use server";

import { revalidatePath } from "next/cache";
import type { RolePermissionPayload } from "@chenrun/authorization";
import type {
  CompanyProfileData,
  GeneralSettingsData,
  SecuritySettingsData,
  TenantRoleItem,
  UpdateCompanyProfileInput,
  UpdateGeneralSettingsInput,
  UpdateSecuritySettingsInput,
} from "./types";
import {
  getTenantRoleService,
  getTenantSettingsService,
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

/** 获取企业信息 Server Action */
export async function getCompanyProfileAction(): Promise<{
  success: boolean;
  data?: CompanyProfileData;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const service = getTenantSettingsService();
    const data = await service.getCompanyProfile(session.organizationId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "获取企业信息失败";
    return { success: false, error: message };
  }
}

/** 更新企业信息 Server Action */
export async function updateCompanyProfileAction(
  input: UpdateCompanyProfileInput,
): Promise<{
  success: boolean;
  data?: CompanyProfileData;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const service = getTenantSettingsService();
    const data = await service.updateCompanyProfile(
      session.organizationId,
      input,
    );
    revalidatePath("/settings/company");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "更新企业信息失败";
    return { success: false, error: message };
  }
}

/** 获取系统基础设置 Server Action */
export async function getGeneralSettingsAction(): Promise<{
  success: boolean;
  data?: GeneralSettingsData;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const service = getTenantSettingsService();
    const data = await service.getGeneralSettings(session.organizationId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "获取基础设置失败";
    return { success: false, error: message };
  }
}

/** 更新系统基础设置 Server Action */
export async function updateGeneralSettingsAction(
  input: UpdateGeneralSettingsInput,
): Promise<{
  success: boolean;
  data?: GeneralSettingsData;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const service = getTenantSettingsService();
    const data = await service.updateGeneralSettings(
      session.organizationId,
      input,
    );
    revalidatePath("/settings/general");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "更新基础设置失败";
    return { success: false, error: message };
  }
}

/** 获取安全策略设置 Server Action */
export async function getSecuritySettingsAction(): Promise<{
  success: boolean;
  data?: SecuritySettingsData;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const service = getTenantSettingsService();
    const data = await service.getSecuritySettings(session.organizationId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "获取安全设置失败";
    return { success: false, error: message };
  }
}

/** 更新安全策略设置 Server Action */
export async function updateSecuritySettingsAction(
  input: UpdateSecuritySettingsInput,
): Promise<{
  success: boolean;
  data?: SecuritySettingsData;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const service = getTenantSettingsService();
    const data = await service.updateSecuritySettings(
      session.organizationId,
      input,
    );
    revalidatePath("/settings/security");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "更新安全设置失败";
    return { success: false, error: message };
  }
}
