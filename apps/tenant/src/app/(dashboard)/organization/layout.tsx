import {
  DepartmentSubject,
  EmployeeSubject,
  PositionSubject,
} from "@base/feature-tenant-admin/org-management";
import { RoleSubject } from "@base/feature-tenant-admin/role-management";
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
    getTenantSubjectPermissions(EmployeeSubject),
    getTenantSubjectPermissions(DepartmentSubject),
    getTenantSubjectPermissions(PositionSubject),
    getTenantSubjectPermissions(RoleSubject),
  ]);

  return (
    <TenantAdminAbilityBoundary
      permissions={{
        subjects: {
          [EmployeeSubject]: employee,
          EmployeeProfile: employee,
          [DepartmentSubject]: department,
          [PositionSubject]: position,
          [RoleSubject]: role,
        },
      }}
    >
      {children}
    </TenantAdminAbilityBoundary>
  );
}
