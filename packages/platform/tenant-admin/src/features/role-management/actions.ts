"use server";
import { StandardAction } from "@base/authorization";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import type { RolePermissionPayload } from "@base/authorization";
import {
  getTenantAdminContext,
  assertTenantAdminAbility,
} from "../../assembly/context";
import { getServerAuthRuntime } from "@base/auth";
import { RoleManagementSubject, RoleSubject } from "./contract";
import {
  parseCreateRoleInput,
  parseUpdateRoleInput,
  type CreateRoleSchema,
  type UpdateRoleSchema,
} from "./role.schema";
import { TenantRoleService } from "./service";
import type {
  ListRolesQueryInput,
  PaginatedRolesResult,
  TenantRoleItem,
} from "./types";

function getRoleService(): TenantRoleService {
  const runtime = getServerAuthRuntime();
  return new TenantRoleService(runtime.tenantContextRepository);
}

/** 查询租户角色列表 Server Action */
export const listRolesAction = defineServerAction(
  async (params?: ListRolesQueryInput): Promise<PaginatedRolesResult> => {
    const { organizationId, ability } = await getTenantAdminContext();
    const canReadOrgRoles = ability.can(StandardAction.READ, RoleSubject);
    const canReadRoleSettings = ability.can(
      StandardAction.READ,
      RoleManagementSubject,
    );
    if (!canReadOrgRoles && !canReadRoleSettings) {
      throw new Error("无权访问角色列表");
    }

    const service = getRoleService();
    return service.searchTenantRoles(organizationId, params);
  },
  "获取角色列表失败",
);

/** 保存或更新角色四层权限 Server Action */
export const saveRolePermissionsAction = defineServerAction(
  async (
    role: string,
    payload: RolePermissionPayload,
  ): Promise<TenantRoleItem> => {
    const { organizationId, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(
      ability,
      StandardAction.UPDATE,
      RoleManagementSubject,
    );
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

export interface UpdateRoleActionInput extends UpdateRoleSchema {
  roleCode: string;
}

/** 新增自定义角色 Server Action */
export const createRoleAction = defineServerAction(
  async (input: CreateRoleSchema): Promise<TenantRoleItem> => {
    const validated = parseCreateRoleInput(input);

    const { organizationId, ability } = await getTenantAdminContext();
    const canCreateOrgRole = ability.can(StandardAction.CREATE, RoleSubject);
    const canUpdateRoleMgmt = ability.can(
      StandardAction.UPDATE,
      RoleManagementSubject,
    );
    if (!canCreateOrgRole && !canUpdateRoleMgmt) {
      throw new Error("无权创建角色");
    }

    const service = getRoleService();

    const data = await service.createRole({
      organizationId,
      roleCode: validated.roleCode,
      roleName: validated.roleName,
      description: validated.description,
    });

    revalidatePath("/organization/roles");
    revalidatePath("/settings/roles");
    return data;
  },
  "创建角色失败",
);

/** 编辑更新自定义角色 Server Action */
export const updateRoleAction = defineServerAction(
  async (input: UpdateRoleActionInput): Promise<TenantRoleItem> => {
    const validated = parseUpdateRoleInput(input);

    const { organizationId, ability } = await getTenantAdminContext();
    const canUpdateOrgRole = ability.can(StandardAction.UPDATE, RoleSubject);
    const canUpdateRoleMgmt = ability.can(
      StandardAction.UPDATE,
      RoleManagementSubject,
    );
    if (!canUpdateOrgRole && !canUpdateRoleMgmt) {
      throw new Error("无权修改角色");
    }

    const service = getRoleService();

    const data = await service.updateRole({
      organizationId,
      roleCode: input.roleCode,
      roleName: validated.roleName,
      description: validated.description,
    });

    revalidatePath("/organization/roles");
    revalidatePath("/settings/roles");
    return data;
  },
  "更新角色失败",
);

/** 删除自定义角色 Server Action */
export const deleteRoleAction = defineServerAction(
  async (role: string): Promise<void> => {
    const { organizationId, ability } = await getTenantAdminContext();
    const canDeleteOrgRole = ability.can(StandardAction.DELETE, RoleSubject);
    const canUpdateRoleMgmt = ability.can(
      StandardAction.UPDATE,
      RoleManagementSubject,
    );
    if (!canDeleteOrgRole && !canUpdateRoleMgmt) {
      throw new Error("无权删除角色");
    }

    const service = getRoleService();

    await service.deleteRole(organizationId, role);

    revalidatePath("/organization/roles");
    revalidatePath("/settings/roles");
  },
  "删除角色失败",
);
