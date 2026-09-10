import {
  PrismaControlDbRepository,
  type ControlPrismaClient,
  type TenantDatabaseStatus,
  type TenantMigrationRepository,
} from "@chenrun/db-control";
import {
  TenantDatabaseSeeder,
  createDefaultPgSqlExecutorFactory,
} from "@chenrun/db-tenant";
import {
  DatabaseMigrationService,
  TenantDatabaseProvisioner,
  type ProvisionTenantDatabaseResult,
} from "@chenrun/db-migrate";
import { hashPassword } from "better-auth/crypto";
import {
  FieldPolicy,
  serializeRolePermissions,
  type RolePermissionPayload,
} from "@chenrun/authorization";
import { assertControlAdmin } from "../auth/control-guard";
import type {
  ControlTenantItem,
  ControlStats,
  ProvisionTenantInput,
  ProvisionTenantResult,
  TenantFleetItem,
  MigrationDashboardData,
} from "../types";

/**
 * 控制平面总控服务的依赖装配参数
 */
export interface ControlAdminServiceOptions {
  readonly prisma: ControlPrismaClient;
  readonly repository?: TenantMigrationRepository;
  readonly adminDatabaseUrl?: string;
  readonly provisioner?: TenantDatabaseProvisioner;
  readonly migrationService?: DatabaseMigrationService;
  readonly seeder?: TenantDatabaseSeeder;
}

/**
 * 控制平面总控核心服务 (Control Admin Service)
 * 负责大盘指标统计、租户全生命周期管理、物理独立库自动化开通 (Provisioning) 与状态管控。
 */
export class ControlAdminService {
  constructor(
    private readonly prisma: ControlPrismaClient,
    private readonly provisioner?: TenantDatabaseProvisioner,
    readonly seeder?: TenantDatabaseSeeder,
    private readonly migrationService?: DatabaseMigrationService,
  ) {}

