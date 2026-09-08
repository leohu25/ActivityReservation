"use client";

import React from "react";
import type { ControlStats } from "../types";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Database,
  ArrowUpRight,
} from "lucide-react";

export interface ControlMetricsProps {
  /** 控制平面运营统计数据 */
  readonly stats: ControlStats;
}

/**
 * 控制平面核心运营指标大盘组件
 * 遵循现代数智工业风规范：纯白浮动大圆角卡片、等宽数字排版 (tabular-nums)、微描边与悬停微抬升反馈
 */
export function ControlMetrics({
  stats,
}: ControlMetricsProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* 指标卡 1：平台组织与租户总数 */}
      <div className="group rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            平台租户总数
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/60">
            <Building2 className="size-4.5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
            {stats.totalTenants}
          </span>
          <span className="text-xs font-semibold text-blue-600 inline-flex items-center">
            <ArrowUpRight className="size-3" />
            企业入驻
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          已在 Control DB 登记的所有租户组织
        </p>
      </div>

      {/* 指标卡 2：正常运行中 (ACTIVE) */}
      <div className="group rounded-2xl border border-emerald-200/60 bg-white p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            正常运行中 (ACTIVE)
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 className="size-4.5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-emerald-600 tracking-tight tabular-nums">
            {stats.activeTenants}
          </span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/60">
            健康服务
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          独立物理数据库已就绪且正常路由
        </p>
      </div>

      {/* 指标卡 3：管控挂起 (SUSPENDED) */}
      <div className="group rounded-2xl border border-amber-200/60 bg-white p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
            管控挂起 (SUSPENDED)
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <AlertTriangle className="size-4.5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-amber-600 tracking-tight tabular-nums">
            {stats.suspendedTenants}
          </span>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200/60">
            安全阻断
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          连接池已阻断，路由拦截禁止写入
        </p>
      </div>

      {/* 指标卡 4：集群开通与故障概况 */}
      <div className="group rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
            物理库集群状态
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/60">
            <Database className="size-4.5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
            {stats.provisioningTenants}{" "}
            <span className="text-xs font-medium text-slate-500">开通中</span>
          </span>
          <span className="text-sm font-semibold text-rose-600 tabular-nums">
            / {stats.failedTenants} 故障
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          PG 17 Database-per-Tenant 自动开通流水
        </p>
      </div>
    </div>
  );
}
