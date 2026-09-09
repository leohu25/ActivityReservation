"use client";

import React from "react";
import Link from "next/link";
import { Database, ShieldAlert, RotateCcw, AlertTriangle } from "lucide-react";

/**
 * 租户全局友好异常处理页面
 * 精准识别“数据库无法连接 (Docker未启动或端口不通)”等基础设施问题，提供友好的工业风运维指引
 */
export default function TenantGlobalError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}): React.JSX.Element {
  const isDbConnectionError =
    error.message?.includes("Can't reach database server") ||
    error.message?.includes("connect ECONNREFUSED") ||
    error.message?.includes("P1001") ||
    error.message?.includes("database server at");

  const isAuthGateError =
    error.message?.includes("TENANT_MEMBER_NOT_FOUND") ||
    error.message?.includes("TENANT_MEMBER_SUSPENDED") ||
    error.message?.includes("已被停用");

  // 1. 数据库无法连接（如 Docker / PostgreSQL 容器未启动）
  if (isDbConnectionError) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center font-sans antialiased text-zinc-900 dark:text-zinc-50">
        <div className="w-full max-w-lg rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-zinc-900 p-8 shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800 mb-4">
            <Database className="size-7 animate-pulse" />
          </div>

          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            数据库连接中断 / 基础设施不可用
          </h2>

          <div className="mt-3 p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-lg text-left text-xs text-amber-900 dark:text-amber-200 border border-amber-100 dark:border-amber-900/40 space-y-1.5">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>可能的原因与排查指南：</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-zinc-600 dark:text-zinc-300">
              <li>
                本地 <strong>Docker 容器</strong> 或 <strong>OrbStack</strong>{" "}
                尚未启动或意外退出了。
              </li>
              <li>
                PostgreSQL 数据库服务正在启动中，或端口（如
                55432/55433）暂未监听就绪。
              </li>
            </ul>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-5 py-2.5 text-xs font-bold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="size-4" />
              <span>Docker 已开启，重试连接</span>
            </button>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              返回登录页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. 账号被停用或无当前租户权限
  if (isAuthGateError) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center font-sans antialiased text-zinc-900 dark:text-zinc-50">
        <div className="w-full max-w-md rounded-2xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-zinc-900 p-8 shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-200/60 dark:border-red-800 mb-4">
            <ShieldAlert className="size-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            访问受限：员工档案状态异常
          </h2>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            您在当前租户下的员工档案未处于激活正常状态（可能已被管理员停用或尚未完成入职建档）。
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 py-2.5 text-xs font-bold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all"
            >
              切换账号登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. 通用兜底异常
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center font-sans antialiased text-zinc-900 dark:text-zinc-50">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 mb-4">
          <ShieldAlert className="size-6" />
        </div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
          系统处理遇到问题
        </h3>
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 max-h-24 overflow-y-auto font-mono bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded border border-zinc-100 dark:border-zinc-800">
          {error.message || "未知异常"}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-5 py-2.5 text-xs font-bold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all cursor-pointer"
        >
          <RotateCcw className="size-3.5" />
          <span>重试当前操作</span>
        </button>
      </div>
    </div>
  );
}
