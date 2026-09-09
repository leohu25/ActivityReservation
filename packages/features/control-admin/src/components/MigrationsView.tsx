"use client";

import React, { useState } from "react";
import {
  Database,
  ArrowUpCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Server,
  Layers,
} from "lucide-react";
import type { MigrationDashboardData } from "../types";
import {
  runPlatformMigrationAction,
  runTenantFleetUpgradeAction,
} from "../actions";

export interface MigrationsViewProps {
  readonly initialData: MigrationDashboardData;
}

export function MigrationsView({
  initialData,
}: MigrationsViewProps): React.JSX.Element {
  const [data, setData] = useState<MigrationDashboardData>(initialData);
  const [isUpgradingPlatform, setIsUpgradingPlatform] = useState(false);
  const [isUpgradingFleet, setIsUpgradingFleet] = useState(false);
  const [upgradingOrgId, setUpgradingOrgId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleUpgradePlatform = async () => {
    if (isUpgradingPlatform) return;
    setIsUpgradingPlatform(true);
    setNotice(null);
    try {
      const res = await runPlatformMigrationAction();
      if (res.success) {
        setNotice({
          type: "success",
          message: `平台数据库升级成功！应用了 ${res.appliedCount ?? 0} 个迁移版本。`,
        });
        setData((prev) => ({
          ...prev,
          platform: {
            ...prev.platform,
            currentVersion: prev.platform.latestAvailableVersion,
            isUpToDate: true,
            pendingCount: 0,
          },
        }));
      } else {
        setNotice({
          type: "error",
          message: res.error || "平台数据库升级失败",
        });
      }
    } finally {
      setIsUpgradingPlatform(false);
    }
  };

  const handleUpgradeFleet = async (targetOrgId?: string) => {
    if (targetOrgId) {
      setUpgradingOrgId(targetOrgId);
    } else {
      setIsUpgradingFleet(true);
    }
    setNotice(null);

    try {
      const res = await runTenantFleetUpgradeAction(targetOrgId);
      if (res.success) {
        setNotice({
          type: "success",
          message: targetOrgId
            ? "租户物理库升级成功！"
            : `租户舰队升级完成：成功升级 ${res.upgradedCount ?? 0} 个，失败 ${res.failedCount ?? 0} 个。`,
        });
        // 更新本地状态
        setData((prev) => {
          const newItems = prev.fleet.items.map((item) => {
            if (!targetOrgId || item.organizationId === targetOrgId) {
              return {
                ...item,
                currentVersion: prev.fleet.latestAvailableVersion,
                isUpToDate: true,
                pendingVersionCount: 0,
              };
            }
            return item;
          });
          const upToDateCount = newItems.filter((i) => i.isUpToDate).length;
          return {
            ...prev,
            fleet: {
              ...prev.fleet,
              upToDateCount,
              pendingCount: newItems.length - upToDateCount,
              items: newItems,
            },
          };
        });
      } else {
        setNotice({
          type: "error",
          message: res.error || "租户升级操作失败",
        });
      }
    } finally {
      setUpgradingOrgId(null);
      setIsUpgradingFleet(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部标题与说明 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Database className="size-6 text-blue-600" />
            数据架构与迁移中枢
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            标准云 SaaS 双层数据演进控制台：平台控制底座 (saas_control)
            与多租户物理库舰队版本管控
          </p>
        </div>
      </div>

      {/* 提示通知条 */}
      {notice && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            notice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === "success" ? (
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="size-5 text-rose-600 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs font-medium underline opacity-80 hover:opacity-100 ml-4"
          >
            关闭
          </button>
        </div>
      )}

      {/* 核心看板卡片区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 卡片 1: 平台控制库 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Server className="size-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    平台控制底座 (Control Plane)
                  </h2>
                  <p className="text-xs text-slate-500">saas_control 物理库</p>
                </div>
              </div>
              {data.platform.isUpToDate ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="size-3.5" />
                  已是最新
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertTriangle className="size-3.5" />
                  待升级 ({data.platform.pendingCount})
                </span>
              )}
            </div>

            <div className="space-y-2 py-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>当前应用版本:</span>
                <span className="font-mono text-slate-900 font-medium">
                  {data.platform.currentVersion ?? "未应用基线"}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>最新可用版本:</span>
                <span className="font-mono text-slate-900 font-medium">
                  {data.platform.latestAvailableVersion ?? "无"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              包含 Better Auth 认证表与租户路由账本
            </span>
            <button
              type="button"
              onClick={handleUpgradePlatform}
              disabled={isUpgradingPlatform || data.platform.isUpToDate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-xs"
            >
              {isUpgradingPlatform ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUpCircle className="size-4" />
              )}
              {data.platform.isUpToDate ? "已是最新版本" : "升级平台底座"}
            </button>
          </div>
        </div>

        {/* 卡片 2: 租户数据舰队 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Layers className="size-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    多租户物理库舰队 (Tenant Fleet)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Database-per-Tenant 独立物理库集群
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                共 {data.fleet.totalCount} 个租户库
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2 text-center">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500">最新代码版本</div>
                <div className="text-xs font-mono font-semibold text-slate-900 mt-1 truncate">
                  {data.fleet.latestAvailableVersion}
                </div>
              </div>
              <div className="p-2.5 bg-emerald-50/60 rounded-xl">
                <div className="text-xs text-emerald-700">已是最新</div>
                <div className="text-lg font-bold text-emerald-700 mt-0.5">
                  {data.fleet.upToDateCount}
                </div>
              </div>
              <div className="p-2.5 bg-amber-50/60 rounded-xl">
                <div className="text-xs text-amber-700">待升级</div>
                <div className="text-lg font-bold text-amber-700 mt-0.5">
                  {data.fleet.pendingCount}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              新租户开通走动态全量 Schema，老租户走增量版本
            </span>
            <button
              type="button"
              onClick={() => handleUpgradeFleet()}
              disabled={isUpgradingFleet || data.fleet.pendingCount === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-xs"
            >
              {isUpgradingFleet ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {data.fleet.pendingCount === 0
                ? "全部租户已最新"
                : `一键升级全部 (${data.fleet.pendingCount})`}
            </button>
          </div>
        </div>
      </div>

      {/* 租户舰队物理库状态明细表格 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            租户物理数据库列表与版本状态
          </h2>
          <span className="text-xs text-slate-400">
            支持单租户灰度推送与精准运维
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3.5">租户信息</th>
                <th className="px-6 py-3.5">物理数据库</th>
                <th className="px-6 py-3.5">当前 Schema 版本</th>
                <th className="px-6 py-3.5">版本对齐状态</th>
                <th className="px-6 py-3.5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.fleet.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-slate-400 text-xs"
                  >
                    暂未发现任何已分配物理库的租户
                  </td>
                </tr>
              ) : (
                data.fleet.items.map((item) => (
                  <tr
                    key={item.organizationId}
                    className="hover:bg-slate-50/60 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {item.organizationName}
                      </div>
                      <div className="text-xs font-mono text-slate-400">
                        {item.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-md">
                        {item.databaseName}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-medium text-slate-900">
                      {item.currentVersion}
                    </td>
                    <td className="px-6 py-4">
                      {item.isUpToDate ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="size-3" />
                          已最新
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="size-3" />
                          落后 {item.pendingVersionCount} 个版本
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleUpgradeFleet(item.organizationId)}
                        disabled={
                          item.isUpToDate ||
                          upgradingOrgId === item.organizationId
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        {upgradingOrgId === item.organizationId ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <ArrowUpCircle className="size-3.5" />
                        )}
                        升级此库
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
