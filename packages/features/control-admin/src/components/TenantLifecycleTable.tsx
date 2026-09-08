"use client";

import React from "react";
import type { ControlTenantItem } from "../types";
import {
  Plus,
  Database,
  Building2,
  PauseCircle,
  PlayCircle,
  Loader2,
  Users,
  GitCommit,
} from "lucide-react";

export interface TenantLifecycleTableProps {
  /** 租户列表及其实时物理库状态 */
  readonly tenants: readonly ControlTenantItem[];
  /** 操作进行中状态 */
  readonly isPending: boolean;
  /** 打开开通租户弹窗回调 */
  readonly onOpenProvision: () => void;
  /** 切换租户启停状态回调 */
  readonly onToggleStatus: (orgId: string, currentStatus: string) => void;
}

/**
 * 租户全景生命周期运维表格组件 (遵循现代轻量工业数智风)
 * 纯白浮动大圆角卡片、微描边、规范微胶囊状态标与 Lucide 矢量图标
 */
export function TenantLifecycleTable({
  tenants,
  isPending,
  onOpenProvision,
  onToggleStatus,
}: TenantLifecycleTableProps): React.JSX.Element {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      {/* 头部标题与开通 CTA */}
      <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Building2 className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              租户与独立物理数据库管控清单
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              实时管控各租户的独立物理库分配、Schema
              迁移版本、生命周期启停与成员规模。
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenProvision}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer"
        >
          <Plus className="size-3.5" />
          <span>开通新租户 (Provision)</span>
        </button>
      </div>

      {/* 表格主体 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th scope="col" className="px-6 py-3.5">
                租户组织 / Slug
              </th>
              <th scope="col" className="px-6 py-3.5">
                独立物理数据库 (Database-per-Tenant)
              </th>
              <th scope="col" className="px-6 py-3.5">
                Schema 版本 (Migration)
              </th>
              <th scope="col" className="px-6 py-3.5">
                物理库生命周期
              </th>
              <th scope="col" className="px-6 py-3.5">
                企业成员
              </th>
              <th scope="col" className="px-6 py-3.5 text-right">
                控制面运维
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenants.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <Database className="size-6" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    暂无租户记录
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    点击右上角“开通新租户”即可自动创建 PostgreSQL
                    独立物理库并初始化。
                  </p>
                </td>
              </tr>
            ) : (
              tenants.map((item) => {
                const dbStatus = item.database?.status ?? "PROVISIONING";
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* 租户组织信息 */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {item.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        slug: {item.slug}
                      </div>
                    </td>

                    {/* 独立物理数据库名 */}
                    <td className="px-6 py-4">
                      {item.database?.databaseName ? (
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/70 bg-slate-100/70 px-2.5 py-1 font-mono text-xs font-semibold text-slate-800">
                          <Database className="size-3 text-blue-600" />
                          <span>{item.database.databaseName}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <Loader2 className="size-3 animate-spin" />
                          待初始化分配
                        </span>
                      )}
                    </td>

                    {/* Schema 版本与最新迁移 */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-mono font-bold text-slate-700 tabular-nums">
                        <GitCommit className="size-3 text-slate-400" />
                        <span>v{item.database?.schemaVersion ?? 0}</span>
                      </div>
                      {item.latestMigration && (
                        <span
                          className="block text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]"
                          title={item.latestMigration.migrationName}
                        >
                          {item.latestMigration.migrationName}
                        </span>
                      )}
                    </td>

                    {/* 物理库生命周期微胶囊状态标 */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                          dbStatus === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                            : dbStatus === "SUSPENDED"
                              ? "bg-amber-50 text-amber-700 border-amber-200/80"
                              : "bg-rose-50 text-rose-700 border-rose-200/80"
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

                    {/* 企业成员规模 */}
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 text-slate-700 font-semibold tabular-nums">
                        <Users className="size-3.5 text-slate-400" />
                        <span>{item.memberCount} 人</span>
                      </div>
                    </td>

                    {/* 运维管控按钮 */}
                    <td className="px-6 py-4 text-right">
                      {item.database ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => onToggleStatus(item.id, dbStatus)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                            dbStatus === "ACTIVE"
                              ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                              : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {isPending ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : dbStatus === "ACTIVE" ? (
                            <PauseCircle className="size-3.5" />
                          ) : (
                            <PlayCircle className="size-3.5" />
                          )}
                          <span>
                            {dbStatus === "ACTIVE" ? "挂起管控" : "恢复正常"}
                          </span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">
                          开通中...
                        </span>
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
