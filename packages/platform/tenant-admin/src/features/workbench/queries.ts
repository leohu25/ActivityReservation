import "server-only";

import { toPlainData } from "@base/shared";
import {
  getTenantAdminContext,
  assertTenantAdminAbility,
} from "../../assembly/context";
import { WorkbenchSubject, WorkbenchAction } from "./contract";
import { WorkbenchService } from "./service";

/**
 * 查询工作台概览指标卡片数据 Query
 */
export async function getWorkbenchMetricsQuery() {
  const { client, ability } = await getTenantAdminContext();
  assertTenantAdminAbility(ability, WorkbenchAction.READ, WorkbenchSubject);

  const metrics = await WorkbenchService.getOverviewMetrics(client);
  return toPlainData(metrics);
}
