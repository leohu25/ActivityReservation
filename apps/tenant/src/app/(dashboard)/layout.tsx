import React from "react";
import { headers } from "next/headers";
import { getServerAuthRuntime } from "@chenrun/auth";
import { TopHeader, Sidebar, DashboardShell, Badge } from "@chenrun/ui";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";

interface DashboardLayoutProps {
  readonly children: React.ReactNode;
}

/**
 * 后台系统主布局（Server Component - 极薄装配线）
 * 真实读取当前请求的 Better Auth Session 与租户组织信息，挂载 @chenrun/ui 布局组件
 * 遵循单企业独立会话模式：顶部栏仅展示当前登录企业身份徽标，彻底移除租户切换器
 */
export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const runtime = getServerAuthRuntime();
  const session = await runtime.auth.api.getSession({
    headers: await headers(),
  });

  // 未登录拦截
  if (!session) {
    redirect("/login");
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
  };

  const activeOrgId = session.session.activeOrganizationId;

  // 查询当前企业组织信息
  let activeOrg: { name: string; slug: string } | null = null;
  if (activeOrgId) {
    const org = await runtime.prisma.organization.findUnique({
      where: { id: activeOrgId },
      select: { name: true, slug: true },
    });
    activeOrg = org;
  }

  const orgBadgeSlot = activeOrg ? (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-800/60 shadow-xs">
      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
        <Building2 className="size-3.5" />
      </div>
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
        <span>{activeOrg.name}</span>
        <span className="font-mono text-[10px] text-slate-400">({activeOrg.slug})</span>
      </div>
      <Badge variant="outline" size="sm" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
        当前企业
      </Badge>
    </div>
  ) : null;

  return (
    <DashboardShell
      header={
        <TopHeader
          user={user}
          orgSwitcherSlot={orgBadgeSlot}
        />
      }
      sidebar={<Sidebar />}
    >
      {children}
    </DashboardShell>
  );
}
