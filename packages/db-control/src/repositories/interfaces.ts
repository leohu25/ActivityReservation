import type {
  OrganizationMemberRecord,
  OrganizationRoleRecord,
  RecordMigrationFailureInput,
  RecordMigrationStartInput,
  RecordMigrationSuccessInput,
  TenantDatabaseRecord,
  TenantDatabaseStatus,
  TenantMigrationRecord,
} from "../contracts/records";

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
  listOrganizationRoles(
    organizationId: string,
  ): Promise<OrganizationRoleRecord[]>;
  upsertOrganizationRole(input: {
    organizationId: string;
    role: string;
    permission: string;
  }): Promise<OrganizationRoleRecord>;
  deleteOrganizationRole(organizationId: string, role: string): Promise<void>;
}

/** 多租户物理库迁移账本与开通仓库契约 */
export interface TenantMigrationRepository {
  recordMigrationStart(
    input: RecordMigrationStartInput,
  ): Promise<TenantMigrationRecord>;

  recordMigrationSuccess(
    input: RecordMigrationSuccessInput,
  ): Promise<TenantMigrationRecord>;

  recordMigrationFailure(
    input: RecordMigrationFailureInput,
  ): Promise<TenantMigrationRecord>;

  findMigrationHistory(
    organizationId: string,
  ): Promise<TenantMigrationRecord[]>;

  findLatestSuccessfulMigration(
    organizationId: string,
  ): Promise<TenantMigrationRecord | null>;

  findLatestFailedMigration(
    organizationId: string,
  ): Promise<TenantMigrationRecord | null>;

  listTenantDatabases(filter?: {
    status?: TenantDatabaseStatus;
  }): Promise<TenantDatabaseRecord[]>;

  upsertTenantDatabase(input: {
    organizationId: string;
    clusterCode: string;
    databaseName: string;
    secretRef: string;
    schemaVersion: string;
    status: TenantDatabaseStatus;
  }): Promise<TenantDatabaseRecord>;

  updateTenantDatabaseStatus(
    organizationId: string,
    status: TenantDatabaseStatus,
    schemaVersion?: string,
  ): Promise<TenantDatabaseRecord>;
}
