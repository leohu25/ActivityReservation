import type {
  OrganizationMemberRecord,
  TenantContextRepository,
  TenantDatabaseRecord,
} from "@base/db-control";

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
  | "TENANT_DATABASE_INACTIVE"
  | "EMPLOYEE_PROFILE_NOT_FOUND"
  | "EMPLOYEE_SUSPENDED"
  | "EMPLOYEE_TERMINATED"
  | "EMPLOYEE_NOT_ACTIVE";

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
 * 员工档案简要状态模型 (用于租户准入门禁断言)
 */
export interface EmployeeProfileStatusInput {
  readonly status: string;
}

/**
 * 租户访问硬门禁 (Tenant Access Gate)
 * 严格基于企业员工档案状态断言租户业务系统的准入资格。
 * 若员工档案缺失、被停用 (SUSPENDED) 或已离职 (TERMINATED)，严格执行 Fail-Closed 阻断访问。
 */
export function assertTenantAccessGate(
  profile: EmployeeProfileStatusInput | null | undefined,
): void {
  if (!profile) {
    throw new TenantContextError(
      "EMPLOYEE_PROFILE_NOT_FOUND",
      "未检测到有效的企业员工档案，请联系管理员分配",
    );
  }

  if (profile.status === "SUSPENDED") {
    throw new TenantContextError(
      "EMPLOYEE_SUSPENDED",
      "您在该企业的员工账号已被暂停访问，请联系管理员",
    );
  }

  if (profile.status === "TERMINATED") {
    throw new TenantContextError(
      "EMPLOYEE_TERMINATED",
      "您已从该企业离职，无权访问内部业务数据",
    );
  }

  if (profile.status !== "ACTIVE") {
    throw new TenantContextError("EMPLOYEE_NOT_ACTIVE", "员工档案尚未激活");
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
