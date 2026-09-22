import {
  EmployeeView,
  employeeSearchParams,
  type EmployeeItem,
} from "@platform/tenant-admin/org-management";
import {
  listEmployeesPagedQuery,
  getEmployeePageOptionsQuery,
} from "@platform/tenant-admin/org-management/server";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * 员工档案与人事管理页面 (标准 Next.js App Router Server Component - 极薄装配层)
 */
export default async function OrganizationEmployeesPage({
  searchParams,
}: PageProps) {
  const parsed = await employeeSearchParams.parse(searchParams);

  const [employeePage, pageOptions] = await Promise.all([
    listEmployeesPagedQuery({
      page: parsed.page,
      pageSize: parsed.pageSize,
      search: String(parsed.keyword ?? "") || undefined,
      departmentId: String(parsed.departmentId ?? "") || undefined,
      includeChildren: String(parsed.includeChildren ?? "") !== "false",
      positionId: String(parsed.positionId ?? "") || undefined,
      role: String(parsed.role ?? "") || undefined,
      status: String(parsed.status ?? "") || undefined,
    }),
    getEmployeePageOptionsQuery(),
  ]);

  return (
    <EmployeeView
      data={employeePage.items as EmployeeItem[]}
      total={employeePage.total}
      departmentTree={pageOptions.departmentTree}
      positions={pageOptions.positions}
      availableRoles={pageOptions.availableRoles}
    />
  );
}
