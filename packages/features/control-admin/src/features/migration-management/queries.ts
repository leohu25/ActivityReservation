import "server-only";

import { requireControlAdminSession } from "../../shared/server/session";
import { getMigrationManagementService } from "./service";
import type { MigrationDashboardData } from "./types";

/**
 * RSC Server-only 读取平台与租户迁移看板数据
 */
export async function getMigrationDashboardQuery(): Promise<MigrationDashboardData> {
 const user = await requireControlAdminSession();
 const service = getMigrationManagementService();
 return service.getMigrationDashboard(user);
}
