import "server-only";

import { toPlainData } from "@base/shared";
import { requireControlAdminSession } from "../../shared/server/session";
import { getMigrationManagementService } from "./service";
import type { MigrationDashboardData } from "./types";

/**
 * RSC Server-only 读取平台与租户迁移看板数据
 */
export async function getMigrationDashboardQuery(): Promise<MigrationDashboardData> {
 const user = await requireControlAdminSession();
 const service = getMigrationManagementService();
 const result = await service.getMigrationDashboard(user);
 return toPlainData(result);
}
