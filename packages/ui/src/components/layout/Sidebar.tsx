"use client";

import React, { type ComponentType, type ReactNode } from "react";
import {
  ShieldCheck,
  PackageCheck,
  KeyRound,
  LayoutDashboard,
  Layers,
  Users,
} from "lucide-react";

export interface NavItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: ReactNode;
  readonly href: string;
  readonly category?: string;
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
    category: "BASE",
    icon: <ShieldCheck className="size-4" />,
    href: "/workbench",
  },
  {
    id: "procurement",
    label: "采购订单中心",
    category: "BIZ",
    icon: <PackageCheck className="size-4" />,
    href: "/procurement/orders",
    requiredAction: "read",
    requiredSubject: "PurchaseOrder",
  },
  {
    id: "settings-roles",
    label: "角色权限管理",
    category: "SYSTEM",
    icon: <Users className="size-4" />,
    href: "/settings/roles",
  },
  {
    id: "login",
    label: "切换身份 / 账号",
    category: "SYSTEM",
    icon: <KeyRound className="size-4" />,
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
 * ERP 统一后台左侧导航侧边栏 (遵循现代工业轻量数智风)
 * 全面采用纯白浮动、微细描边与 Lucide 矢量图标，杜绝 Emoji
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
    <aside className="w-60 border-r border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between shrink-0 select-none">
      <div className="space-y-4">
        {/* 顶部轻量标签 */}
        <div className="flex items-center gap-1.5 px-2.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          <Layers className="size-3 text-slate-400" />
          <span>核心功能导航</span>
        </div>

        {/* 导航项列表 */}
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const isActive =
              currentPath === item.href ||
              (item.href !== "/" && currentPath.startsWith(item.href));
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs shadow-blue-500/30"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
                }`}
              >
                <span
                  className={`transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300"
                  }`}
                >
                  {item.icon || <LayoutDashboard className="size-4" />}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 底部四层权限架构说明微卡片 */}
      <div className="rounded-xl bg-blue-50/60 p-3 border border-blue-100/80 dark:bg-blue-950/20 dark:border-blue-900/40">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 dark:text-blue-400">
          <ShieldCheck className="size-3.5" />
          <span>四层权限体系守护</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          涵盖 Better Auth 功能权限、CASL 按钮守卫、Prisma
          数据下推与三态字段控制。
        </p>
      </div>
    </aside>
  );
}
