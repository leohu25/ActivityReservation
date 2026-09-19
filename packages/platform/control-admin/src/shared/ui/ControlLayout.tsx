"use client";

import React, { useState } from "react";
import { TopHeader, Sidebar, DashboardShell, Badge, UiAbilityProvider } from "@base/ui";
import { signOut } from "@base/auth/client";
import { BarChart3, Building2, Database, ShieldAlert } from "lucide-react";

export interface ControlLayoutProps {
  readonly children: React.ReactNode;
  readonly user?: {
    name?: string | null;
    email: string;
    role?: string | null;
  } | null;
}

const CONTROL_NAV_SECTIONS = [
  {
    id: "control-center",
    title: "控制平面核心中枢",
    items: [
      {
        id: "workbench",
        label: "总控运营工作台",
        href: "/workbench",
        icon: <BarChart3 className="size-4.5" />,
      },
      {
        id: "tenants",
        label: "租户运维中枢",
        href: "/tenants",
        icon: <Building2 className="size-4.5" />,
      },
      {
        id: "migrations",
        label: "数据架构与迁移",
        href: "/migrations",
        icon: <Database className="size-4.5" />,
      },
    ],
  },
];

/**
 * 平台控制平面 (Control Plane) 统一布局外壳
 * 直接复用 @base/ui 的公共布局基建：DashboardShell + TopHeader + Sidebar
 * 免除 CASL 权限过滤，支持超管退出与品牌标识
 */
export function ControlLayout({
  children,
  user,
}: ControlLayoutProps): React.JSX.Element {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }
    } catch {
      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const currentUser = {
    name: user?.name ?? "超级管理员",
    email: user?.email ?? "admin@qq.com",
    role: user?.role ?? "平台超管",
  };

  const platformBadgeSlot = (
    <Badge
      variant="outline"
      className="border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1 text-[10px] font-bold"
    >
      <ShieldAlert className="size-3" />
      总管理平台
    </Badge>
  );

  // 控制平面超级管理员全局拥有无限制权限（Fail-Open for Super Admin）
  const superAdminAbility = React.useMemo(
    () => ({
      can: () => true,
    }),
    [],
  );

  return (
    <UiAbilityProvider ability={superAdminAbility}>
      <DashboardShell
        header={
          <TopHeader
            user={currentUser}
            platformBadge={platformBadgeSlot}
            onSignOut={handleSignOut}
          />
        }
        sidebar={<Sidebar sections={CONTROL_NAV_SECTIONS} />}
      >
        {children}
      </DashboardShell>
    </UiAbilityProvider>
  );
}
