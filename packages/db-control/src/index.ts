import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient as GeneratedPrismaClient } from "@prisma/client";

export type TenantDatabaseStatus =
  | "PROVISIONING"
  | "ACTIVE"
  | "SUSPENDED"
  | "FAILED";

/** 租户迁移状态枚举定义 */
export type TenantMigrationStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "ROLLED_BACK";

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

/** 租户数据库迁移账本实体契约 */
export interface TenantMigrationRecord {
  id: string;
  organizationId: string;
  migrationName: string;
  version: string;
  batchId?: string | null;
  status: TenantMigrationStatus;
  appliedSteps: number;
  errorMessage?: string | null;
  executionTimeMs?: number | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** 记录迁移开始输入参数 */
export interface RecordMigrationStartInput {
  organizationId: string;
  migrationName: string;
  version: string;
  batchId?: string;
  appliedSteps?: number;
}

/** 记录迁移成功输入参数 */
export interface RecordMigrationSuccessInput {
  migrationId: string;
  organizationId: string;
  appliedSteps: number;
  executionTimeMs: number;
  schemaVersion: string;
}

/** 记录迁移失败输入参数 */
export interface RecordMigrationFailureInput {
  migrationId: string;
  errorMessage: string;
  appliedSteps: number;
  executionTimeMs: number;
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
  findMany(args?: {
    where?: {
      status?: TenantDatabaseStatus;
      clusterCode?: string;
    };
  }): Promise<TenantDatabaseRecord[]>;
  update(args: {
    where: { organizationId: string };
    data: {
      status?: TenantDatabaseStatus;
      schemaVersion?: string;
    };
  }): Promise<TenantDatabaseRecord>;
  upsert(args: {
    where: { organizationId: string };
    create: {
      organizationId: string;
      clusterCode: string;
      databaseName: string;
      secretRef: string;
      schemaVersion: string;
      status: TenantDatabaseStatus;
    };
    update: {
      clusterCode?: string;
      databaseName?: string;
      secretRef?: string;
      schemaVersion?: string;
      status?: TenantDatabaseStatus;
    };
  }): Promise<TenantDatabaseRecord>;
}

interface TenantMigrationDelegate {
  create(args: {
    data: {
      organizationId: string;
      migrationName: string;
      version: string;
      batchId?: string | null;
      status: TenantMigrationStatus;
      appliedSteps: number;
      startedAt?: Date | null;
    };
  }): Promise<TenantMigrationRecord>;

  update(args: {
    where: { id: string };
    data: {
      status?: TenantMigrationStatus;
      appliedSteps?: number;
      errorMessage?: string | null;
      executionTimeMs?: number | null;
      finishedAt?: Date | null;
    };
  }): Promise<TenantMigrationRecord>;

  findMany(args: {
    where: {
      organizationId?: string;
      status?: TenantMigrationStatus;
      batchId?: string;
    };
    orderBy?: {
      createdAt?: "asc" | "desc";
    };
  }): Promise<TenantMigrationRecord[]>;

