import {
  TenantDatabaseStatus,
  type ControlPrismaClient,
} from "@base/db-control";
import { assertControlAdmin } from "../../shared/server/control-guard";
import type { ControlStats } from "./types";

export interface PlatformOverviewServiceOptions {
  readonly prisma: ControlPrismaClient;
}

/**
 * 平台总览与指标大盘核心服务 (Platform Overview Service)
 */
export class PlatformOverviewService {
  constructor(private readonly prisma: ControlPrismaClient) {}

  static create(
    options: PlatformOverviewServiceOptions,
  ): PlatformOverviewService {
    return new PlatformOverviewService(options.prisma);
  }

  /**
   * 获取控制平面总览大盘统计数据
   */
  async getStats(operatorUser: {
    email?: string | null;
  }): Promise<ControlStats> {
    assertControlAdmin(operatorUser);

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
      if (status === TenantDatabaseStatus.ACTIVE) {
        active++;
      } else if (status === TenantDatabaseStatus.SUSPENDED) {
        suspended++;
      } else if (status === TenantDatabaseStatus.FAILED) {
        failed++;
      } else if (status === TenantDatabaseStatus.PROVISIONING) {
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
}
