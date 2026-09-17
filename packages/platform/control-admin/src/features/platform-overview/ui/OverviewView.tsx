"use client";

import React from "react";
import Link from "next/link";
import { ControlMetrics } from "./ControlMetrics";
import type { ControlStats } from "../types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from "@base/ui";
import {
  Server,
  Database,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  GitBranch,
} from "lucide-react";

export interface OverviewViewProps {
  readonly stats: ControlStats;
}

/**
 * 控制平面运营总览视图组件 (Client-Safe View)
 * 完全基于 shadcn ui (Card, Button, Badge) 组合构建，原生适配明暗双色主题
 */
export function OverviewView({ stats }: OverviewViewProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      {/* 顶部欢迎与快速操作 Banner */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                控制平面总览 (Control Plane Overview)
              </CardTitle>
              <Badge
                variant="outline"
                className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs"
              >
                实时集群监控
              </Badge>
            </div>
            <CardDescription className="text-xs">
              聚合多租户物理独立数据库
              (Database-per-Tenant)、运行健康度与系统级自动化开通流水。
            </CardDescription>
          </div>

          <Button
            render={
              <Link href="/tenants">
                <span>进入租户运维中枢</span>
                <ArrowRight className="size-3.5" />
              </Link>
            }
            size="sm"
            className="gap-2 shrink-0"
          />
        </CardHeader>
      </Card>

      {/* 核心 KPI 大盘指标卡 */}
      <ControlMetrics stats={stats} />

      {/* 下方控制平面架构底座与运维视界卡片 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 卡片 1: 多租户物理库隔离矩阵 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Database className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  物理库隔离架构 (Database-per-Tenant)
                </CardTitle>
                <CardDescription className="text-[11px]">
                  PostgreSQL 17 物理级隔离与动态连接路由
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px]"
            >
              物理隔离保障
            </Badge>
          </CardHeader>

          <CardContent className="space-y-3 text-xs pt-4">
            <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3 border">
              <Server className="size-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-foreground">
                  Control Plane (saas_control)
                </span>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  维护全局用户身份凭证、组织关系、租户数据库映射表
                  (tenant_database) 及迁移日志。
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3 border">
              <HardDrive className="size-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-foreground">
                  Tenant Data Store (tenant_[slug])
                </span>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  业务切片专属物理独立数据库。请求由 Tenant Context
                  动态解析并绑定连接池，绝不串库。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 卡片 2: 控制面安全与自动化升级中枢 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  运维管控与迁移发布契约
                </CardTitle>
                <CardDescription className="text-[11px]">
                  自动化 Schema 同步、Fail-Closed 阻断策略
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px]"
            >
              零停机升级
            </Badge>
          </CardHeader>

          <CardContent className="space-y-3 text-xs pt-4">
            <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3 border">
              <GitBranch className="size-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-foreground">
                  自动化基线迁移引擎
                </span>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  开通新租户时自动调用 Prisma Migration 引擎，完成基线 DDL
                  下发与版本登记。
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3 border">
              <CheckCircle2 className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-foreground">
                  动态熔断与状态切换 (SUSPENDED)
                </span>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  一键挂起租户物理库，连接池立即驱逐并拦截业务路由，阻断一切潜在脏写入。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
