import "server-only";

import { toPlainData } from "@base/shared";
import { getControlAuthRuntime } from "../../shared/server/auth-runtime";
import { requireControlAdminSession } from "../../shared/server/session";
import { PlatformOverviewService } from "./service";
import type { ControlStats } from "./types";

let overviewServiceSingleton: PlatformOverviewService | undefined;

export function getPlatformOverviewService(): PlatformOverviewService {
 if (overviewServiceSingleton) {
  return overviewServiceSingleton;
 }
 const runtime = getControlAuthRuntime();
 overviewServiceSingleton = PlatformOverviewService.create({
  prisma: runtime.prisma,
 });
 return overviewServiceSingleton;
}

/**
 * RSC Server-only 获取平台总览统计数据
 */
export async function getControlStatsQuery(): Promise<ControlStats> {
 const user = await requireControlAdminSession();
 const service = getPlatformOverviewService();
 const result = await service.getStats(user);
 return toPlainData(result);
}
