import "server-only";
import { StandardAction } from "@base/authorization";

import { toPlainData } from "@base/shared";
import {
  getTenantAdminContext,
  assertTenantAdminAbility,
} from "../../assembly/context";
import { RoleManagementSubject } from "./contract";
import { TenantRoleService } from "./service";
import type { TenantRoleItem } from "./types";
import type { TenantFeatureManifest } from "@base/authorization";
import { getServerAuthRuntime } from "@base/auth";

export async function listTenantRolesQuery(
  manifests?: readonly TenantFeatureManifest[],
): Promise<readonly TenantRoleItem[]> {
  const { organizationId, ability } = await getTenantAdminContext();
  assertTenantAdminAbility(ability, StandardAction.READ, RoleManagementSubject);

  const runtime = getServerAuthRuntime();
  const service = new TenantRoleService(
    runtime.tenantContextRepository,
    manifests,
  );
  const roles = await service.listTenantRoles(organizationId);

  return toPlainData(roles);
}
