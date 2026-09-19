"use server";
import { StandardAction } from "@base/authorization";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import type { RolePermissionPayload } from "@base/authorization";
import {
  getTenantAdminContext,
  assertTenantAdminAbility,
} from "../../../assembly/context";
import { getServerAuthRuntime } from "@base/auth";
import { RoleManagementSubject } from "./contract";
import { TenantRoleService } from "../service";
import type { TenantRoleItem } from "../role-definition/types";

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
