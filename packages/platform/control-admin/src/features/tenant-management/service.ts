import { generateUuidV7, resolvePagination } from "@base/shared";
import {
  PrismaControlDbRepository,
  TenantDatabaseStatus,
  type ControlPrisma,
  type ControlPrismaClient,
} from "@base/db-control";
import {
  TenantDatabaseSeeder,
  createDefaultPgSqlExecutorFactory,
} from "@base/db-tenant";
import {
  DatabaseMigrationService,
  TenantDatabaseProvisioner,
  type ProvisionTenantDatabaseResult,
} from "@tool/db-migrate";
import { hashPassword } from "better-auth/crypto";
import {
  StandardAction,
  serializeRolePermissions,
  type RolePermissionPayload,
} from "@base/authorization";
import { assertControlAdmin } from "../../shared/server/control-guard";
import type {
  ControlTenantItem,
  ProvisionTenantInput,
  ProvisionTenantResult,
  ControlTenantDetail,
  ControlTenantMember,
  GetTenantMembersQuery,
  ResetTenantUserPasswordResult,
  ListTenantsQueryInput,
  PagedTenantsResult,
} from "./types";

import { getControlAuthRuntime } from "../../shared/server/auth-runtime";

export interface TenantManagementServiceOptions {
  readonly prisma: ControlPrismaClient;
  readonly adminDatabaseUrl?: string;
  readonly provisioner?: TenantDatabaseProvisioner;
  readonly seeder?: TenantDatabaseSeeder;
}

let tenantServiceSingleton: TenantManagementService | undefined;

export function getTenantManagementService(): TenantManagementService {
  if (tenantServiceSingleton) {
    return tenantServiceSingleton;
  }
  const runtime = getControlAuthRuntime();
  tenantServiceSingleton = TenantManagementService.create({
    prisma: runtime.prisma,
  });
  return tenantServiceSingleton;
}

/**
 * 租户全生命周期与物理独立库管理核心服务 (Tenant Management Service)
 */
export class TenantManagementService {
  constructor(
    private readonly prisma: ControlPrismaClient,
    private readonly provisioner?: TenantDatabaseProvisioner,
    readonly seeder?: TenantDatabaseSeeder,
  ) {}

  static create(
    options: TenantManagementServiceOptions,
  ): TenantManagementService {
    if (options.provisioner) {
      return new TenantManagementService(
        options.prisma,
        options.provisioner,
        options.seeder,
      );
    }

    const adminDbUrl =
      options.adminDatabaseUrl ?? process.env.CONTROL_DATABASE_URL;

    if (!adminDbUrl) {
      throw new Error(
        "缺少 CONTROL_DATABASE_URL 环境变量，数据库未连接！请检查配置文件是否就绪。",
      );
    }

    const sqlExecutorFactory = createDefaultPgSqlExecutorFactory();
    const seeder =
      options.seeder ?? new TenantDatabaseSeeder(sqlExecutorFactory);

    const secretResolver = {
      resolveDatabaseUrl: async (secretRef: string): Promise<string> => {
        if (secretRef.startsWith("env:")) {
          return process.env[secretRef.slice(4)] ?? "";
        }
        if (secretRef.startsWith("url:")) {
          return secretRef.slice(4);
        }
        try {
          const url = new URL(adminDbUrl);
          url.pathname = `/${secretRef}`;
          return url.toString();
        } catch {
          return "";
        }
      },
    };

    const repo = new PrismaControlDbRepository(options.prisma);
    const migrationService = new DatabaseMigrationService({
      controlDatabaseUrl: adminDbUrl,
      repository: repo,
      secretResolver,
      sqlExecutorFactory,
      seeder,
    });

    return new TenantManagementService(
      options.prisma,
      migrationService.tenantProvisioner,
      seeder,
    );
  }

  /**
   * 查询全部租户列表及其物理数据库与迁移信息（向后兼容全量查询）
   */
  async listTenants(operatorUser: {
    email?: string | null;
  }): Promise<ControlTenantItem[]> {
    const res = await this.listTenantsPaged(operatorUser);
    return res.data as ControlTenantItem[];
  }

