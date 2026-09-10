"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, RotateCcw, Database, AlertTriangle } from "lucide-react";

/**
 * 控制平面全局异常与权限拦截视图
 * 遵循现代轻量数智风规范：纯白浮动大圆角卡片、科技蓝主色、无 Emoji
 */
export default function ControlDashboardError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}): React.JSX.Element {
  const isAuthError =
    error.message?.includes("控制平面超级管理员权限") ||
    error.message?.includes("平台超级管理员权限") ||
    error.message?.includes("Control Plane Super Admin");

  const isDbConnectionError =
    error.message?.includes("ECONNREFUSED") ||
    error.message?.includes("Can't reach database") ||
    error.message?.includes("P1001") ||
    error.message?.includes("数据库未连接") ||
    error.message?.includes("缺少 CONTROL_DATABASE_URL");

  if (isDbConnectionError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center font-sans antialiased text-slate-900">
        <div className="w-full max-w-lg rounded-3xl border border-amber-200/80 bg-white p-8 sm:p-10 shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 shadow-xs">
            <Database className="size-7 animate-pulse" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
            数据库未连接 / 服务不可用
          </h2>
          <div className="mt-4 p-3.5 bg-amber-50/60 rounded-xl text-left text-xs text-amber-900 border border-amber-100 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="size-4 text-amber-600 shrink-0" />
              <span>可能的原因与排查指南：</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-slate-600">
              <li>
                本地 <strong>Docker 容器</strong>（如 PostgreSQL 55433
                端口）尚未启动。
              </li>
              <li>
                未配置 <strong>apps/control/.env.local</strong>，或其中的{" "}
                <code>CONTROL_DATABASE_URL</code> 地址不正确。
              </li>
            </ul>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-all cursor-pointer shadow-xs"
            >
              <RotateCcw className="size-3.5" />
              <span>重试连接</span>
            </button>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
            >
              返回登录页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center font-sans antialiased text-slate-900">
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-10 shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 shadow-xs">
            <ShieldAlert className="size-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
            访问受限：需要控制平面超级管理员权限
          </h2>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            您当前登录的账号未在控制平面超管白名单中。控制平面总控面板仅供系统管理员访问。
          </p>

          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer"
            >
              切换为超级管理员账号登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center font-sans antialiased text-slate-900">
      <div className="w-full max-w-md rounded-2xl border border-rose-200/80 bg-white p-8 shadow-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60 mb-3">
          <ShieldAlert className="size-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">控制面板发生异常</h3>
        <p className="mt-1.5 text-xs text-slate-500">{error.message}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <RotateCcw className="size-3.5" />
          <span>重新尝试</span>
        </button>
      </div>
    </div>
  );
}
