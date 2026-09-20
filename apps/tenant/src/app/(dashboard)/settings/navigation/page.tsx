import { headers } from "next/headers";
import { AlertCircle } from "lucide-react";
import { getServerAuthRuntime } from "@base/auth";
import { NavigationConfigView } from "@platform/tenant-admin/nav-management";
import { getNavigationConfigQuery } from "@platform/tenant-admin/nav-management/server";
import { Card } from "@base/ui";
import { globalTenantPageList } from "@/kernel";

/**
 * 租户导航菜单与分组动态编排页面 (Server Component - 极薄装配线)
 */
export default async function SettingsNavigationPage() {
  const runtime = getServerAuthRuntime();
  const session = await runtime.auth.api.getSession({
    headers: await headers(),
  });

  const activeOrgId = session?.session.activeOrganizationId;

  if (!activeOrgId) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 p-6 text-amber-800 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>请先在工作台或顶部选择并激活一个租户组织</span>
        </div>
      </Card>
    );
  }

  // 检查成员身份与权限
  const currentMember = await runtime.tenantContextRepository.findMember(
    activeOrgId,
    session.user.id,
  );

  if (!currentMember) {
    return (
      <Card className="border-rose-200 bg-rose-50/50 p-6 text-rose-800 shadow-xs dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>您当前不是该租户组织的成员，无权访问管理后台</span>
        </div>
      </Card>
    );
  }

  const roleList = currentMember.role
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
  const isTenantAdmin =
    roleList.includes("owner") || roleList.includes("admin");

  if (!isTenantAdmin) {
    return (
      <Card className="border-rose-200 bg-rose-50/50 p-6 text-rose-800 shadow-xs dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>
            权限不足 (403)：仅企业管理员 (owner / admin) 允许访问并配置导航菜单
          </span>
        </div>
      </Card>
    );
  }

  // 服务端拉取租户动态导航配置与全量功能池 (含业务中心与系统管理)
  const navigationConfig = await getNavigationConfigQuery(
    globalTenantPageList,
  );

  return <NavigationConfigView data={navigationConfig} />;
}
