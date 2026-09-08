import "server-only";
import { getCurrentTenantContext } from "@chenrun/auth";
import { headers } from "next/headers";

/** Trusted Next.js request entry; callers cannot supply session or tenant IDs. */
export async function getTenantContextForRequest() {
  return getCurrentTenantContext(await headers());
}

export { getServerAuth, getServerAuthRuntime } from "@chenrun/auth";
