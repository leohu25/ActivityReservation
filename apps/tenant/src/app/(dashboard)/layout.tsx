import React from "react";
import { headers } from "next/headers";
import { getServerAuthRuntime } from "@/lib/auth";
import { TopHeader } from "@/components/layout/TopHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { redirect } from "next/navigation";

interface DashboardLayoutProps {
  readonly children: React.ReactNode;
}

/**
 * 后台系统主布局（Server Component）
 * 真实读取当前请求的 Better Auth Session 与租户组织信息，杜绝死数据
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
      header={<TopHeader user={user} activeOrgId={activeOrgId} />}
      sidebar={<Sidebar />}
    >
      {children}
    </DashboardShell>
  );
}
