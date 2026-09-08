/** Better Auth configuration and trusted Organization tenant context. */

export {
  createOrganizationAccessControl,
  type ApplicationPermissionStatement,
  type OrganizationAccessControl,
} from "./access-control";
export {
  closeServerAuth,
  createServerAuth,
  getCurrentTenantContext,
  getServerAuth,
  getServerAuthRuntime,
  type ServerAuthOptions,
  type ServerAuthRuntime,
} from "./server";
export {
  createTrustedTenantContextResolver,
  type TrustedSessionReader,
  type TrustedTenantContextDependencies,
} from "./trusted-tenant-context";
export {
  TenantContextError,
  assertTenantAccessGate,
  assertEmployeeActive,
  resolveTenantContext,
  type AuthenticatedSession,
  type AuthenticatedUser,
  type EmployeeProfileStatusInput,
  type TenantContext,
  type TenantContextErrorCode,
} from "./tenant-context";
