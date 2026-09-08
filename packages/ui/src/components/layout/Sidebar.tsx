"use client";

import type { ComponentType, ReactNode } from "react";

export interface NavItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly href: string;
  readonly requiredAction?: string;
  readonly requiredSubject?: string;
}

export interface SidebarProps {
  readonly navItems?: readonly NavItem[];
  readonly currentPath?: string;
  readonly can?: (action: string, subject: string) => boolean;
  readonly LinkComponent?: ComponentType<{
    href: string;
    className?: string;
    children: ReactNode;
  }>;
}

export const DEFAULT_NAV_ITEMS: readonly NavItem[] = [
  {
    id: "workbench",
    label: "权限控制台",
    icon: "🛡️",
    href: "/workbench",
  },
  {
    id: "procurement",
    label: "采购订单中心",
    icon: "📦",
    href: "/procurement/orders",
    requiredAction: "read",
    requiredSubject: "PurchaseOrder",
  },
  {
    id: "login",
    label: "切换身份 / 账号",
    icon: "🔑",
    href: "/login",
  },
];

const DefaultLink = ({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) => (
  <a href={href} className={className}>
    {children}
  </a>
);

/**
 * ERP 统一后台左侧导航侧边栏
 */
export function Sidebar({
  navItems = DEFAULT_NAV_ITEMS,
  currentPath = "",
  can,
  LinkComponent = DefaultLink,
}: SidebarProps) {
  const visibleItems = navItems.filter((item) => {
    if (!item.requiredAction || !item.requiredSubject) {
      return true;
    }
    if (!can) {
      return true;
    }
    return can(item.requiredAction, item.requiredSubject);
  });

  const Link = LinkComponent;

  return (
    <aside className="w-64 border-r border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50 flex flex-col justify-between shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
          导航菜单
        </div>
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const isActive =
              currentPath === item.href ||
              (item.href !== "/" && currentPath.startsWith(item.href));
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                    : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-xl bg-blue-50/50 p-3.5 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/50">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-400">
          <span>💡</span>
          <span>四层权限体系</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          包含 Better Auth 功能权限、CASL 按钮守卫、Prisma
          数据下推与三态字段控制。
        </p>
      </div>
    </aside>
  );
}
