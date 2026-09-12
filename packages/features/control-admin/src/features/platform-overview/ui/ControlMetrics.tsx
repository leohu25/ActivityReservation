"use client";

import React from "react";
import type { ControlStats } from "../types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from "@base/ui";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Database,
  ArrowUpRight,
} from "lucide-react";

export interface ControlMetricsProps {
  readonly stats: ControlStats;
}

/**
 * 控制平面核心运营指标大盘组件
 * 完全使用 shadcn ui (Card, Badge) 原生原子组件进行组合布局，自适应明暗双色主题
 */
export function ControlMetrics({
  stats,
}: ControlMetricsProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* 指标卡 1：平台组织与租户总数 */}
      <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            平台租户总数
          </CardTitle>
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Building2 className="size-4.5" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
              {stats.totalTenants}
            </span>
            <Badge
              variant="outline"
              className="border-blue-500/30 text-blue-600 dark:text-blue-400 gap-1 text-[11px]"
            >
              <ArrowUpRight className="size-3" />
              企业入驻
            </Badge>
          </div>
          <CardDescription className="text-xs">
            已在 Control DB 登记的所有租户组织
          </CardDescription>
        </CardContent>
      </Card>

      {/* 指标卡 2：正常运行中 (ACTIVE) */}
      <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-emerald-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            正常运行中 (ACTIVE)
          </CardTitle>
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="size-4.5" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
              {stats.activeTenants}
            </span>
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px]"
            >
              健康服务
            </Badge>
          </div>
          <CardDescription className="text-xs">
            独立物理数据库已就绪且正常路由
          </CardDescription>
        </CardContent>
      </Card>

      {/* 指标卡 3：管控挂起 (SUSPENDED) */}
      <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-amber-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            管控挂起 (SUSPENDED)
          </CardTitle>
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="size-4.5" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight tabular-nums text-amber-600 dark:text-amber-400">
              {stats.suspendedTenants}
            </span>
            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px]"
            >
              安全阻断
            </Badge>
          </div>
          <CardDescription className="text-xs">
            连接池已阻断，路由拦截禁止写入
          </CardDescription>
        </CardContent>
      </Card>

      {/* 指标卡 4：集群开通与故障概况 */}
      <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            物理库集群状态
          </CardTitle>
          <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Database className="size-4.5" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
              {stats.provisioningTenants}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                开通中
              </span>
            </span>
            <span className="text-sm font-semibold text-destructive tabular-nums">
              / {stats.failedTenants} 故障
            </span>
          </div>
          <CardDescription className="text-xs">
            PG 17 Database-per-Tenant 自动开通流水
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
