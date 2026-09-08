"use client";

import React from "react";
import Link from "next/link";

export default function PlatformDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isAuthError =
    error.message?.includes("平台超级管理员权限") ||
    error.message?.includes("Platform Super Admin");

  if (isAuthError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 text-2xl font-bold">
            🛡️
          </div>
          <h2 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
            访问受限：需要平台超级管理员权限
          </h2>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            您当前登录的账号未在平台超管白名单中。平台运营商总控面板仅供系统管理员访问。
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/login"
              className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-500 transition-colors"
            >
              切换为超级管理员账号登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-bold text-red-600">控制台发生异常</h3>
        <p className="mt-2 text-xs text-zinc-500">{error.message}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          重试
        </button>
      </div>
    </div>
  );
}
