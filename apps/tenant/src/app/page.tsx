import Link from "next/link";
import { getServerAuthRuntime } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * 根路由页面：若已登录且有激活组织直接进入工作台，否则展示登录引导门户
 */
export default async function RootPage() {
  const runtime = getServerAuthRuntime();
  const session = await runtime.auth.api.getSession({
    headers: await headers(),
  });

  if (session?.session.activeOrganizationId) {
    redirect("/workbench");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-10 shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-xl shadow-lg shadow-blue-500/30">
          CR
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            晨润 ERP 系统
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            基于 Next.js 16 + PostgreSQL Database-per-Tenant
            <br />
            多租户四层权限架构企业级管理系统
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Link
            href="/login"
            className="block w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-500 transition-colors"
          >
            安全登录 / 切换租户
          </Link>
          <Link
            href="/workbench"
            className="block w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 transition-colors"
          >
            进入控制台主页
          </Link>
        </div>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-400">
          支持多租户物理隔离与基于 CASL 的动态权限下推
        </div>
      </div>
    </div>
  );
}
