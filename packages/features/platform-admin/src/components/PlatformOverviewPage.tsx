import React from "react";
import Link from "next/link";
import { getPlatformAdminService } from "../server/auth-runtime";
import { requirePlatformAdminSession } from "../server/session";
import { PlatformMetricsView } from "./PlatformMetricsView";

/**
 * 平台运营总览页面组件 (Server Component)
 * 仅聚焦展示平台全局指标大盘、运行状态与系统健康度
 */
export async function PlatformOverviewPage(): Promise<React.JSX.Element> {
  await requirePlatformAdminSession();
  const service = getPlatformAdminService();
  const stats = await service.getStats();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            运营数据总览 (Platform Overview)
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            实时汇总多租户物理数据库、活跃租户状态与平台全局统计。
          </p>
        </div>
        <Link
          href="/tenants"
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 transition-colors"
        >
          <span>前往租户运维中心</span>
          <span>→</span>
        </Link>
      </div>

      <PlatformMetricsView stats={stats} />
    </div>
  );
}
