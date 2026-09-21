import { TenantAdminAbilityBoundary } from "@platform/tenant-admin/shared";
import { getTenantSubjectPermissions } from "@/kernel";

/**
 * 系统设置官方 CASL 布局边界：企业信息 / 角色等 Subject 一次注入。
 */
export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [companyProfile, roleManagement, tenantMenuItem, tenantDictItem] =
    await Promise.all([
      getTenantSubjectPermissions("CompanyProfile"),
      getTenantSubjectPermissions("RoleManagement"),
      getTenantSubjectPermissions("TenantMenuItem"),
      getTenantSubjectPermissions("TenantDictItem"),
    ]);

  return (
    <TenantAdminAbilityBoundary
      permissions={{
        subjects: {
          CompanyProfile: companyProfile,
          RoleManagement: roleManagement,
          TenantMenuItem: tenantMenuItem,
          TenantDictItem: tenantDictItem,
        },
      }}
    >
      {children}
    </TenantAdminAbilityBoundary>
  );
}
