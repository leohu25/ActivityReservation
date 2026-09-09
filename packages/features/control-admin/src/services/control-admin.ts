import {
  PrismaControlDbRepository,
  type ControlPrismaClient,
  type TenantDatabaseStatus,
  type TenantMigrationRepository,
} from "@chenrun/db-control";
import {
  TenantProvisioner,
  TenantMigrationRunner,
  TenantDatabaseSeeder,
  createDefaultPgSqlExecutorFactory,
  type ProvisionTenantDatabaseResult,
  type TenantMigrationDefinition,
} from "@chenrun/db-tenant";
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
} from "../types";

/**
 * 控制平面总控服务的依赖装配参数
 */
export interface ControlAdminServiceOptions {
  readonly prisma: ControlPrismaClient;
  readonly repository?: TenantMigrationRepository;
  readonly adminDatabaseUrl?: string;
  readonly provisioner?: TenantProvisioner;
  readonly seeder?: TenantDatabaseSeeder;
}

/**
 * 控制平面总控核心服务 (Control Admin Service)
 * 负责大盘指标统计、租户全生命周期管理、物理独立库自动化开通 (Provisioning) 与状态管控。
 */
export class ControlAdminService {
  constructor(
    private readonly prisma: ControlPrismaClient,
    private readonly provisioner?: TenantProvisioner,
    private readonly seeder?: TenantDatabaseSeeder,
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
      );
    }

    const adminDbUrl =
      options.adminDatabaseUrl ??
      process.env.CONTROL_DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/saas_control";

    const sqlExecutorFactory = createDefaultPgSqlExecutorFactory();
    const seeder =
      options.seeder ?? new TenantDatabaseSeeder(sqlExecutorFactory);
    const baseMigrations: readonly TenantMigrationDefinition[] = [
      {
        version: "202609080001",
        name: "initial_tenant_schema",
        steps: [
          {
            name: "initial_tables",
            up: `
              CREATE TABLE IF NOT EXISTS "department" (
                "id" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "code" TEXT NOT NULL,
                "parentId" TEXT,
                "leaderMemberId" TEXT,
                "sort" INTEGER NOT NULL DEFAULT 0,
                "status" TEXT NOT NULL DEFAULT 'ACTIVE',
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "department_pkey" PRIMARY KEY ("id")
              );
              CREATE UNIQUE INDEX IF NOT EXISTS "department_code_key" ON "department"("code");
              CREATE INDEX IF NOT EXISTS "department_status_idx" ON "department"("status");
              CREATE TABLE IF NOT EXISTS "position" (
                "id" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "code" TEXT NOT NULL,
                "description" TEXT,
                "sort" INTEGER NOT NULL DEFAULT 0,
                "status" TEXT NOT NULL DEFAULT 'ACTIVE',
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "position_pkey" PRIMARY KEY ("id")
              );
              CREATE UNIQUE INDEX IF NOT EXISTS "position_code_key" ON "position"("code");
              CREATE INDEX IF NOT EXISTS "position_status_idx" ON "position"("status");
              CREATE TABLE IF NOT EXISTS "purchase_order" (
                "id" TEXT NOT NULL,
                "orderNo" TEXT NOT NULL,
                "supplierName" TEXT NOT NULL,
                "quantity" INTEGER NOT NULL,
                "costPrice" DECIMAL(12,2) NOT NULL,
                "deptId" TEXT NOT NULL,
                "createdById" TEXT NOT NULL,
                "status" TEXT NOT NULL DEFAULT 'PENDING',
                "auditComment" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "purchase_order_pkey" PRIMARY KEY ("id")
              );
              CREATE UNIQUE INDEX IF NOT EXISTS "purchase_order_orderNo_key" ON "purchase_order"("orderNo");
              CREATE INDEX IF NOT EXISTS "purchase_order_deptId_idx" ON "purchase_order"("deptId");
              CREATE INDEX IF NOT EXISTS "purchase_order_createdById_idx" ON "purchase_order"("createdById");
              CREATE INDEX IF NOT EXISTS "purchase_order_status_idx" ON "purchase_order"("status");
              CREATE TABLE IF NOT EXISTS "employee_profile" (
                "id" TEXT NOT NULL,
                "memberId" TEXT,
                "userId" TEXT,
                "invitationId" TEXT,
                "employeeNo" TEXT,
                "departmentId" TEXT,
                "positionId" TEXT,
                "managerEmployeeId" TEXT,
                "nameSnapshot" TEXT NOT NULL DEFAULT '',
                "emailSnapshot" TEXT NOT NULL DEFAULT '',
                "jobTitle" TEXT,
                "status" TEXT NOT NULL DEFAULT 'ACTIVE',
                "joinedAt" TIMESTAMP(3),
                "terminatedAt" TIMESTAMP(3),
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "employee_profile_pkey" PRIMARY KEY ("id")
              );
              CREATE UNIQUE INDEX IF NOT EXISTS "employee_profile_memberId_key" ON "employee_profile"("memberId");
              CREATE UNIQUE INDEX IF NOT EXISTS "employee_profile_employeeNo_key" ON "employee_profile"("employeeNo");
              CREATE INDEX IF NOT EXISTS "employee_profile_departmentId_idx" ON "employee_profile"("departmentId");
              CREATE INDEX IF NOT EXISTS "employee_profile_positionId_idx" ON "employee_profile"("positionId");
              CREATE INDEX IF NOT EXISTS "employee_profile_managerEmployeeId_idx" ON "employee_profile"("managerEmployeeId");
              CREATE INDEX IF NOT EXISTS "employee_profile_memberId_idx" ON "employee_profile"("memberId");
              CREATE INDEX IF NOT EXISTS "employee_profile_status_idx" ON "employee_profile"("status");
              CREATE TABLE IF NOT EXISTS "company_profile" (
                "id" TEXT NOT NULL,
                "companyName" TEXT NOT NULL,
                "shortName" TEXT,
                "creditCode" TEXT,
                "legalPerson" TEXT,
                "contactPhone" TEXT,
                "contactEmail" TEXT,
                "address" TEXT,
                "timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
                "currency" TEXT NOT NULL DEFAULT 'CNY',
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "company_profile_pkey" PRIMARY KEY ("id")
              );
            `,
            down: `
              DROP TABLE IF EXISTS "company_profile";
              DROP TABLE IF EXISTS "purchase_order";
              DROP TABLE IF EXISTS "employee_profile";
              DROP TABLE IF EXISTS "position";
              DROP TABLE IF EXISTS "department";
            `,
          },
        ],
      },
    ];

    const repo =
      options.repository ?? new PrismaControlDbRepository(options.prisma);

    const migrationRunner = new TenantMigrationRunner(
      repo,
      {
        resolveDatabaseUrl: async (secretRef: string): Promise<string> => {
          if (secretRef.startsWith("env:")) {
            const envKey = secretRef.slice(4);
            return process.env[envKey] ?? "";
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
      },
      sqlExecutorFactory,
      baseMigrations,
    );

    const provisioner = new TenantProvisioner(
      repo,
      sqlExecutorFactory,
      migrationRunner,
      seeder,
    );

    return new ControlAdminService(options.prisma, provisioner, seeder);
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
        await this.provisioner.provisionTenantDatabase({
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
}
