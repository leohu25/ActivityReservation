"use client";

import React from "react";
import type { PlatformTenantItem } from "../types";

export interface TenantLifecycleTableProps {
  readonly tenants: readonly PlatformTenantItem[];
  readonly isPending: boolean;
  readonly onOpenProvision: () => void;
  readonly onToggleStatus: (orgId: string, currentStatus: string) => void;
}

/**
 * 租户全景生命周期运维表格组件
 */
export function TenantLifecycleTable({
  tenants,
  isPending,
  onOpenProvision,
  onToggleStatus,
}: TenantLifecycleTableProps): React.JSX.Element {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 border-b border-zinc-200 p-6 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            租户与物理数据库总控清单
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            查看每个租户分配的独立物理数据库名、版本号、实时生命周期状态与管理员。
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenProvision}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 transition-colors"
        >
          <span>+</span>
          <span>开通新租户 (Provision)</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
          <thead className="border-b border-zinc-200 bg-zinc-50/75 text-xs font-semibold uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
            <tr>
              <th scope="col" className="px-6 py-4">
                租户名称 / Slug
              </th>
              <th scope="col" className="px-6 py-4">
                独立物理数据库 (Database-per-Tenant)
              </th>
              <th scope="col" className="px-6 py-4">
                结构版本 (Migration)
              </th>
              <th scope="col" className="px-6 py-4">
                租户库状态
              </th>
              <th scope="col" className="px-6 py-4">
                成员规模
              </th>
              <th scope="col" className="px-6 py-4 text-right">
                运维管控
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {tenants.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-400">
                  暂无租户记录，点击右上角开通第一个租户
                </td>
              </tr>
            ) : (
              tenants.map((item) => {
                const dbStatus = item.database?.status ?? "PROVISIONING";
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.name}
                      </div>
                      <div className="text-xs text-zinc-400">
                        slug: {item.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                      {item.database?.databaseName ? (
                        <span className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                          {item.database.databaseName}
                        </span>
                      ) : (
                        <span className="text-zinc-400">待初始化开通</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">
                      {item.database?.schemaVersion || "0"}
                      {item.latestMigration && (
                        <span className="block text-[11px] text-zinc-400">
                          最新: {item.latestMigration.migrationName}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          dbStatus === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : dbStatus === "SUSPENDED"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            dbStatus === "ACTIVE"
                              ? "bg-emerald-500"
                              : dbStatus === "SUSPENDED"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          }`}
                        />
                        {dbStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">{item.memberCount} 人</td>
                    <td className="px-6 py-4 text-right">
                      {item.database ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => onToggleStatus(item.id, dbStatus)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                            dbStatus === "ACTIVE"
                              ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                              : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                          }`}
                        >
                          {dbStatus === "ACTIVE" ? "挂起租户" : "恢复正常"}
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-400">处理中</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
