"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, RotateCcw } from "lucide-react";

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