  /**
   * 工厂方法：基于显式依赖构建 ControlAdminService
   */
  static create(options: ControlAdminServiceOptions): ControlAdminService {
    if (options.provisioner) {
      return new ControlAdminService(
        options.prisma,
        options.provisioner,
        options.seeder,
        options.migrationService,
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

    const repo =
      options.repository ?? new PrismaControlDbRepository(options.prisma);
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
    const migrationService =
      options.migrationService ??
      new DatabaseMigrationService({
        controlDatabaseUrl: adminDbUrl,
        repository: repo,
        secretResolver,
        sqlExecutorFactory,
        seeder,
      });

    return new ControlAdminService(
      options.prisma,
      migrationService.tenantProvisioner,
      seeder,
      migrationService,
    );
  }

  /**
   * 获取控制平面总览统计数据
   */
  async getStats(): Promise<ControlStats> {
    const orgs = await this.prisma.organization.findMany({
      include: {
        tenantDatabase: true,
      },
    });

    let active = 0;
    let suspended = 0;
    let failed = 0;
    let provisioning = 0;

    for (const org of orgs) {
      const status = org.tenantDatabase?.status;
      if (status === "ACTIVE") {
        active++;
      } else if (status === "SUSPENDED") {
        suspended++;
      } else if (status === "FAILED") {
        failed++;
      } else if (status === "PROVISIONING") {
        provisioning++;
      }
    }

    return {
      totalTenants: orgs.length,
      activeTenants: active,
      suspendedTenants: suspended,
      failedTenants: failed,
      provisioningTenants: provisioning,
    };
  }

  /**
   * 查询全部租户列表及其物理数据库与迁移信息
   */
  async listTenants(): Promise<ControlTenantItem[]> {
    const orgs = await this.prisma.organization.findMany({
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
    });

    return orgs.map((org) => {
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
  }

  /**
   * 控制平面管理员开通新租户并自动化创建物理数据库与初始化迁移
   */
  async provisionTenant(
    input: ProvisionTenantInput,
    operatorUser: { email?: string | null },
  ): Promise<ProvisionTenantResult> {
    // 1. 控制平面超管权限断言
    assertControlAdmin(operatorUser);

    // 2. 校验入参
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

    // 3. 检查 Slug 是否已被占用
    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug: cleanSlug },
    });
    if (existingOrg) {
      throw new Error(`租户 Slug [${cleanSlug}] 已存在，请更换`);
    }

    // 4. 查找或预置管理员 User 与凭证 Account
    let adminUser = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!adminUser) {
      adminUser = await this.prisma.user.create({
        data: {
          id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          email: cleanEmail,
          name: input.adminName?.trim() || cleanEmail.split("@")[0],
          emailVerified: true,
        },
      });
    }

    const initialPassword = input.initialPassword ?? "Admin123456!";
    let returnedInitialPassword: string | undefined;

    const existingAccount = await this.prisma.account.findFirst({
      where: {
        userId: adminUser.id,
        providerId: "credential",
      },
    });

    if (!existingAccount) {
      const hashedPassword = await hashPassword(initialPassword);
      await this.prisma.account.create({
        data: {
          id: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          accountId: adminUser.id,
          providerId: "credential",
          userId: adminUser.id,
          password: hashedPassword,
        },
      });
      returnedInitialPassword = initialPassword;
    } else if (input.initialPassword) {
      const hashedPassword = await hashPassword(input.initialPassword);
      await this.prisma.account.update({
        where: {
          providerId_accountId: {
            providerId: "credential",
            accountId: adminUser.id,
          },
        },
        data: {
          password: hashedPassword,
        },
      });
      returnedInitialPassword = input.initialPassword;
    }

    // 5. 在 Control DB 中创建 Organization 与初始 Owner Member (严格遵循 R-01 规则)
    const orgId = `org_${cleanSlug}_${Date.now()}`;
    const ownerMemberId = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const organization = await this.prisma.organization.create({
      data: {
        id: orgId,
        name: cleanName,
        slug: cleanSlug,
        members: {
          create: {
            id: ownerMemberId,
            userId: adminUser.id,
            role: "owner",
          },
        },
      },
    });

    // 6. 在 Control DB 中初始化该租户的系统预置四层角色策略 (owner, admin, buyer)
    const defaultRoles: Array<{
      role: string;
      payload: RolePermissionPayload;
    }> = [
      {
        role: "owner",
        payload: {
          statement: {
            "procurement.order": [
              "read",
              "create",
              "update",
              "audit",
              "export",
            ],
          },
          dataScopes: [
            {
              resource: "procurement.order",
              scopeType: "ALL",
            },
          ],
          fieldPolicies: [],
        },
      },
      {
        role: "admin",
        payload: {
          statement: {
            "procurement.order": [
              "read",
              "create",
              "update",
              "audit",
              "export",
            ],
          },
          dataScopes: [
            {
              resource: "procurement.order",
              scopeType: "DEPT_TREE",
            },
          ],
          fieldPolicies: [],
        },
      },
      {
        role: "buyer",
        payload: {
          statement: {
            "procurement.order": ["read", "create"],
          },
          dataScopes: [
            {
              resource: "procurement.order",
              action: "read",
              scopeType: "DEPT",
            },
          ],
          fieldPolicies: [
            {
              subject: "PurchaseOrder",
              field: "costPrice",
              access: FieldPolicy.READONLY,
            },
          ],
        },
      },
    ];

    for (const r of defaultRoles) {
      await this.prisma.organizationRole.upsert({
        where: {
          organizationId_role: {
            organizationId: organization.id,
            role: r.role,
          },
        },
        create: {
          id: `role_${organization.id}_${r.role}`,
          organizationId: organization.id,
          role: r.role,
          permission: serializeRolePermissions(r.payload),
        },
        update: {
          permission: serializeRolePermissions(r.payload),
        },
      });
    }

    const clusterCode = input.clusterCode ?? "primary";
    const databaseName = `tenant_${cleanSlug.replace(/-/g, "_")}`;
    const adminDbUrl =
      process.env.CONTROL_DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/saas_control";

    const seedInput = {
      organizationId: organization.id,
      organizationName: cleanName,
      ownerUserId: adminUser.id,
      ownerMemberId,
      ownerName: adminUser.name,
      ownerEmail: cleanEmail,
    };

    // 7. 调用 TenantProvisioner 自动化创建物理数据库、应用基线 Schema 迁移并注入种子数据
    if (this.provisioner) {
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
        initialPassword: returnedInitialPassword,
      };
    }

