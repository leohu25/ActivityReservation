import React from "react";
import Link from "next/link";
import { getControlAdminService } from "../server/auth-runtime";
import { requireControlAdminSession } from "../server/session";
import { ControlMetrics } from "./ControlMetrics";
import {
  Server,
  Database,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  GitBranch,
} from "lucide-react";

/**
 * 控制平面运营总览页面组件 (Server Component)
 * 遵循现代轻量工业数智风规范：通透纯净、纯白浮动大圆角卡片、科技皇家蓝主色、无 Emoji
 */
export async function OverviewPage(): Promise<React.JSX.Element> {
  await requireControlAdminSession();
  const service = getControlAdminService();
  const stats = await service.getStats();

  return (
    <div className="space-y-8">
      {/* 顶部欢迎与快速操作 Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              控制平面总览 (Control Plane Overview)
            </h2>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600 border border-blue-200/60">
              实时集群监控
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            聚合多租户物理独立数据库
            (Database-per-Tenant)、运行健康度与系统级自动化开通流水。
          </p>
        </div>

        <Link
          href="/tenants"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer"
        >
          <span>进入租户运维中枢</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* 核心 KPI 大盘指标卡 */}
      <ControlMetrics stats={stats} />

      {/* 下方控制平面架构底座与运维视界卡片 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 卡片 1: 多租户物理库隔离矩阵 */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Database className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  物理库隔离架构 (Database-per-Tenant)
                </h3>
                <p className="text-[11px] text-slate-400">
                  PostgreSQL 17 物理级隔离与动态连接路由
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/60">
              物理隔离保障
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
              <Server className="size-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">
                  Control Plane (saas_control)
                </span>
                <p className="text-slate-500 mt-0.5 text-[11px]">
                  维护全局用户身份凭证、组织关系、租户数据库映射表
                  (tenant_database) 及迁移日志。
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
              <HardDrive className="size-4 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">
                  Tenant Data Store (tenant_[slug])
                </span>
                <p className="text-slate-500 mt-0.5 text-[11px]">
                  业务切片专属物理独立数据库。请求由 Tenant Context
                  动态解析并绑定连接池，绝不串库。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 卡片 2: 控制面安全与自动化升级中枢 */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  运维管控与迁移发布契约
                </h3>
                <p className="text-[11px] text-slate-400">
                  自动化 Schema 同步、Fail-Closed 阻断策略
                </p>
              </div>
            </div>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200/60">
              零停机升级
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
              <GitBranch className="size-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">
                  自动化基线迁移引擎
                </span>
                <p className="text-slate-500 mt-0.5 text-[11px]">
                  开通新租户时自动调用 Prisma Migration 引擎，完成基线 DDL
                  下发与版本登记。
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
              <CheckCircle2 className="size-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">
                  动态熔断与状态切换 (SUSPENDED)
                </span>
                <p className="text-slate-500 mt-0.5 text-[11px]">
                  一键挂起租户物理库，连接池立即驱逐并拦截业务路由，阻断一切潜在脏写入。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
