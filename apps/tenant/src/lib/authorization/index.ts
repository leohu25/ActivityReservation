import "server-only";
import {
  CaslAbilityFactory,
  createServerAbilityAdapter,
} from "@chenrun/authorization";
import {
  getServerAuthRuntime,
  getTenantContextForRequest,
  organizationAccessControl,
} from "@/lib/auth";
import { applicationPermissionCatalog } from "./catalog";

export { applicationPermissionCatalog } from "./catalog";
export const applicationServerAuthorization = createServerAbilityAdapter(
  applicationPermissionCatalog,
);

/** Builds an ability only from the trusted current request context. */
export async function getAbilityForRequest() {
  const context = await getTenantContextForRequest();
  return new CaslAbilityFactory(
    getServerAuthRuntime().tenantContextRepository,
    applicationPermissionCatalog,
    {
      staticRolePermissions:
        organizationAccessControl.applicationRolePermissions,
    },
  ).createForTenant(context);
}
