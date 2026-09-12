"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import type { RolePermissionPayload } from "@base/authorization";
import {
  getTenantAdminContext,
  assertTenantAdminAbility,
} from "../../assembly/context";
import { getServerAuthRuntime } from "@base/auth";
import { RoleManagementSubject } from "./contract";
import { TenantRoleService, deriveBuiltInRoleDefaults } from "./service";
import type { TenantRoleItem } from "./types";

function getRoleService(): TenantRoleService {
  const runtime = getServerAuthRuntime();
  return new TenantRoleService(runtime.tenantContextRepository);
}

/** 保存或更新角色四层权限 Server Action */
export const saveRolePermissionsAction = defineServerAction(
  async (
    role: string,
    payload: RolePermissionPayload,
  ): Promise<TenantRoleItem> => {
    const { organizationId, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "update", RoleManagementSubject);
    const service = getRoleService();

    const data = await service.saveRolePermissions({
      organizationId,
      role,
      payload,
    });

    revalidatePath("/settings/roles");
    return data;
  },
  "保存角色权限失败",
);

/** 新增自定义角色 Server Action */
export const createRoleAction = defineServerAction(
  async (
    roleCode: string,
    roleName?: string,
    description?: string,
  ): Promise<TenantRoleItem> => {
    const { organizationId, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "update", RoleManagementSubject);
    const service = getRoleService();

    const data = await service.createRole({
      organizationId,
      roleCode,
      roleName,
      description,
    });

    revalidatePath("/settings/roles");
    return data;
  },
  "创建角色失败",
);

/** 删除自定义角色 Server Action */
export const deleteRoleAction = defineServerAction(
  async (role: string): Promise<void> => {
    const { organizationId, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "update", RoleManagementSubject);
    const service = getRoleService();

    await service.deleteRole(organizationId, role);

    revalidatePath("/settings/roles");
  },
  "删除角色失败",
);

/** 获取系统内置角色推荐权限模板 Server Action */
export const getSystemRoleDefaultsAction = defineServerAction(
  async (role: string): Promise<RolePermissionPayload> => {
    const { ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "read", RoleManagementSubject);
    const defaults = deriveBuiltInRoleDefaults();
    if (role === "admin") {
      return defaults.admin;
    }
    if (role === "member") {
      return defaults.member;
    }
    return { statement: {}, dataScopes: [], fieldPolicies: [] };
  },
  "获取推荐权限模板失败",
);
