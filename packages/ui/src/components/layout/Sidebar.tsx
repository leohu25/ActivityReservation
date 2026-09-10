"use client";

import React, { type ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  PackageCheck,
  KeyRound,
  LayoutDashboard,
  Layers,
  Users,
  UserCheck,
  Settings,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

/** 单个导航项模型（支持普通叶子链接或带子项的折叠分组） */
export interface NavItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: ReactNode | string;
  readonly href?: string;
  readonly category?: string;
  readonly badge?: string;
  readonly requiredAction?: string;
  readonly requiredSubject?: string;
  readonly items?: readonly NavItem[];
  readonly children?: readonly NavItem[];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  PackageCheck,
  UserCheck,
  Users,
  ShieldCheck,
  Settings,
  FileText,
  KeyRound,
  Layers,
};

function renderNavIcon(icon: ReactNode | string | undefined): ReactNode {
  if (!icon) {
    return <LayoutDashboard className="size-4" />;
  }
  if (typeof icon === "string") {
    const IconComponent = ICON_MAP[icon] || LayoutDashboard;
    return <IconComponent className="size-4" />;
  }
  return icon;
}

/** 导航分组区块模型 (如业务中心、系统管理) */
export interface NavSection {
  readonly id: string;
  readonly title?: string;
  readonly items: readonly NavItem[];
}

export interface SidebarProps {
  readonly sections?: readonly NavSection[];
  readonly navItems?: readonly NavItem[];
  /** 可选：仅在非 Next.js 路由测试环境或需要强制受控路由时指定，生产中默认自动读取 usePathname() */
  readonly currentPath?: string;
  readonly can?: (action: string, subject: string) => boolean;
  /** 允许的服务端序列化权限规则数组或白名单 key 集合 (例如: ['read:CustomerModule', 'read:Customer']) */
  readonly allowedPermissions?: readonly string[];
}


/** 递归检查项是否可见 */
function isItemVisible(
  item: NavItem,
  can?: (action: string, subject: string) => boolean,
  allowedPermissionsSet?: Set<string>,
): boolean {
  if (item.requiredAction && item.requiredSubject) {
    if (can && !can(item.requiredAction, item.requiredSubject)) {
      return false;
    }
    if (
      allowedPermissionsSet &&
      !allowedPermissionsSet.has(
        `${item.requiredAction}:${item.requiredSubject}`,
      )
    ) {
      return false;
    }
  }

  const subItems = item.items ?? item.children;
  if (subItems && subItems.length > 0) {
    return subItems.some((child) =>
      isItemVisible(child, can, allowedPermissionsSet),
    );
  }

  return true;
}

/** 过滤出当前用户可见的项列表 */
function filterVisibleItems(
  items: readonly NavItem[],
  can?: (action: string, subject: string) => boolean,
  allowedPermissionsSet?: Set<string>,
): NavItem[] {
  const result: NavItem[] = [];

  for (const item of items) {
    if (!isItemVisible(item, can, allowedPermissionsSet)) {
      continue;
    }

    const subItems = item.items ?? item.children;
    if (subItems && subItems.length > 0) {
      const visibleSubItems = filterVisibleItems(
        subItems,
        can,
        allowedPermissionsSet,
      );
      result.push({
        ...item,
        items: visibleSubItems,
        children: visibleSubItems,
      });
    } else {
      result.push(item);
    }
  }

  return result;
}

/** 判断路径是否处于激活态 */
function isPathActive(currentPath: string, targetHref?: string): boolean {
  if (!targetHref) {
    return false;
  }
  if (targetHref === "/") {
    return currentPath === "/";
  }
  return currentPath === targetHref || currentPath.startsWith(targetHref + "/");
}

/** 检查组内是否存在被激活的子链接 */
function hasActiveChild(item: NavItem, currentPath: string): boolean {
  const subItems = item.items ?? item.children;
  if (!subItems || subItems.length === 0) {
    return false;
  }
  return subItems.some((child) => isPathActive(currentPath, child.href));
}

/**
 * ERP 统一后台左侧导航侧边栏
 * 遵循 Next.js App Router 官方标准：直接使用 usePathname() 与 next/link
 * 支持多级折叠树、依据当前路径自动展开高亮、布局持久挂载且页面无刷新软跳转
 */
