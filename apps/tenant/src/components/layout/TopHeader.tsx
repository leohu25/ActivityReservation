"use client";

import { OrgSwitcher } from "@/components/auth/OrgSwitcher";
import { signOut } from "@/lib/auth/client";

interface TopHeaderProps {
  readonly user?: {
    name?: string | null;
    email: string;
  } | null;
  readonly activeOrgId?: string | null;
  readonly onOpenLogin?: () => void;
}

/**
 * ERP 统一后台顶部栏
 * 包含：系统品牌、租户切换器、当前用户信息与登录/退出操作
 */
export function TopHeader({ user, activeOrgId, onOpenLogin }: TopHeaderProps) {
  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20">
            CR
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              晨润 ERP
            </span>
            <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
              SaaS Pro
            </span>
          </div>
        </div>

        {user && <OrgSwitcher activeOrgId={activeOrgId} />}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {user.name || user.email.split("@")[0]}
              </span>
              <span className="text-xs text-zinc-400">{user.email}</span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
            >
              退出登录
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenLogin}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
          >
            登录 / 注册
          </button>
        )}
      </div>
    </header>
  );
}
