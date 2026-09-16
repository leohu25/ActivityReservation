import { headers } from "next/headers";
import { AlertCircle } from "lucide-react";
import { getServerAuthRuntime } from "@base/auth";
import {
  RoleListView,
  type PaginatedRolesResult,
} from "@base/feature-tenant-admin/role-management";
import { searchTenantRolesQuery } from "@base/feature-tenant-admin/role-management/server";
import { Card } from "@base/ui";

export interface OrganizationRolesPageProps {
  searchParams?: Promise<{
    page?: string;
    pageSize?: string;
    keyword?: string;
  }>;
}

/**
 * 组织架构 - 角色字典管理页面 (Server Component - 极薄装配层)
 * 完全遵循服务端驱动分页与关键字查询架构
 */
export default async function OrganizationRolesPage({
  searchParams,
}: OrganizationRolesPageProps) {
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

  // 校验组织成员身份
  const currentMember = await runtime.tenantContextRepository.findMember(
    activeOrgId,
    session.user.id,
  );

  if (!currentMember) {
    return (
      <Card className="border-rose-200 bg-rose-50/50 p-6 text-rose-800 shadow-xs dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>您当前不是该租户组织的成员，无权访问角色管理</span>
        </div>
      </Card>
    );
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const page = resolvedParams.page ? Number(resolvedParams.page) : 1;
  const pageSize = resolvedParams.pageSize
    ? Number(resolvedParams.pageSize)
    : 10;
  const keyword = resolvedParams.keyword || "";

  // 通过服务端分页与关键字查询检索
  const result: PaginatedRolesResult = await searchTenantRolesQuery({
    page,
    pageSize,
    keyword,
  });

  return (
    <RoleListView
      initialRoles={result.items}
      initialTotal={result.total}
      initialPage={result.page}
      initialPageSize={result.pageSize}
      initialKeyword={keyword}
    />
  );
}
