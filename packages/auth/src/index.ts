/**
 * @chenrun/auth
 * Better Auth 认证与 Organization 租户上下文契约
 */

export interface BetterAuthUser {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BetterAuthSession {
  id: string;
  userId: string;
  activeOrganizationId?: string;
  expiresAt: Date;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  roles: string[];
  createdAt: Date;
}

export interface AuthContext {
  user: BetterAuthUser;
  session: BetterAuthSession;
  organizationId: string;
  member: OrganizationMember;
}
