"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface PlatformConsoleLayoutProps {
  readonly children: React.ReactNode;
}

interface NavItem {
  readonly name: string;
  readonly href: string;
  readonly icon: string;
  readonly description: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  {
    name: "运营总览",
    href: "/overview",
    icon: "📊",
    description: "平台全局指标与健康度",
  },
  {
    name: "租户运维中心",
    href: "/tenants",
    icon: "🏢",
    description: "多租户开通与物理库生命周期",
  },
];

/**
 * 平台运营商控制台统一布局外壳 (包含专用侧边栏与顶栏)
 */
export function PlatformConsoleLayout({
  children,
}: PlatformConsoleLayoutProps): React.JSX.Element {
  const pathname = usePathname();

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/api/auth/sign-out";
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      {/* 左侧专用管理侧边栏 */}
      <aside className="w-64 border-r border-zinc-200 bg-white/70 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70 flex flex-col justify-between shrink-0">
        <div>
          <div className="h-16 flex items-center gap-3 px-6 border-b border-zinc-200 dark:border-zinc-800">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white font-bold text-base shadow-sm shadow-purple-500/30">
              ⚡
            </span>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-100">
                Platform Admin
              </div>
              <div className="text-[10px] text-zinc-400">运营商总控矩阵</div>
            </div>
          </div>

          <nav className="p-4 space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-start gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-purple-50 font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/80"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  }`}
                >
                  <span className="text-base leading-none mt-0.5">
                    {item.icon}
                  </span>
                  <div>
                    <div className="leading-snug">{item.name}</div>
                    <div className="text-[11px] text-zinc-400 font-normal mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 底部信息与退出登录 */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="mb-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-3">
            <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              权限视界
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              跨租户 Control DB 直接运维
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
          >
            退出平台登录
          </button>
        </div>
      </aside>

      {/* 右侧主体工作区 */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-zinc-200 bg-white/70 backdrop-blur px-8 flex items-center justify-between dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-400">
              总控控制台
            </span>
            <span className="text-xs text-zinc-400">/</span>
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {NAV_ITEMS.find(
                (i) => pathname === itemHrefOrPrefix(pathname, i.href),
              )?.name || "控制台"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
              Super Admin Active
            </span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function itemHrefOrPrefix(current: string, href: string): string {
  if (current === href || current.startsWith(`${href}/`)) {
    return href;
  }
  return "";
}
