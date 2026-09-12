import {
  PrismaControlDbRepository,
  type ControlPrismaClient,
  type TenantMigrationRepository,
} from "@chenrun/db-control";
import {
  TenantDatabaseSeeder,
  createDefaultPgSqlExecutorFactory,
} from "@chenrun/db-tenant";
import { DatabaseMigrationService } from "@chenrun/db-migrate";
import { assertControlAdmin } from "../../shared/server/control-guard";
import type { MigrationDashboardData, TenantFleetItem } from "./types";

import { getControlAuthRuntime } from "../../shared/server/auth-runtime";

export interface MigrationManagementServiceOptions {
  readonly prisma: ControlPrismaClient;
  readonly repository?: TenantMigrationRepository;
  readonly adminDatabaseUrl?: string;
  readonly migrationService?: DatabaseMigrationService;
  readonly seeder?: TenantDatabaseSeeder;
}

let migrationServiceSingleton: MigrationManagementService | undefined;

export function getMigrationManagementService(): MigrationManagementService {
  if (migrationServiceSingleton) {
    return migrationServiceSingleton;
  }
  const runtime = getControlAuthRuntime();
  migrationServiceSingleton = MigrationManagementService.create({
    prisma: runtime.prisma,
  });
  return migrationServiceSingleton;
}

/**
 * 数据架构与迁移中枢核心服务 (Migration Management Service)
 */
export class MigrationManagementService {
  constructor(
    private readonly prisma: ControlPrismaClient,
    private readonly migrationService?: DatabaseMigrationService,
  ) {}

  static create(
    options: MigrationManagementServiceOptions,
  ): MigrationManagementService {
    if (options.migrationService) {
      return new MigrationManagementService(
        options.prisma,
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

    const migrationService = new DatabaseMigrationService({
      controlDatabaseUrl: adminDbUrl,
      repository: repo,
      secretResolver,
      sqlExecutorFactory,
      seeder,
    });

    return new MigrationManagementService(options.prisma, migrationService);
  }

  /**
   * 获取平台与租户数据架构迁移看板全景数据
   */
  async getMigrationDashboard(operatorUser: {
    email?: string | null;
  }): Promise<MigrationDashboardData> {
    assertControlAdmin(operatorUser);

    if (!this.migrationService) {
      const orgs = await this.prisma.organization.findMany({
        include: {
          tenantDatabase: true,
        },
      });

      const fleetItems = orgs.flatMap((o) =>
        o.tenantDatabase
          ? [
              {
                organizationId: o.id,
                organizationName: o.name,
                slug: o.slug,
                databaseName: o.tenantDatabase.databaseName,
                currentVersion: o.tenantDatabase.schemaVersion ?? "baseline",
                isUpToDate: true,
                status: o.tenantDatabase.status,
                pendingVersionCount: 0,
              },
            ]
          : [],
      );

      return {
        platform: {
          currentVersion: "baseline",
          latestAvailableVersion: "baseline",
          isUpToDate: true,
          pendingCount: 0,
        },
        fleet: {
          latestAvailableVersion: "baseline",
          totalCount: fleetItems.length,
          upToDateCount: fleetItems.length,
          pendingCount: 0,
          items: fleetItems,
        },
      };
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
