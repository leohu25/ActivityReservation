import React from "react";
import { headers } from "next/headers";
import { getServerAuthRuntime } from "@base/auth";
import { TopHeader, Sidebar, DashboardShell } from "@base/ui";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { getAuthorizedTenantNavSections } from "@/kernel";

interface DashboardLayoutProps {
  readonly children: React.ReactNode;
}

/**
 * 后台系统主布局（Server Component - 极薄装配线）
 * 真实读取当前请求的 Better Auth Session 与租户组织信息，挂载 @base/ui 布局组件
 * 遵循单企业独立会话模式：顶部栏仅展示当前登录企业身份徽标，彻底移除租户切换器
 */
export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const reqHeaders = await headers();
  const runtime = getServerAuthRuntime();
  const session = await runtime.auth.api.getSession({
    headers: reqHeaders,
  });

  // 未登录拦截
  if (!session) {
    redirect("/login");
  }

  const activeOrgId = session.session.activeOrganizationId;

  // 查询当前企业组织信息与当前用户的成员角色
  let activeOrg: { name: string; slug: string } | null = null;
  let memberRoleLabel = "企业成员";

  if (activeOrgId) {
    const [org, member] = await Promise.all([
      runtime.prisma.organization.findUnique({
        where: { id: activeOrgId },
        select: { name: true, slug: true },
      }),
      runtime.prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: activeOrgId,
            userId: session.user.id,
          },
        },
        select: { role: true },
      }),
    ]);
    activeOrg = org;
    if (member?.role === "owner") {
      memberRoleLabel = "拥有者 / Owner";
    } else if (member?.role === "admin") {
      memberRoleLabel = "企业管理员";
    } else if (member?.role === "buyer") {
      memberRoleLabel = "采购员";
    } else if (member?.role) {
      memberRoleLabel = member.role;
    }
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    role: memberRoleLabel,
  };

  const orgBadgeSlot = activeOrg ? (
    <div className="flex items-center gap-1.5 rounded-md border border-sidebar-border/80 bg-muted/30 px-2 py-0.5 text-xs text-sidebar-foreground transition-colors">
      <Building2 className="size-3 text-primary shrink-0" />
      <span className="font-semibold text-xs truncate max-w-[130px]">
        {activeOrg.name}
      </span>
      <span className="font-mono text-[10px] text-muted-foreground">
        ({activeOrg.slug})
      </span>
    </div>
  ) : null;

  // 获取经服务端权限引擎裁切后的授权导航菜单（纯数据，无未授权项，无空分组）
  const navSections = await getAuthorizedTenantNavSections();

  return (
    <DashboardShell
      header={<TopHeader user={user} orgSwitcherSlot={orgBadgeSlot} />}
      sidebar={<Sidebar sections={navSections} />}
      navSections={navSections}
    >
      {children}
    </DashboardShell>
  );
}
