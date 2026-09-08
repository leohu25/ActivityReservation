import type {
  OrganizationMemberRecord,
  TenantContextRepository,
  TenantDatabaseRecord,
} from "@chenrun/db-control";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
}

export interface AuthenticatedSession {
  id: string;
  userId: string;
  activeOrganizationId?: string | null;
  expiresAt: Date;
}

export interface AuthSessionInput {
  user: AuthenticatedUser | null;
  session: AuthenticatedSession | null;
}

export interface TenantContext {
  user: AuthenticatedUser;
  session: AuthenticatedSession;
  organizationId: string;
  member: OrganizationMemberRecord;
  database: TenantDatabaseRecord;
}

export type TenantContextErrorCode =
  | "UNAUTHENTICATED"
  | "ACTIVE_ORGANIZATION_REQUIRED"
  | "ORGANIZATION_MEMBERSHIP_REQUIRED"
  | "TENANT_DATABASE_NOT_FOUND"
  | "TENANT_DATABASE_INACTIVE";

export class TenantContextError extends Error {
  constructor(
    public readonly code: TenantContextErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "TenantContextError";
  }
}

/**
 * Resolves the tenant exclusively from a trusted Better Auth session.
 * Client-supplied tenant identifiers are intentionally not accepted.
 */
export async function resolveTenantContext(
  authSession: AuthSessionInput | null,
  repository: TenantContextRepository,
): Promise<TenantContext> {
  const user = authSession?.user;
  const session = authSession?.session;

  if (!user || !session || session.userId !== user.id) {
    throw new TenantContextError(
      "UNAUTHENTICATED",
      "A valid authenticated session is required",
    );
  }

  const organizationId = session.activeOrganizationId?.trim();
  if (!organizationId) {
    throw new TenantContextError(
      "ACTIVE_ORGANIZATION_REQUIRED",
      "The authenticated session has no active organization",
    );
  }

  const member = await repository.findMember(organizationId, user.id);
  if (!member) {
    throw new TenantContextError(
      "ORGANIZATION_MEMBERSHIP_REQUIRED",
      "The authenticated user is not a member of the active organization",
    );
  }

  const database = await repository.findTenantDatabase(organizationId);
  if (!database) {
    throw new TenantContextError(
      "TENANT_DATABASE_NOT_FOUND",
      "The active organization has no tenant database mapping",
    );
  }
  if (database.status !== "ACTIVE") {
    throw new TenantContextError(
      "TENANT_DATABASE_INACTIVE",
      "The active organization's tenant database is not active",
    );
  }

  return { user, session, organizationId, member, database };
}
