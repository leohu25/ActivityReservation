"use server";
import { StandardAction } from "@base/authorization";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import {
  getTenantAdminContext,
  assertTenantAdminAbility,
} from "../../../assembly/context";
import { getServerAuthRuntime } from "@base/auth";
import { RoleSubject } from "./contract";
import {
  parseCreateRoleInput,
  parseUpdateRoleInput,
  type CreateRoleSchema,
  type UpdateRoleSchema,
} from "./schema";
import { TenantRoleService } from "../service";
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
    assertTenantAdminAbility(ability, StandardAction.READ, RoleSubject);

    const service = getRoleService();
    return service.searchTenantRoles(organizationId, params);
  },
  "获取角色列表失败",
);

export interface UpdateRoleActionInput extends UpdateRoleSchema {
  roleCode: string;
}

/** 新增自定义角色 Server Action */
export const createRoleAction = defineServerAction(
  async (input: CreateRoleSchema): Promise<TenantRoleItem> => {
    const validated = parseCreateRoleInput(input);
    const { organizationId, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.CREATE, RoleSubject);

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

/** 更新自定义角色 Server Action */
export const updateRoleAction = defineServerAction(
  async (input: UpdateRoleActionInput): Promise<TenantRoleItem> => {
    const validated = parseUpdateRoleInput(input);
    const { organizationId, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.UPDATE, RoleSubject);

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
  async (role: string): Promise<{ success: boolean }> => {
    const { organizationId, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.DELETE, RoleSubject);

    const service = getRoleService();
    await service.deleteRole(organizationId, role);

    revalidatePath("/organization/roles");
    revalidatePath("/settings/roles");
    return { success: true };
  },
  "删除角色失败",
);
