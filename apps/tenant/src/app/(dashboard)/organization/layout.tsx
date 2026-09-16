import { TenantAdminAbilityBoundary } from "@base/feature-tenant-admin/shared";
import { getTenantSubjectPermissions } from "@/kernel";

/**
 * 组织架构官方 CASL 布局边界。
 */
export default async function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [employee, department, position, role] = await Promise.all([
    getTenantSubjectPermissions("Employee"),
    getTenantSubjectPermissions("Department"),
    getTenantSubjectPermissions("Position"),
    getTenantSubjectPermissions("Role"),
  ]);

  return (
    <TenantAdminAbilityBoundary
      permissions={{
        subjects: {
          Employee: employee,
          Department: department,
          Position: position,
          Role: role,
        },
      }}
    >
      {children}
    </TenantAdminAbilityBoundary>
  );
}
