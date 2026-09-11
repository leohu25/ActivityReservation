import { TenantAdminAbilityBoundary } from "@chenrun/feature-tenant-admin";
import { getTenantSubjectPermissions } from "@/kernel";

/**
 * 组织架构官方 CASL 布局边界。
 */
export default async function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [employee, department, position] = await Promise.all([
    getTenantSubjectPermissions("Employee"),
    getTenantSubjectPermissions("Department"),
    getTenantSubjectPermissions("Position"),
  ]);

  return (
    <TenantAdminAbilityBoundary
      permissions={{
        subjects: {
          Employee: employee,
          Department: department,
          Position: position,
        },
      }}
    >
      {children}
    </TenantAdminAbilityBoundary>
  );
}
