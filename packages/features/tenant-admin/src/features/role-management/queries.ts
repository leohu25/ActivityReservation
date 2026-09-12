import "server-only";

import { toPlainData } from "@chenrun/shared";
import {
  getTenantAdminContext,
  assertTenantAdminAbility,
} from "../../assembly/context";
import { RoleManagementSubject } from "./contract";
import { TenantRoleService } from "./service";
import type { TenantRoleItem } from "./types";
import type { TenantFeatureManifest } from "@chenrun/authorization";
import { getServerAuthRuntime } from "@chenrun/auth";

export async function listTenantRolesQuery(
  manifests?: readonly TenantFeatureManifest[],
): Promise<readonly TenantRoleItem[]> {
  const { organizationId, ability } = await getTenantAdminContext();
  assertTenantAdminAbility(ability, "read", RoleManagementSubject);

  const runtime = getServerAuthRuntime();
  const service = new TenantRoleService(
    runtime.tenantContextRepository,
    manifests,
  );
  const roles = await service.listTenantRoles(organizationId);

  return toPlainData(roles);
}
