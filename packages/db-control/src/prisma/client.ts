import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  type Prisma as ControlPrisma,
  PrismaClient as GeneratedPrismaClient,
} from "@prisma/client";
import type {
  OrganizationMemberRecord,
  OrganizationRoleRecord,
  RecordMigrationFailureInput,
  RecordMigrationStartInput,
  RecordMigrationSuccessInput,
  TenantDatabaseRecord,
  TenantDatabaseStatus,
  TenantMigrationRecord,
  TenantMigrationStatus,
} from "../contracts/records";
import type {
  AuthorizationRepository,
  TenantContextRepository,
  TenantMigrationRepository,
} from "../repositories/interfaces";

export interface MemberDelegate {
  findUnique(args: {
    where: {
      organizationId_userId: {
        organizationId: string;
        userId: string;
      };
    };
  }): Promise<OrganizationMemberRecord | null>;
}

export interface OrganizationRoleDelegate {
  findMany(args: {
    where: {
      organizationId: string;
      role?: { in: string[] };
    };
    orderBy?: {
      role?: "asc" | "desc";
    };
  }): Promise<OrganizationRoleRecord[]>;
  upsert(args: {
    where: {
      organizationId_role: {
        organizationId: string;
        role: string;
      };
    };
    create: {
      id: string;
      organizationId: string;
      role: string;
      permission: string;
    };
    update: {
      permission: string;
    };
  }): Promise<OrganizationRoleRecord>;
  delete(args: {
    where: {
      organizationId_role: {
        organizationId: string;
        role: string;
      };
    };
  }): Promise<unknown>;
}

export interface TenantDatabaseDelegate {
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

export interface TenantMigrationDelegate {
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

  /** 查询指定租户下的全部动态角色记录 */
  async listOrganizationRoles(
    organizationId: string,
  ): Promise<OrganizationRoleRecord[]> {
    return this.client.organizationRole.findMany({
      where: { organizationId },
      orderBy: { role: "asc" },
    });
  }

  /** 创建或更新租户下的角色权限定义 */
  async upsertOrganizationRole(input: {
    organizationId: string;
    role: string;
    permission: string;
  }): Promise<OrganizationRoleRecord> {
    return this.client.organizationRole.upsert({
      where: {
        organizationId_role: {
          organizationId: input.organizationId,
          role: input.role,
        },
      },
      create: {
        id: randomUUID(),
        organizationId: input.organizationId,
        role: input.role,
        permission: input.permission,
      },
      update: {
        permission: input.permission,
      },
    });
  }

  /** 删除租户下的指定动态角色 */
  async deleteOrganizationRole(
    organizationId: string,
    role: string,
  ): Promise<void> {
    await this.client.organizationRole.delete({
      where: {
        organizationId_role: {
          organizationId,
          role,
        },
      },
    });
  }

  /** 记录迁移任务已启动 */
  async recordMigrationStart(
    input: RecordMigrationStartInput,
  ): Promise<TenantMigrationRecord> {
    const migrationDelegate = this.ensureMigrationDelegate();
    return migrationDelegate.create({
      data: {
        organizationId: input.organizationId,
        migrationName: input.migrationName,
        version: input.version,
        batchId: input.batchId,
        status: "RUNNING",
        appliedSteps: input.appliedSteps ?? 0,
        startedAt: new Date(),
      },
    });
  }

  /** 记录迁移任务执行成功并原子同步租户物理库版本 */
  async recordMigrationSuccess(
    input: RecordMigrationSuccessInput,
  ): Promise<TenantMigrationRecord> {
    const migrationDelegate = this.ensureMigrationDelegate();

    const updatedMigration = await migrationDelegate.update({
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

    return updatedMigration;
  }

  /** 记录迁移任务执行失败 */
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

  /** 查询指定租户的全部物理迁移执行历史 */
  async findMigrationHistory(
    organizationId: string,
  ): Promise<TenantMigrationRecord[]> {
    const migrationDelegate = this.ensureMigrationDelegate();
    return migrationDelegate.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
  }

  /** 获取指定租户最后一次成功执行的迁移记录 */
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
export type { ControlPrisma };

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