  findFirst(args: {
    where: {
      organizationId: string;
      status?: TenantMigrationStatus;
    };
    orderBy?: {
      createdAt: "desc";
    };
  }): Promise<TenantMigrationRecord | null>;
}

export interface ControlPrismaRepositoryClient {
  member: MemberDelegate;
  organizationRole: OrganizationRoleDelegate;
  tenantDatabase: TenantDatabaseDelegate;
  tenantMigration?: TenantMigrationDelegate;
}

/** 供租户上下文、路由与迁移账本共用的 Control DB 仓储适配器 */
export class PrismaControlDbRepository
  implements
    TenantContextRepository,
    AuthorizationRepository,
    TenantMigrationRepository
{
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

  /** 记录迁移开始并返回生成的处于 RUNNING 状态的迁移记录 */
  async recordMigrationStart(
    input: RecordMigrationStartInput,
  ): Promise<TenantMigrationRecord> {
    const migrationDelegate = this.ensureMigrationDelegate();
    return migrationDelegate.create({
      data: {
        organizationId: input.organizationId,
        migrationName: input.migrationName,
        version: input.version,
        batchId: input.batchId ?? null,
        status: "RUNNING",
        appliedSteps: input.appliedSteps ?? 0,
        startedAt: new Date(),
      },
    });
  }

  /** 记录迁移成功并同步更新租户库配置中的版本号 */
  async recordMigrationSuccess(
    input: RecordMigrationSuccessInput,
  ): Promise<TenantMigrationRecord> {
    const migrationDelegate = this.ensureMigrationDelegate();
    const updatedRecord = await migrationDelegate.update({
      where: { id: input.migrationId },
      data: {
        status: "SUCCESS",
        appliedSteps: input.appliedSteps,
        executionTimeMs: input.executionTimeMs,
        finishedAt: new Date(),
      },
    });

    await this.client.tenantDatabase.update({
      where: { organizationId: input.organizationId },
      data: {
        schemaVersion: input.schemaVersion,
        status: "ACTIVE",
      },
    });

    return updatedRecord;
  }

  /** 记录迁移失败详情 */
  async recordMigrationFailure(
    input: RecordMigrationFailureInput,
  ): Promise<TenantMigrationRecord> {
    const migrationDelegate = this.ensureMigrationDelegate();
    return migrationDelegate.update({
      where: { id: input.migrationId },
      data: {
        status: "FAILED",
        errorMessage: input.errorMessage,
        appliedSteps: input.appliedSteps,
        executionTimeMs: input.executionTimeMs,
        finishedAt: new Date(),
      },
    });
  }

  /** 查询指定租户的完整迁移历史（按创建时间正序） */
  async findMigrationHistory(
    organizationId: string,
  ): Promise<TenantMigrationRecord[]> {
    const migrationDelegate = this.ensureMigrationDelegate();
    return migrationDelegate.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
    });
  }

  /** 获取指定租户最后一次执行成功的迁移记录 */
  async findLatestSuccessfulMigration(
    organizationId: string,
  ): Promise<TenantMigrationRecord | null> {
    const migrationDelegate = this.ensureMigrationDelegate();
    return migrationDelegate.findFirst({
      where: {
        organizationId,
        status: "SUCCESS",
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /** 获取指定租户最后一次执行失败的迁移记录 */
  async findLatestFailedMigration(
    organizationId: string,
  ): Promise<TenantMigrationRecord | null> {
    const migrationDelegate = this.ensureMigrationDelegate();
    return migrationDelegate.findFirst({
      where: {
        organizationId,
        status: "FAILED",
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /** 查询符合条件的全部租户物理数据库配置 */
  async listTenantDatabases(filter?: {
    status?: TenantDatabaseStatus;
  }): Promise<TenantDatabaseRecord[]> {
    return this.client.tenantDatabase.findMany(
      filter?.status ? { where: { status: filter.status } } : undefined,
    );
  }

  /** 开通或更新租户数据库配置 */
  async upsertTenantDatabase(input: {
    organizationId: string;
    clusterCode: string;
    databaseName: string;
    secretRef: string;
    schemaVersion: string;
    status: TenantDatabaseStatus;
  }): Promise<TenantDatabaseRecord> {
    return this.client.tenantDatabase.upsert({
      where: { organizationId: input.organizationId },
      create: {
        organizationId: input.organizationId,
        clusterCode: input.clusterCode,
        databaseName: input.databaseName,
        secretRef: input.secretRef,
        schemaVersion: input.schemaVersion,
        status: input.status,
      },
      update: {
        clusterCode: input.clusterCode,
        databaseName: input.databaseName,
        secretRef: input.secretRef,
        schemaVersion: input.schemaVersion,
        status: input.status,
      },
    });
  }

  /** 更新租户物理库状态与版本号 */
  async updateTenantDatabaseStatus(
    organizationId: string,
    status: TenantDatabaseStatus,
    schemaVersion?: string,
  ): Promise<TenantDatabaseRecord> {
    const data: { status: TenantDatabaseStatus; schemaVersion?: string } = {
      status,
    };
    if (schemaVersion !== undefined) {
      data.schemaVersion = schemaVersion;
    }
    return this.client.tenantDatabase.update({
      where: { organizationId },
      data,
    });
  }

  /** 确保当前客户端已挂载 tenantMigration 委托 */
  private ensureMigrationDelegate(): TenantMigrationDelegate {
    if (!this.client.tenantMigration) {
      throw new Error("当前 Control DB 客户端未配置 tenantMigration 委托");
    }
    return this.client.tenantMigration;
  }
}

export type ControlPrismaClient = GeneratedPrismaClient;

/** 根据可信服务端连接串创建 Control DB Prisma 客户端 */
export function createControlPrismaClient(
  databaseUrl: string,
): GeneratedPrismaClient {
  if (databaseUrl.trim().length === 0) {
    throw new Error("CONTROL_DATABASE_URL is required");
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new GeneratedPrismaClient({ adapter });
}
