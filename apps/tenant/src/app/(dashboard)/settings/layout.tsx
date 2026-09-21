import { TenantAdminAbilityBoundary } from "@platform/tenant-admin/shared";
import { CompanyProfileSubject } from "@platform/tenant-admin/tenant-settings";
import { RoleManagementSubject } from "@platform/tenant-admin/role-management";
import { TenantMenuItemSubject } from "@platform/tenant-admin/nav-management";
import { getTenantSubjectPermissions } from "@/kernel";

/**
 * 系统设置官方 CASL 布局边界：企业信息 / 角色等 Subject 一次注入。
 */
export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [companyProfile, roleManagement, tenantMenuItem] = await Promise.all([
    getTenantSubjectPermissions(CompanyProfileSubject),
    getTenantSubjectPermissions(RoleManagementSubject),
    getTenantSubjectPermissions(TenantMenuItemSubject),
  ]);

  return (
    <TenantAdminAbilityBoundary
      permissions={{
        subjects: {
          [CompanyProfileSubject]: companyProfile,
          [RoleManagementSubject]: roleManagement,
          [TenantMenuItemSubject]: tenantMenuItem,
        },
      }}
    >
      {children}
    </TenantAdminAbilityBoundary>
  );
}
