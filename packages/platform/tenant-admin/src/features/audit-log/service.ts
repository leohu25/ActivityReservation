import type { TenantPrismaClient } from "@base/db-tenant";
import type { ListAuditLogsFilter, AuditOperationLogItem } from "./types";

/**
 * 审计日志领域服务 (骨架标准实现，待真实日志中台流接通)
 */
export class AuditLogService {
  /**
   * 分页查询操作日志
   */
  static async listOperationLogs(
    _client: TenantPrismaClient,
    _filter: ListAuditLogsFilter = {},
  ): Promise<{ items: readonly AuditOperationLogItem[]; total: number }> {
    // TODO: 接入 ClickHouse / Elasticsearch 或 PostgreSQL 分区审计流
    return {
      items: [],
      total: 0,
    };
  }
}
