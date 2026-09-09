"use client";

import React, {
  type ComponentType,
  type ReactNode,
  useState,
  useEffect,
} from "react";
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
  readonly icon?: ReactNode;
  readonly href?: string;
  readonly category?: string;
  readonly badge?: string;
  readonly requiredAction?: string;
  readonly requiredSubject?: string;
  readonly items?: readonly NavItem[];
  readonly children?: readonly NavItem[];
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
  readonly currentPath?: string;
  readonly can?: (action: string, subject: string) => boolean;
  readonly LinkComponent?: ComponentType<{
    href: string;
    className?: string;
    children: ReactNode;
  }>;
}

/** 遵循设计规范第 48 节的标准租户导航菜单清单 */
export const DEFAULT_NAV_SECTIONS: readonly NavSection[] = [
  {
    id: "base",
    items: [
      {
        id: "workbench",
        label: "工作台",
        icon: <LayoutDashboard className="size-4" />,
        href: "/workbench",
      },
    ],
  },
  {
    id: "customer",
    items: [
      {
        id: "group-customer-center",
        label: "客户中心",
        icon: <UserCheck className="size-4" />,
        items: [
          {
            id: "customer-customers",
            label: "客户档案",
            href: "/customer/customers",
            requiredAction: "read",
            requiredSubject: "Customer",
          },
          {
            id: "customer-stores",
            label: "门店档案",
            href: "/customer/stores",
            requiredAction: "read",
            requiredSubject: "CustomerStore",
          },
          {
            id: "customer-categories-tags",
            label: "分类与标签",
            href: "/customer/categories-tags",
            requiredAction: "read",
            requiredSubject: "CustomerCategory",
          },
          {
            id: "customer-quotes",
            label: "门店报价单",
            href: "/customer/quotes",
            requiredAction: "read",
            requiredSubject: "CustomerQuote",
          },
        ],
      },
    ],
  },
  {
    id: "biz",
    title: "业务中心",
    items: [
      {
        id: "procurement",
        label: "采购订单中心",
        icon: <PackageCheck className="size-4" />,
        href: "/procurement/orders",
        requiredAction: "read",
        requiredSubject: "PurchaseOrder",
      },
    ],
  },
  {
    id: "system",
    title: "系统管理",
    items: [
      {
        id: "group-organization",
        label: "组织架构",
        icon: <Users className="size-4" />,
        items: [
          {
            id: "org-employees",
            label: "员工管理",
            href: "/organization/employees",
          },
          {
            id: "org-departments",
            label: "部门管理",
            href: "/organization/departments",
          },
          {
            id: "org-positions",
            label: "岗位管理",
            href: "/organization/positions",
          },
        ],
      },
      {
        id: "group-permissions",
        label: "权限管理",
        icon: <ShieldCheck className="size-4" />,
        items: [
          {
            id: "settings-roles",
            label: "角色权限管理",
            href: "/settings/roles",
          },
        ],
      },
      {
        id: "group-settings",
        label: "企业设置",
        icon: <Settings className="size-4" />,
        items: [
          {
            id: "settings-company",
            label: "企业信息",
            href: "/settings/company",
          },
          {
            id: "settings-general",
            label: "基础设置",
            href: "/settings/general",
          },
          {
            id: "settings-security",
            label: "安全设置",
            href: "/settings/security",
          },
        ],
      },
      {
        id: "group-audit",
        label: "审计日志",
        badge: "P1",
        icon: <FileText className="size-4" />,
        items: [
          {
            id: "audit-operations",
            label: "操作日志",
            href: "/audit/operations",
          },
          {
            id: "audit-logins",
            label: "登录日志",
            href: "/audit/logins",
          },
          {
            id: "audit-permissions",
            label: "权限变更日志",
            href: "/audit/permissions",
          },
        ],
      },
    ],
  },
  {
    id: "auth",
    items: [
      {
        id: "login",
        label: "切换身份 / 账号",
        icon: <KeyRound className="size-4" />,
        href: "/login",
      },
    ],
  },
];

/** 扁平后备默认清单 (兼容旧版调用) */
export const DEFAULT_NAV_ITEMS: readonly NavItem[] =
  DEFAULT_NAV_SECTIONS.flatMap((section) => section.items);

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

/** 递归检查项是否可见 */
function isItemVisible(
  item: NavItem,
  can?: (action: string, subject: string) => boolean,
): boolean {
  if (item.requiredAction && item.requiredSubject && can) {
    if (!can(item.requiredAction, item.requiredSubject)) {
      return false;
    }
  }

  const subItems = item.items ?? item.children;
  if (subItems && subItems.length > 0) {
    return subItems.some((child) => isItemVisible(child, can));
  }

  return true;
}

/** 过滤出当前用户可见的项列表 */
function filterVisibleItems(
  items: readonly NavItem[],
  can?: (action: string, subject: string) => boolean,
): NavItem[] {
  const result: NavItem[] = [];

  for (const item of items) {
    if (!isItemVisible(item, can)) {
      continue;
    }

    const subItems = item.items ?? item.children;
    if (subItems && subItems.length > 0) {
      const visibleSubItems = filterVisibleItems(subItems, can);
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
 * ERP 统一后台左侧导航侧边栏 (遵循现代轻量工业数智风与规范第 48 节)
 * 支持多级折叠树、依据当前路径自动高亮展开、纯白浮动与矢量图标
 */
export function Sidebar({
  sections,
  navItems,
  currentPath: propCurrentPath,
  can,
  LinkComponent = DefaultLink,
}: SidebarProps) {
  const Link = LinkComponent;

  // 1. 确定当前路径：优先使用显式 prop，未提供时在浏览器端自适应 window.location.pathname
  const [currentPath, setCurrentPath] = useState<string>(propCurrentPath ?? "");

  useEffect(() => {
    if (propCurrentPath !== undefined) {
      setCurrentPath(propCurrentPath);
    } else if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, [propCurrentPath]);

  // 2. 确定数据源：若未提供 sections，支持将 navItems 适配为标准结构
  const effectiveSections: readonly NavSection[] =
    sections ??
    (navItems ? [{ id: "custom", items: navItems }] : DEFAULT_NAV_SECTIONS);

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
            const visibleItems = filterVisibleItems(section.items, can);
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
                                {item.icon || (
                                  <LayoutDashboard className="size-4" />
                                )}
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
                            {item.icon || (
                              <LayoutDashboard className="size-4" />
                            )}
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
