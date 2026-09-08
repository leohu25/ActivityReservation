import {
  createOrganizationAccessControl,
  createServerAuth,
  createTrustedTenantContextResolver,
  type ServerAuthRuntime,
} from "@chenrun/auth";
import { procurementStatement } from "@chenrun/feature-procurement-center/permissions";
import { headers } from "next/headers";

export const organizationAccessControl =
  createOrganizationAccessControl(procurementStatement);
let singleton: ServerAuthRuntime | undefined;

/** Application composition root for feature permissions and Better Auth. */
export function getServerAuthRuntime(): ServerAuthRuntime {
  if (singleton) {
    return singleton;
  }
  const databaseUrl = process.env.CONTROL_DATABASE_URL;
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!databaseUrl || !secret) {
    throw new Error("CONTROL_DATABASE_URL and BETTER_AUTH_SECRET are required");
  }
  singleton = createServerAuth({
    databaseUrl,
    secret,
    baseURL: process.env.BETTER_AUTH_URL,
    organizationAccessControl,
  });
  return singleton;
}

export function getServerAuth(): ServerAuthRuntime["auth"] {
  return getServerAuthRuntime().auth;
}

/** Trusted Next.js request entry; callers cannot supply session or tenant IDs. */
export async function getTenantContextForRequest() {
  const runtime = getServerAuthRuntime();
  return createTrustedTenantContextResolver({
    sessionReader: {
      getSession: (input) => runtime.auth.api.getSession(input),
    },
    repository: runtime.tenantContextRepository,
  })(await headers());
}
