import type { TenantContextRepository } from "@base/db-control";
import {
 resolveTenantContext,
 type AuthSessionInput,
 type TenantContext,
} from "./tenant-context";

/** Minimal Better Auth server API surface required to read a signed session. */
export interface TrustedSessionReader {
 getSession(input: { headers: Headers }): Promise<AuthSessionInput | null>;
}

export interface TrustedTenantContextDependencies {
 sessionReader: TrustedSessionReader;
 repository: TenantContextRepository;
}

/**
 * Creates a server request resolver whose only request input is Headers.
 * The authenticated user/session always comes from Better Auth's server API.
 */
export function createTrustedTenantContextResolver(
 dependencies: TrustedTenantContextDependencies,
): (headers: Headers) => Promise<TenantContext> {
 return async (headers) => {
  const authSession = await dependencies.sessionReader.getSession({ headers });
  return resolveTenantContext(authSession, dependencies.repository);
 };
}
