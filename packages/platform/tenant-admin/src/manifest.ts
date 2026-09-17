import { StandardAction } from "@base/authorization";
import type { TenantFeatureManifest } from "@base/authorization";
import {
  DepartmentSubject,
  PositionSubject,
  EmployeeSubject,
  departmentPageContract,
  positionPageContract,
  employeePageContract,
} from "./features/org-management/contract";
import {
  RoleManagementSubject,
  RoleSubject,
  roleDefinitionPageContract,
  rolePageContract,
} from "./features/role-management/contract";
import {
  CompanyProfileSubject,
  GeneralSettingsSubject,
  SecuritySettingsSubject,
  companyProfilePageContract,
  generalSettingsPageContract,
  securitySettingsPageContract,
} from "./features/tenant-settings/contract";
import {
  AuditLogLoginSubject,
  AuditLogOperationSubject,
  AuditLogPermissionSubject,
  auditLoginPageContract,
  auditOperationPageContract,
  auditPermissionPageContract,
} from "./features/audit-log/contract";
import {
  TenantMenuItemSubject,
  tenantMenuItemPageContract,
} from "./features/nav-management/contract";

export const tenantAdminManifest: TenantFeatureManifest = {
  id: "tenant-admin",
  name: "企业系统管理",
  order: 30,
  navSections: [
    {
      id: "base",
      order: 0,
      items: [
        {
          id: "workbench",
          label: "工作台",
          icon: "LayoutDashboard",
          href: "/workbench",
        },
      ],
    },
    {
      id: "system",
      title: "系统管理",
      order: 30,
      items: [
        {
          id: "group-organization",
          label: "组织架构",
          icon: "Users",
          items: [
            {
              id: "org-employees",
              label: "员工管理",
              icon: "UserCheck",
              href: "/organization/employees",
              requiredAction: StandardAction.READ,
              requiredSubject: EmployeeSubject,
            },
            {
              id: "org-departments",
              label: "部门管理",
              icon: "Building2",
              href: "/organization/departments",
              requiredAction: StandardAction.READ,
              requiredSubject: DepartmentSubject,
            },
            {
              id: "org-positions",
              label: "岗位管理",
              icon: "IdCard",
              href: "/organization/positions",
              requiredAction: StandardAction.READ,
              requiredSubject: PositionSubject,
            },
            {
              id: "org-roles",
              label: "角色管理",
              icon: "Users",
              href: "/organization/roles",
              requiredAction: StandardAction.READ,
              requiredSubject: RoleSubject,
            },
          ],
        },
        {
          id: "group-permissions",
          label: "权限管理",
          icon: "ShieldCheck",
          items: [
            {
              id: "settings-roles",
              label: "角色权限管理",
              icon: "KeyRound",
              href: "/settings/roles",
              requiredAction: StandardAction.READ,
              requiredSubject: RoleManagementSubject,
            },
          ],
        },
        {
          id: "group-settings",
          label: "企业设置",
          icon: "Settings",
          items: [
            {
              id: "settings-company",
              label: "企业信息",
              icon: "Building2",
              href: "/settings/company",
              requiredAction: StandardAction.READ,
              requiredSubject: CompanyProfileSubject,
            },
            {
              id: "settings-general",
              label: "基础设置",
              icon: "Sliders",
              href: "/settings/general",
              requiredAction: StandardAction.READ,
              requiredSubject: GeneralSettingsSubject,
            },
            {
              id: "settings-security",
              label: "安全设置",
              icon: "Lock",
              href: "/settings/security",
              requiredAction: StandardAction.READ,
              requiredSubject: SecuritySettingsSubject,
            },
            {
              id: "settings-navigation",
              label: "菜单导航设置",
              icon: "FolderTree",
              href: "/settings/navigation",
              requiredAction: StandardAction.READ,
              requiredSubject: TenantMenuItemSubject,
            },
          ],
        },
        {
          id: "group-audit",
          label: "审计追踪",
          icon: "FileText",
          items: [
            {
              id: "audit-login",
              label: "登录审计",
              icon: "FileCheck",
              href: "/audit/login",
              requiredAction: StandardAction.READ,
              requiredSubject: AuditLogLoginSubject,
            },
            {
              id: "audit-operations",
              label: "业务操作审计",
              icon: "History",
              href: "/audit/operations",
              requiredAction: StandardAction.READ,
              requiredSubject: AuditLogOperationSubject,
            },
            {
              id: "audit-permissions",
              label: "权限变更审计",
              icon: "ShieldCheck",
              href: "/audit/permissions",
              requiredAction: StandardAction.READ,
              requiredSubject: AuditLogPermissionSubject,
            },
          ],
        },
      ],
    },
  ],
  permissionModules: [
    {
      moduleKey: "system-organization",
      label: "组织架构管理",
      iconName: "Users",
      order: 10,
      pages: [
        departmentPageContract,
        positionPageContract,
        employeePageContract,
        roleDefinitionPageContract,
      ],
    },
    {
      moduleKey: "system-permissions",
      label: "权限体系管理",
      iconName: "ShieldCheck",
      order: 20,
      pages: [rolePageContract],
    },
    {
      moduleKey: "system-settings",
      label: "企业系统配置",
      iconName: "Settings",
      order: 30,
      pages: [
        companyProfilePageContract,
        generalSettingsPageContract,
        securitySettingsPageContract,
        tenantMenuItemPageContract,
      ],
    },
    {
      moduleKey: "system-audit",
      label: "安全与操作审计",
      iconName: "FileText",
      order: 40,
      pages: [
        auditLoginPageContract,
        auditOperationPageContract,
        auditPermissionPageContract,
      ],
    },
  ],
};
