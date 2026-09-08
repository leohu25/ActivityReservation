import React from "react";
import { headers } from "next/headers";
import { getServerAuthRuntime } from "@chenrun/auth";
import { OrgSwitcher } from "@chenrun/auth/client";
import { TopHeader, Sidebar, DashboardShell } from "@chenrun/ui";
import { redirect } from "next/navigation";

interface DashboardLayoutProps {
  readonly children: React.ReactNode;
}

/**
 * 后台系统主布局（Server Component - 极薄装配线）
 * 真实读取当前请求的 Better Auth Session 与租户组织信息，挂载 @chenrun/ui 布局组件与 @chenrun/auth 租户切换器
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

  return (
    <DashboardShell
      header={
        <TopHeader
          user={user}
          orgSwitcherSlot={<OrgSwitcher activeOrgId={activeOrgId} />}
        />
      }
      sidebar={<Sidebar />}
    >
      {children}
    </DashboardShell>
  );
}
