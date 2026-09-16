import "server-only";
import { StandardAction } from "@base/authorization";

import { toPlainData } from "@base/shared";
import { getTenantAdminContext } from "../../assembly/context";
import { RoleManagementSubject, RoleSubject } from "./contract";
import { TenantRoleService } from "./service";
import type {
  ListRolesQueryInput,
  PaginatedRolesResult,
  TenantRoleItem,
} from "./types";
import type { TenantFeatureManifest } from "@base/authorization";
import { getServerAuthRuntime } from "@base/auth";

export async function listTenantRolesQuery(
  manifests?: readonly TenantFeatureManifest[],
): Promise<readonly TenantRoleItem[]> {
  const { organizationId, ability } = await getTenantAdminContext();
  const canReadOrgRole = ability.can(StandardAction.READ, RoleSubject);
  const canReadRoleSettings = ability.can(
    StandardAction.READ,
    RoleManagementSubject,
  );
  if (!canReadOrgRole && !canReadRoleSettings) {
    throw new Error("无权访问角色列表");
  }

  const runtime = getServerAuthRuntime();
  const service = new TenantRoleService(
    runtime.tenantContextRepository,
    manifests,
  );
  const roles = await service.listTenantRoles(organizationId);

  return toPlainData(roles);
}

/** 分页与按关键字检索角色列表 Server-side Query */
export async function searchTenantRolesQuery(
  params?: ListRolesQueryInput,
): Promise<PaginatedRolesResult> {
  const { organizationId, ability } = await getTenantAdminContext();
  const canReadOrgRole = ability.can(StandardAction.READ, RoleSubject);
  const canReadRoleSettings = ability.can(
    StandardAction.READ,
    RoleManagementSubject,
  );
  if (!canReadOrgRole && !canReadRoleSettings) {
    throw new Error("无权访问角色列表");
  }

  const runtime = getServerAuthRuntime();
  const service = new TenantRoleService(runtime.tenantContextRepository);
  const result = await service.searchTenantRoles(organizationId, params);

  return toPlainData(result);
}
