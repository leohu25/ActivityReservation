import "server-only";

import { toPlainData } from "@base/shared";
import { StandardAction } from "@base/authorization";
import {
  getTenantAdminContext,
  assertTenantAdminAbility,
} from "../../assembly/context";
import { AuditLogOperationSubject } from "./contract";
import { AuditLogService } from "./service";
import type { ListAuditLogsFilter, AuditOperationLogItem } from "./types";

/**
 * 分页查询操作审计日志 Query (受控于 AuditLogOperation 权限)
 */
export async function listAuditOperationLogsQuery(
  filter: ListAuditLogsFilter = {},
): Promise<{ items: readonly AuditOperationLogItem[]; total: number }> {
  const { client, ability } = await getTenantAdminContext();
  assertTenantAdminAbility(ability, StandardAction.READ, AuditLogOperationSubject);

  const result = await AuditLogService.listOperationLogs(client, filter);
  return toPlainData(result);
}
