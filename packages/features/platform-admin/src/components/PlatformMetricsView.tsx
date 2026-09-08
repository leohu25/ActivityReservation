import React from "react";
import type { PlatformAdminStats } from "../types";

export interface PlatformMetricsViewProps {
  readonly stats: PlatformAdminStats;
}

/**
 * 平台总控大盘核心指标卡片组件
 */
export function PlatformMetricsView({
  stats,
}: PlatformMetricsViewProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            平台租户总数
          </span>
          <span className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            🏢
          </span>
        </div>
        <p className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
          {stats.totalTenants}
        </p>
        <p className="mt-1 text-xs text-zinc-400">所有注册入驻的组织企业</p>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/10">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            正常运行中 (ACTIVE)
          </span>
          <span className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
            🟢
          </span>
        </div>
        <p className="mt-3 text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
          {stats.activeTenants}
        </p>
        <p className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-400/80">
          物理库已就绪且正常路由
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/10">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            已挂起管控 (SUSPENDED)
          </span>
          <span className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
            ⏸️
          </span>
        </div>
        <p className="mt-3 text-3xl font-extrabold text-amber-700 dark:text-amber-300">
          {stats.suspendedTenants}
        </p>
        <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-400/80">
          禁止写入，连接已被驱逐
        </p>
      </div>

      <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-6 shadow-sm dark:border-purple-900/40 dark:bg-purple-950/10">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">
            开通与失败
          </span>
          <span className="rounded-lg bg-purple-100 p-2 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
            ⚙️
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {stats.provisioningTenants} 开通中
          </span>
          <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
            / {stats.failedTenants} 故障
          </span>
        </div>
        <p className="mt-1 text-xs text-purple-600/80 dark:text-purple-400/80">
          需运维介入或重试
        </p>
      </div>
    </div>
  );
}