    // 若未注入 provisioner（单测轻量分支），直接登记租户库记录
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
      initialPassword: returnedInitialPassword,
    };
  }

  /**
   * 切换租户状态（在 ACTIVE 与 SUSPENDED 之间切换）
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
      throw new Error(`租户 [${organizationId}] 尚未开通物理数据库`);
    }

    if (db.status !== "ACTIVE" && db.status !== "SUSPENDED") {
      throw new Error(
        `当前租户状态为 [${db.status}]，仅支持在 ACTIVE 与 SUSPENDED 之间进行启停切换`,
      );
    }

    const nextStatus: TenantDatabaseStatus =
      db.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    const updated = await this.prisma.tenantDatabase.update({
      where: { organizationId },
      data: { status: nextStatus },
    });

    return updated.status;
  }

  /**
   * 获取平台与租户数据架构迁移看板全景数据
   */
  async getMigrationDashboard(operatorUser: {
    email?: string | null;
  }): Promise<MigrationDashboardData> {
    assertControlAdmin(operatorUser);

    if (!this.migrationService) {
      throw new Error("未配置 DatabaseMigrationService，无法读取迁移状态");
    }

    const platformStatus =
      await this.migrationService.platformRunner.preflight();
    const latestPlatformAvailable = platformStatus.targetVersion;
    const tenantTargetVersion =
      (
        await Promise.all(
          (
            await this.prisma.tenantDatabase.findMany()
          ).map((database) =>
            this.migrationService!.tenantRunner.preflightTenant(
              database.organizationId,
            ),
          ),
        )
      ).at(0)?.targetVersion ?? "0";

    const orgsWithDb = await this.prisma.organization.findMany({
      where: {
        tenantDatabase: { isNot: null },
      },
      include: {
        tenantDatabase: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const fleetItems: TenantFleetItem[] = [];
    for (const org of orgsWithDb) {
      const db = org.tenantDatabase;
      if (!db) continue;
      const preflight =
        await this.migrationService.tenantRunner.preflightTenant(org.id);
      const isUpToDate = preflight.pendingVersions.length === 0;
      const pendingCount = preflight.pendingVersions.length;

      fleetItems.push({
        organizationId: org.id,
        organizationName: org.name,
        slug: org.slug,
        databaseName: db.databaseName,
        currentVersion: db.schemaVersion,
        isUpToDate,
        status: db.status,
        pendingVersionCount: pendingCount,
      });
    }

    const upToDateCount = fleetItems.filter((i) => i.isUpToDate).length;

    return {
      platform: {
        currentVersion: platformStatus.currentVersion ?? undefined,
        latestAvailableVersion: latestPlatformAvailable,
        isUpToDate: platformStatus.pendingVersions.length === 0,
        pendingCount: platformStatus.pendingVersions.length,
      },
      fleet: {
        latestAvailableVersion: tenantTargetVersion,
        totalCount: fleetItems.length,
        upToDateCount,
        pendingCount: fleetItems.length - upToDateCount,
        items: fleetItems,
      },
    };
  }

  /**
   * 平台管理员触发平台数据库升级
   */
  async upgradePlatformDatabase(operatorUser: {
    email?: string | null;
  }): Promise<{ appliedCount: number; appliedVersions: string[] }> {
    assertControlAdmin(operatorUser);

    if (!this.migrationService) {
      throw new Error("未配置 DatabaseMigrationService，无法执行平台升级");
    }
    const result = await this.migrationService.platformRunner.migrate();
    return {
      appliedCount: result.appliedCount,
      appliedVersions: [...result.appliedVersions],
    };
  }

  /**
   * 平台管理员触发租户舰队批量升级或指定租户升级
   */
  async upgradeTenantFleet(
    operatorUser: { email?: string | null },
    targetOrgId?: string,
  ): Promise<{ upgradedCount: number; failedCount: number }> {
    assertControlAdmin(operatorUser);

    if (!this.migrationService) {
      throw new Error("未配置 DatabaseMigrationService，无法执行舰队升级");
    }
    return this.migrationService.tenantRunner.migrateFleet(targetOrgId);
  }
}