  /**
   * 租户运维中心 - 真实后端分页与筛选查询 (Database-driven Paged Query)
   */
  async listTenantsPaged(
    operatorUser: { email?: string | null },
    params?: ListTenantsQueryInput,
  ): Promise<PagedTenantsResult> {
    assertControlAdmin(operatorUser);

    const { skip, take } = resolvePagination(params, {
      defaultPageSize: 10,
    });

    const kw = params?.keyword?.trim();
    const status = params?.status?.trim();

    // 构建过滤条件
    const where: ControlPrisma.OrganizationWhereInput = {};

    if (kw) {
      where.OR = [
        { name: { contains: kw, mode: "insensitive" } },
        { slug: { contains: kw, mode: "insensitive" } },
        {
          tenantDatabase: {
            is: {
              databaseName: { contains: kw, mode: "insensitive" },
            },
          },
        },
      ];
    }

    if (status) {
      where.tenantDatabase = {
        is: {
          status: status as TenantDatabaseStatus,
        },
      };
    }

    const [total, orgs] = await Promise.all([
      this.prisma.organization.count({ where }),
      this.prisma.organization.findMany({
        where,
        include: {
          tenantDatabase: true,
          members: {
            select: { id: true },
          },
          migrations: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    const data: ControlTenantItem[] = orgs.map((org) => {
      const db = org.tenantDatabase;
      const latestMig = org.migrations[0];

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        createdAt: org.createdAt,
        memberCount: org.members.length,
        database: db
          ? {
              databaseName: db.databaseName,
              clusterCode: db.clusterCode,
              schemaVersion: db.schemaVersion,
              status: db.status,
              updatedAt: db.updatedAt,
            }
          : null,
        latestMigration: latestMig
          ? {
              version: latestMig.version,
              migrationName: latestMig.migrationName,
              status: latestMig.status,
              appliedSteps: latestMig.appliedSteps,
            }
          : null,
      };
    });

    return { data, total };
  }

  /**
   * 查询指定租户的完整详情，包含独立物理数据库拓扑与全体成员列表（支持搜索过滤与分页）
   */
  async getTenantDetail(
    orgId: string,
    operatorUser: { email?: string | null },
    query?: GetTenantMembersQuery,
  ): Promise<ControlTenantDetail | null> {
    assertControlAdmin(operatorUser);

    const search = query?.search?.trim().toLowerCase();
    const page = Math.max(1, query?.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, query?.pageSize ?? 10));

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        tenantDatabase: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!org) {
      return null;
    }

    let filteredMembers = org.members;
    if (search) {
      filteredMembers = filteredMembers.filter((m) => {
        const name = (m.user.name ?? "").toLowerCase();
        const email = m.user.email.toLowerCase();
        const role = m.role.toLowerCase();
        return (
          name.includes(search) ||
          email.includes(search) ||
          role.includes(search)
        );
      });
    }

    const sortedMembers = [...filteredMembers].sort((a, b) => {
      const getRoleWeight = (role: string) => {
        if (role === "owner") return 0;
        if (role === "admin") return 1;
        return 2;
      };
      return getRoleWeight(a.role) - getRoleWeight(b.role);
    });

    const total = sortedMembers.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedMembers = sortedMembers.slice(
      startIndex,
      startIndex + pageSize,
    );

    const members: ControlTenantMember[] = paginatedMembers.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name || "未命名用户",
      email: m.user.email,
      image: m.user.image,
      role: m.role,
      createdAt: m.createdAt,
    }));

