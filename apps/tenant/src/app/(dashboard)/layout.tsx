import React from "react";
import { headers } from "next/headers";
import { getServerAuthRuntime } from "@base/auth";
import { getTenantDbManager } from "@base/db-tenant";
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
  let activeOrg: {
    name: string;
    slug: string;
    logo?: string | null;
    metadata?: string | null;
  } | null = null;
  let memberRoleLabel = "企业成员";
  let userAvatarUrl: string | null = session.user.image ?? null;

  if (activeOrgId) {
    const [org, member] = await Promise.all([
      runtime.prisma.organization.findUnique({
        where: { id: activeOrgId },
        select: { name: true, slug: true, logo: true, metadata: true },
      }),
      runtime.prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: activeOrgId,
            userId: session.user.id,
          },
        },
        select: { id: true, role: true },
      }),
    ]);
    activeOrg = org;
    if (member?.role === "owner") {
      memberRoleLabel = "拥有者 / Owner";
    } else if (member?.role === "admin") {
      memberRoleLabel = "企业管理员";
    } else if (member?.role === "member") {
      memberRoleLabel = "标准成员";
    } else if (member?.role) {
      memberRoleLabel = member.role;
    }

    // 优先读取租户独立库中的员工档案头像 (employee_profile.avatar_url)
    if (member?.id) {
      try {
        const manager = getTenantDbManager({
          repository: runtime.tenantContextRepository,
        });
        const tenantPrisma = await manager.getClient(activeOrgId);
        const employee = await tenantPrisma.employeeProfile.findUnique({
          where: { memberId: member.id },
          select: { avatarUrl: true },
        });
        if (employee?.avatarUrl) {
          userAvatarUrl = employee.avatarUrl;
        }
      } catch {
        // 容灾忽略
      }
    }
  }

  // 解析组织元数据中的系统名称定制
  let systemTitle = "企业数字化协同平台";
  if (activeOrg?.metadata) {
    try {
      const parsedMeta = JSON.parse(activeOrg.metadata);
      if (parsedMeta?.generalSettings?.systemName?.trim()) {
        systemTitle = parsedMeta.generalSettings.systemName.trim();
      }
    } catch {
      // 忽略非法 json
    }
  } else if (activeOrg?.name) {
    systemTitle = activeOrg.name;
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    image: userAvatarUrl,
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

  // 动态检索已授权菜单中是否包含工作台入口；若无则设为 null，TabBar 绝不强驻工作台页签
  const workbenchItem = navSections.flatMap((s) => s.items).find((item) => {
    if ("href" in item && item.href === "/workbench") return true;
    if ("items" in item && Array.isArray(item.items)) {
      return item.items.some((sub) => sub.href === "/workbench");
    }
    return false;
  });

  const homeTab = workbenchItem
    ? {
        title: ("label" in workbenchItem && workbenchItem.label) || "工作台",
        path: "/workbench",
        closable: false,
      }
    : null;

  return (
    <DashboardShell
      header={
        <TopHeader
          user={user}
          orgSwitcherSlot={orgBadgeSlot}
          title={systemTitle}
          logoUrl={activeOrg?.logo}
        />
      }
      sidebar={<Sidebar sections={navSections} />}
      navSections={navSections}
      homeTab={homeTab}
    >
      {children}
    </DashboardShell>
  );
}
