import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient as GeneratedPrismaClient } from "@prisma/client";

export type TenantDatabaseStatus =
  | "PROVISIONING"
  | "ACTIVE"
  | "SUSPENDED"
  | "FAILED";

export interface OrganizationMemberRecord {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: Date;
}

export interface OrganizationRoleRecord {
  id: string;
  organizationId: string;
  role: string;
  permission: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface TenantDatabaseRecord {
  id: string;
  organizationId: string;
  clusterCode: string;
  databaseName: string;
  secretRef: string;
  schemaVersion: string;
  status: TenantDatabaseStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantContextRepository {
  findMember(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMemberRecord | null>;
  findTenantDatabase(
    organizationId: string,
  ): Promise<TenantDatabaseRecord | null>;
}

export interface AuthorizationRepository {
  findMember(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMemberRecord | null>;
  findOrganizationRoles(
    organizationId: string,
    roles: readonly string[],
  ): Promise<OrganizationRoleRecord[]>;
}

interface MemberDelegate {
  findUnique(args: {
    where: {
      organizationId_userId: {
        organizationId: string;
        userId: string;
      };
    };
  }): Promise<OrganizationMemberRecord | null>;
}

interface OrganizationRoleDelegate {
  findMany(args: {
    where: {
      organizationId: string;
      role: { in: string[] };
    };
  }): Promise<OrganizationRoleRecord[]>;
}

interface TenantDatabaseDelegate {
  findUnique(args: {
    where: { organizationId: string };
  }): Promise<TenantDatabaseRecord | null>;
}

export interface ControlPrismaRepositoryClient {
  member: MemberDelegate;
  organizationRole: OrganizationRoleDelegate;
  tenantDatabase: TenantDatabaseDelegate;
}

/** Thin repository adapter shared by tenant-context and tenant DB routing. */
export class PrismaControlDbRepository implements TenantContextRepository {
  constructor(private readonly client: ControlPrismaRepositoryClient) {}

  findMember(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMemberRecord | null> {
    return this.client.member.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });
  }

  findTenantDatabase(
    organizationId: string,
  ): Promise<TenantDatabaseRecord | null> {
    return this.client.tenantDatabase.findUnique({
      where: { organizationId },
    });
  }

  findOrganizationRoles(
    organizationId: string,
    roles: readonly string[],
  ): Promise<OrganizationRoleRecord[]> {
    if (roles.length === 0) {
      return Promise.resolve([]);
    }
    return this.client.organizationRole.findMany({
      where: {
        organizationId,
        role: { in: [...roles] },
      },
    });
  }
}

export type ControlPrismaClient = GeneratedPrismaClient;

/** Creates the saas_control client from a trusted server-side connection URL. */
export function createControlPrismaClient(
  databaseUrl: string,
): GeneratedPrismaClient {
  if (databaseUrl.trim().length === 0) {
    throw new Error("CONTROL_DATABASE_URL is required");
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new GeneratedPrismaClient({ adapter });
}