    const db = org.tenantDatabase;

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      createdAt: org.createdAt,
      authorizationVersion: org.authorizationVersion,
      database: db
        ? {
            id: db.id,
            databaseName: db.databaseName,
            clusterCode: db.clusterCode,
            secretRef: db.secretRef,
            schemaVersion: db.schemaVersion,
            status: db.status,
            createdAt: db.createdAt,
            updatedAt: db.updatedAt,
          }
        : null,
      members,
      memberPagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
    };
  }

  /**
   * 控制平面管理员开通新租户并自动化创建物理数据库与初始化迁移
   */
  async provisionTenant(
    input: ProvisionTenantInput,
    operatorUser: { email?: string | null },
  ): Promise<ProvisionTenantResult> {
    assertControlAdmin(operatorUser);

    const cleanName = input.name.trim();
    const cleanSlug = input.slug.trim().toLowerCase();
    const cleanEmail = input.adminEmail.trim().toLowerCase();

    if (!cleanName || !cleanSlug || !cleanEmail) {
      throw new Error("租户名称、Slug 标识与管理员邮箱均为必填项");
    }

    if (!/^[a-z0-9_-]{2,32}$/.test(cleanSlug)) {
      throw new Error(
        "租户 Slug 必须由 2-32 位小写字母、数字、下划线或连字符组成",
      );
    }

    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug: cleanSlug },
    });
    if (existingOrg) {
      throw new Error(`租户 Slug [${cleanSlug}] 已存在，请更换`);
    }

    let adminUser = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!adminUser) {
      adminUser = await this.prisma.user.create({
        data: {
          id: generateUuidV7(),
          email: cleanEmail,
          name: input.adminName?.trim() || cleanEmail.split("@")[0],
          emailVerified: true,
        },
      });
    }

    const initialPassword = input.initialPassword ?? "Admin123456!";
    const hashedPassword = await hashPassword(initialPassword);

    const existingAccount = await this.prisma.account.findFirst({
      where: {
        userId: adminUser.id,
        providerId: "credential",
      },
    });

    if (!existingAccount) {
      await this.prisma.account.create({
        data: {
          id: generateUuidV7(),
          accountId: adminUser.id,
          providerId: "credential",
          userId: adminUser.id,
          password: hashedPassword,
        },
      });
    }

    const orgId = generateUuidV7();
    const ownerMemberId = generateUuidV7();
    const ownerUserId = adminUser.id;
    const ownerName = adminUser.name;
    const defaultRoles: Array<{
      role: string;
      payload: RolePermissionPayload;
    }> = [
      {
        role: "owner",
        payload: {
          statement: {
            "customer.customer": [
              StandardAction.READ,
              StandardAction.CREATE,
              StandardAction.UPDATE,
              StandardAction.DELETE,
              StandardAction.EXPORT,
            ],
            "customer.store": [
              StandardAction.READ,
              StandardAction.CREATE,
              StandardAction.UPDATE,
              StandardAction.DELETE,
              StandardAction.EXPORT,
            ],
            "customer.quote": [
              StandardAction.READ,
              StandardAction.CREATE,
              StandardAction.UPDATE,
              StandardAction.DELETE,
              StandardAction.EXPORT,
            ],
          },
          dataScopes: [{ resource: "customer.customer", scopeType: "ALL" }],
          fieldPolicies: [],
        },
      },
      {
        role: "admin",
        payload: {
          statement: {
            "customer.customer": [
              StandardAction.READ,
              StandardAction.CREATE,
              StandardAction.UPDATE,
              StandardAction.DELETE,
              StandardAction.EXPORT,
            ],
            "customer.store": [
              StandardAction.READ,
              StandardAction.CREATE,
              StandardAction.UPDATE,
              StandardAction.DELETE,
              StandardAction.EXPORT,
            ],
            "customer.quote": [
              StandardAction.READ,
              StandardAction.CREATE,
              StandardAction.UPDATE,
              StandardAction.DELETE,
              StandardAction.EXPORT,
            ],
          },
          dataScopes: [
            { resource: "customer.customer", scopeType: "DEPT_TREE" },
          ],
          fieldPolicies: [],
        },
      },
      {
        role: "buyer",
        payload: {
          statement: {
            "customer.customer": [StandardAction.READ, StandardAction.CREATE],
            "customer.store": [StandardAction.READ],
            "customer.quote": [StandardAction.READ, StandardAction.CREATE],
          },
          dataScopes: [
            {
              resource: "customer.customer",
              action: StandardAction.READ,
              scopeType: "DEPT",
            },
          ],
          fieldPolicies: [],
        },
      },
    ];

    // Prisma / Next.js 推荐的 Interactive Transaction：开启事务后在回调内完成全部 Control 侧写入
    const organization = await this.prisma.$transaction(async (tx) => {
      const created = await tx.organization.create({
        data: {
          id: orgId,
          name: cleanName,
          slug: cleanSlug,
          members: {
            create: {
              id: ownerMemberId,
              userId: ownerUserId,
              role: "owner",
            },
          },
        },
      });

      // 独立租户凭证入库：无论平台 User 是否已存在，在当前租户下建立独立的 TenantAccount
      // 账号完全忠实于用户输入（支持自定义账号、手机号、邮箱、工号），严禁擅自截断或篡改！
      await tx.tenantAccount.create({
        data: {
          id: generateUuidV7(),
          organizationId: created.id,
          account: cleanEmail,
          password: hashedPassword,
          name: ownerName,
          memberId: ownerMemberId,
          status: "ACTIVE",
        },
      });

      for (const r of defaultRoles) {
        await tx.organizationRole.upsert({
          where: {
            organizationId_role: {
              organizationId: created.id,
              role: r.role,
            },
          },
          create: {
            id: generateUuidV7(),
            organizationId: created.id,
            role: r.role,
            permission: serializeRolePermissions(r.payload),
          },
          update: {
            permission: serializeRolePermissions(r.payload),
          },
        });
      }

      return created;
    });

    const clusterCode = input.clusterCode ?? "primary";
    const databaseName = `tenant_${cleanSlug.replace(/-/g, "_")}`;
    const adminDbUrl =
      process.env.CONTROL_DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/saas_control";

    const seedInput = {
      organizationId: organization.id,
      organizationName: cleanName,
      ownerUserId,
      ownerMemberId,
      ownerName,
      ownerEmail: cleanEmail,
    };

    if (this.provisioner) {
      try {
        const provisionResult: ProvisionTenantDatabaseResult =
          await this.provisioner.provision({
            organizationId: organization.id,
            clusterCode,
            databaseName,
            adminDatabaseUrl: adminDbUrl,
            secretRef: databaseName,
            seedInput,
          });

        return {
          organizationId: organization.id,
          slug: cleanSlug,
          databaseName: provisionResult.databaseName,
          status: provisionResult.status,
          initialPassword,
        };
      } catch (error) {
        // 物理库开通/种子失败时补偿删除 Control 元数据，避免租户列表残留脏记录
        await this.prisma.organization
          .delete({ where: { id: organization.id } })
          .catch(() => undefined);
        throw error instanceof Error
          ? error
          : new Error(`租户物理库开通失败: ${String(error)}`);
      }
    }

    const dbRecord = await this.prisma.tenantDatabase.create({
      data: {
        organizationId: organization.id,
        clusterCode,
        databaseName,
        secretRef: databaseName,
        schemaVersion: "baseline",
        status: "ACTIVE",
      },
    });

    return {
      organizationId: organization.id,
      slug: cleanSlug,
      databaseName: dbRecord.databaseName,
      status: dbRecord.status,
      initialPassword,
    };
  }

  /**
   * 切换租户物理数据库生命周期状态 (ACTIVE <-> SUSPENDED)
   */
  async toggleTenantStatus(
    organizationId: string,
    operatorUser: { email?: string | null },
  ): Promise<TenantDatabaseStatus> {
    assertControlAdmin(operatorUser);

    const db = await this.prisma.tenantDatabase.findUnique({
      where: { organizationId },
    });

    if (!db) {
      throw new Error(`找不到租户 [${organizationId}] 的物理数据库拓扑记录`);
    }

    const nextStatus: TenantDatabaseStatus =
      db.status === TenantDatabaseStatus.ACTIVE
        ? TenantDatabaseStatus.SUSPENDED
        : TenantDatabaseStatus.ACTIVE;

    await this.prisma.tenantDatabase.update({
      where: { organizationId },
      data: {
        status: nextStatus,
      },
    });

    return nextStatus;
  }

  /**
   * 控制平面超管重置指定租户成员登录密码
   */
  async resetTenantUserPassword(
    orgId: string,
    userId: string,
    operatorUser: { email?: string | null },
    customPassword?: string,
  ): Promise<ResetTenantUserPasswordResult> {
    assertControlAdmin(operatorUser);

    const member = await this.prisma.member.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
      include: {
        user: true,
      },
    });

    if (!member) {
      throw new Error("该成员不存在或不属于当前租户");
    }

    const randBytes = crypto.getRandomValues(new Uint8Array(4));
    const hex = Array.from(randBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    const temporaryPassword = customPassword?.trim() || `Reset@${hex}!`;

    const hashedPassword = await hashPassword(temporaryPassword);

    const account = await this.prisma.account.findFirst({
      where: {
        userId,
        providerId: "credential",
      },
    });

    if (account) {
      await this.prisma.account.update({
        where: {
          providerId_accountId: {
            providerId: "credential",
            accountId: account.accountId,
          },
        },
        data: {
          password: hashedPassword,
        },
      });
    } else {
      await this.prisma.account.create({
        data: {
          id: generateUuidV7(),
          accountId: userId,
          providerId: "credential",
          userId,
          password: hashedPassword,
        },
      });
    }

    return {
      userId,
      email: member.user.email,
      temporaryPassword,
    };
  }
}