export function Sidebar({
  sections,
  navItems,
  currentPath: propCurrentPath,
  can,
  allowedPermissions,
}: SidebarProps) {
  const allowedPermissionsSet = allowedPermissions
    ? new Set(allowedPermissions)
    : undefined;

  // 1. Next.js 官方标准：生产中由 usePathname() 自动获取激活路由（支持单测传入 currentPath 覆盖）
  const routerPath = usePathname();
  const currentPath = propCurrentPath ?? routerPath ?? "";

  // 2. 确定数据源：若未提供 sections，支持将 navItems 适配为标准结构，默认空数组
  const effectiveSections: readonly NavSection[] =
    sections ??
    (navItems ? [{ id: "custom", items: navItems }] : []);

  // 3. 状态：记录折叠分组的展开/折叠状态
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // 4. 页面加载或路径变动时，自动展开含有当前激活页面的分组
  useEffect(() => {
    if (!currentPath) return;

    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const section of effectiveSections) {
        for (const item of section.items) {
          if (hasActiveChild(item, currentPath)) {
            next[item.id] = true;
          }
        }
      }
      return next;
    });
  }, [currentPath, effectiveSections]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between shrink-0 select-none overflow-y-auto">
      <div className="space-y-4">
        {/* 顶部轻量标签 */}
        <div className="flex items-center gap-1.5 px-2.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          <Layers className="size-3.5 text-slate-400" />
          <span>核心功能导航</span>
        </div>

        {/* 导航分区块列表 */}
        <div className="space-y-4">
          {effectiveSections.map((section) => {
            const visibleItems = filterVisibleItems(
              section.items,
              can,
              allowedPermissionsSet,
            );
            if (visibleItems.length === 0) {
              return null;
            }

            return (
              <div key={section.id} className="space-y-1">
                {section.title ? (
                  <div className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                    {section.title}
                  </div>
                ) : null}

                <nav className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const subItems = item.items ?? item.children;
                    const isGroup = subItems && subItems.length > 0;

                    if (isGroup) {
                      // 是否有子链接被激活
                      const childActive = hasActiveChild(item, currentPath);
                      const isOpen = openGroups[item.id] ?? childActive;

                      return (
                        <div key={item.id} className="space-y-0.5">
                          {/* 分组标题展开按钮 */}
                          <button
                            type="button"
                            onClick={() => toggleGroup(item.id)}
                            className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 ${
                              childActive
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`transition-colors ${
                                  childActive
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300"
                                }`}
                              >
                                {renderNavIcon(item.icon)}
                              </span>
                              <span>{item.label}</span>
                              {item.badge ? (
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                  {item.badge}
                                </span>
                              ) : null}
                            </div>
                            <span className="text-slate-400 transition-transform duration-150">
                              {isOpen ? (
                                <ChevronDown className="size-3.5" />
                              ) : (
                                <ChevronRight className="size-3.5" />
                              )}
                            </span>
                          </button>

                          {/* 折叠二级子项列表 */}
                          {isOpen ? (
                            <div className="ml-5 border-l border-slate-100 pl-3 py-0.5 space-y-0.5 dark:border-slate-800">
                              {subItems.map((child) => {
                                const isSubActive = isPathActive(
                                  currentPath,
                                  child.href,
                                );

                                return (
                                  <Link
                                    key={child.id}
                                    href={child.href ?? "#"}
                                    className={`group flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-all duration-150 ${
                                      isSubActive
                                        ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200"
                                    }`}
                                  >
                                    <span>{child.label}</span>
                                    {child.badge ? (
                                      <span className="text-[10px] font-normal text-slate-400">
                                        {child.badge}
                                      </span>
                                    ) : null}
                                  </Link>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    }

                    // 单级叶子项
                    const isActive = isPathActive(currentPath, item.href);

                    return (
                      <Link
                        key={item.id}
                        href={item.href ?? "#"}
                        className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 ${
                          isActive
                            ? "bg-blue-600 text-white shadow-xs shadow-blue-500/30"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`transition-colors ${
                              isActive
                                ? "text-white"
                                : "text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300"
                            }`}
                          >
                            {renderNavIcon(item.icon)}
                          </span>
                          <span>{item.label}</span>
                        </div>
                        {item.badge ? (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] ${
                              isActive
                                ? "bg-blue-700 text-white"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>
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
