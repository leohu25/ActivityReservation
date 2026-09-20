import type { TenantPrismaClient } from "@base/db-tenant";

/**
 * 工作台领域服务 (支撑大盘与各业务指标卡片聚合)
 */
export class WorkbenchService {
  /**
   * 汇总统计各核心主数据指标
   */
  static async getOverviewMetrics(client: TenantPrismaClient) {
    const [departmentCount, positionCount, employeeCount] = await Promise.all([
      client.department.count(),
      client.position.count(),
      client.employeeProfile.count({ where: { status: "ACTIVE" } }),
    ]);

    return {
      departmentCount,
      positionCount,
      employeeCount,
    };
  }
}
