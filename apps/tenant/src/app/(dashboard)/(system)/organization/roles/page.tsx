import {
  RoleListView,
  roleSearchParams,
  type TenantRoleItem,
} from "@platform/tenant-admin/role-management";
import { searchTenantRolesQuery } from "@platform/tenant-admin/role-management/server";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * 组织架构 - 角色字典管理页面 (标准 Next.js App Router Server Component - 极薄装配层)
 */
export default async function OrganizationRolesPage({
  searchParams,
}: PageProps) {
  const parsed = await roleSearchParams.parse(searchParams);

  const result = await searchTenantRolesQuery({
    page: parsed.page,
    pageSize: parsed.pageSize,
    keyword: String(parsed.keyword ?? "") || undefined,
  });

  return (
    <RoleListView
      data={result.items as TenantRoleItem[]}
      total={result.total}
    />
  );
}
