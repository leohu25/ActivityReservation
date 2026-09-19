"use client";

import React, { useState, useTransition } from "react";
import type { MigrationDashboardData } from "../types";
import {
  runPlatformMigrationAction,
  runTenantFleetUpgradeAction,
} from "../actions";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  toast,
  ConfirmDialog,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@base/ui";
import {
  Database,
  Layers,
  ArrowUpCircle,
  CheckCircle2,
  RefreshCw,
  Clock,
  Sparkles,
  Server,
} from "lucide-react";
import { useRouter } from "next/navigation";

export interface MigrationsViewProps {
  readonly data: MigrationDashboardData;
}

/**
 * 控制平面数据架构与迁移中枢交互视图
 * 基于 shadcn ui (Card, Badge, Button) 组合布局，自适应暗色与亮色主题
 */
export function MigrationsView({
  data,
}: MigrationsViewProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [upgradeTarget, setUpgradeTarget] = useState<{
    targetOrgId?: string;
    label: string;
  } | null>(null);

  const handleUpgradePlatform = () => {
    startTransition(async () => {
      try {
        const res = await runPlatformMigrationAction();
        if (res.success) {
          toast.success("平台数据库 Schema 升级成功！");
          router.refresh();
        } else {
          toast.error(res.error || "平台升级失败");
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "升级请求异常");
      }
    });
  };

  const handleTriggerUpgradeFleet = (targetOrgId?: string) => {
    const isSingle = Boolean(targetOrgId);
    const label = isSingle ? "指定租户物理库" : "全部租户舰队物理库";
    setUpgradeTarget({ targetOrgId, label });
  };

  const handleConfirmUpgradeFleet = () => {
    if (!upgradeTarget) return;
    const { targetOrgId } = upgradeTarget;
    setUpgradeTarget(null);

    startTransition(async () => {
      try {
        const res = await runTenantFleetUpgradeAction(targetOrgId);
        if (res.success) {
          toast.success(
            `舰队升级执行完毕：成功 ${res.upgradedCount ?? 0} 个，失败 ${res.failedCount ?? 0} 个`,
          );
          router.refresh();
        } else {
          toast.error(res.error || "舰队升级失败");
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "舰队升级异常");
      }
    });
  };

  const { platform, fleet } = data;

  return (
    <div className="space-y-6">
      {/* 顶部标题栏卡片 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Database className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground">
                  数据架构与迁移中枢
                </CardTitle>
                <Badge
                  variant="outline"
                  className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs"
                >
                  Prisma DDL 驱动
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                实时总控平台底座数据库 (saas_control)
                与多租户物理独立数据库的基线升级。
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => router.refresh()}
            className="gap-2 cursor-pointer"
          >
            <RefreshCw
              className={`size-3.5 ${isPending ? "animate-spin" : ""}`}
            />
            <span>刷新状态</span>
          </Button>
        </CardHeader>
      </Card>

      {/* 左右双子看板 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 左侧卡片：平台底座控制库 */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="space-y-3 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Server className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    平台控制底座 (Control Plane)
                  </CardTitle>
                  <CardDescription className="text-[11px] font-mono">
                    saas_control 物理库
                  </CardDescription>
                </div>
              </div>
              {platform.isUpToDate ? (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 text-xs"
                >
                  <CheckCircle2 className="size-3" />
                  已是最新
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 text-xs"
                >
                  <Clock className="size-3" />
                  待升级 ({platform.pendingCount})
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border bg-muted/40 p-3">
                <span className="text-[10px] text-muted-foreground block font-medium">
                  当前应用版本
                </span>
                <span className="text-xs font-mono font-bold text-foreground mt-0.5 block">
                  {platform.currentVersion ?? "baseline"}
                </span>
              </div>
              <div className="rounded-xl border bg-muted/40 p-3">
                <span className="text-[10px] text-muted-foreground block font-medium">
                  最新可用版本
                </span>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">
                  {platform.latestAvailableVersion ?? "baseline"}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              包含 Better Auth 认证表与租户路由账本
            </span>
            <Button
              size="sm"
              disabled={platform.isUpToDate || isPending}
              onClick={handleUpgradePlatform}
              className="gap-2 cursor-pointer"
            >
              <ArrowUpCircle className="size-3.5" />
              <span>
                {platform.isUpToDate ? "已是最新版本" : "升级平台底座"}
              </span>
            </Button>
          </CardContent>
        </Card>

        {/* 右侧卡片：多租户物理库舰队 */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="space-y-3 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Layers className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    多租户物理库舰队 (Tenant Fleet)
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Database-per-Tenant 独立物理库集群
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs font-bold">
                共 {fleet.totalCount} 个租户库
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-xl border bg-muted/40 p-2.5 text-center">
                <span className="text-[10px] text-muted-foreground block">
                  最新代码版本
                </span>
                <span className="text-xs font-mono font-bold text-foreground mt-0.5 block truncate">
                  {fleet.latestAvailableVersion || "baseline"}
                </span>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-center">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                  已是最新
                </span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block tabular-nums">
                  {fleet.upToDateCount}
                </span>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 text-center">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 block">
                  待升级
                </span>
                <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 block tabular-nums">
                  {fleet.pendingCount}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              新租户开通走动态全量 Schema，老租户走增量版本
            </span>
            <Button
              size="sm"
              variant={fleet.pendingCount > 0 ? "default" : "secondary"}
              disabled={fleet.pendingCount === 0 || isPending}
              onClick={() => handleTriggerUpgradeFleet()}
              className="gap-2 cursor-pointer"
            >
              <Sparkles className="size-3.5" />
              <span>
                {fleet.pendingCount === 0
                  ? "全部租户已最新"
                  : `升级舰队 (${fleet.pendingCount})`}
              </span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 底部租户舰队详细表格 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-sm font-bold text-foreground">
              租户物理数据库列表与版本状态
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              支持单租户灰度推送与精准运维
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full text-xs">
              <TableHeader className="bg-muted/50 font-medium">
                <TableRow className="border-b border-border">
                  <TableHead className="px-6 py-3.5 text-xs font-semibold text-muted-foreground">
                    租户信息
                  </TableHead>
                  <TableHead className="px-6 py-3.5 text-xs font-semibold text-muted-foreground">
                    物理数据库
                  </TableHead>
                  <TableHead className="px-6 py-3.5 text-xs font-semibold text-muted-foreground">
                    当前 SCHEMA 版本
                  </TableHead>
                  <TableHead className="px-6 py-3.5 text-xs font-semibold text-muted-foreground">
                    版本对齐状态
                  </TableHead>
                  <TableHead className="px-6 py-3.5 text-right text-xs font-semibold text-muted-foreground">
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60">
                {fleet.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-12 text-center text-xs text-muted-foreground"
                    >
                      暂无租户物理数据库记录
                    </TableCell>
                  </TableRow>
                ) : (
                  fleet.items.map((item) => (
                    <TableRow
                      key={item.organizationId}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <TableCell className="px-6 py-4">
                        <div className="font-bold text-foreground text-sm">
                          {item.organizationName}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                          {item.slug}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="rounded-md border bg-muted/40 px-2 py-1 font-mono text-xs font-semibold text-foreground">
                          {item.databaseName}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="font-mono font-bold text-foreground">
                          v{item.currentVersion}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {item.isUpToDate ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 text-[11px]"
                          >
                            <CheckCircle2 className="size-3" />
                            已最新
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 text-[11px]"
                          >
                            <Clock className="size-3" />
                            待升级 ({item.pendingVersionCount})
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        {item.isUpToDate ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled
                            className="text-xs opacity-50"
                          >
                            已就绪
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() =>
                              handleTriggerUpgradeFleet(item.organizationId)
                            }
                            className="gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 cursor-pointer"
                          >
                            <ArrowUpCircle className="size-3.5" />
                            <span>升级此库</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 舰队升级模态确认弹窗 (ConfirmDialog 替代原生 window.confirm) */}
      <ConfirmDialog
        open={Boolean(upgradeTarget)}
        onOpenChange={(open) => {
          if (!open) setUpgradeTarget(null);
        }}
        title={`确认触发${upgradeTarget?.label || ""}版本升级？`}
        description="升级操作将下发最新 DDL 变更至对应的 PostgreSQL 独立物理数据库，升级期间将短暂维持写入隔离，是否确认继续？"
        confirmText="确认升级"
        onConfirm={async () => {
          handleConfirmUpgradeFleet();
        }}
      />
    </div>
  );
}
