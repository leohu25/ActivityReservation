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
                                                        href: "/organization/employees",
                                                        requiredAction: "read",
                                                        requiredSubject:
                                                                EmployeeSubject,
                                                },
                                                {
                                                        id: "org-departments",
                                                        label: "部门管理",
                                                        href: "/organization/departments",
                                                        requiredAction: "read",
                                                        requiredSubject:
                                                                DepartmentSubject,
                                                },
                                                {
                                                        id: "org-positions",
                                                        label: "岗位管理",
                                                        href: "/organization/positions",
                                                        requiredAction: "read",
                                                        requiredSubject:
                                                                PositionSubject,
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
                                                        href: "/settings/roles",
                                                        requiredAction: "read",
                                                        requiredSubject:
                                                                RoleManagementSubject,
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
                                                        href: "/settings/company",
                                                        requiredAction: "read",
                                                        requiredSubject:
                                                                CompanyProfileSubject,
                                                },
                                                {
                                                        id: "settings-general",
                                                        label: "基础设置",
                                                        href: "/settings/general",
                                                        requiredAction: "read",
                                                        requiredSubject:
                                                                GeneralSettingsSubject,
                                                },
                                                {
                                                        id: "settings-security",
                                                        label: "安全设置",
                                                        href: "/settings/security",
                                                        requiredAction: "read",
                                                        requiredSubject:
                                                                SecuritySettingsSubject,
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
                                                        href: "/audit/login",
                                                        requiredAction: "read",
                                                        requiredSubject:
                                                                AuditLogLoginSubject,
                                                },
                                                {
                                                        id: "audit-operations",
                                                        label: "业务操作审计",
                                                        href: "/audit/operations",
                                                        requiredAction: "read",
                                                        requiredSubject:
                                                                AuditLogOperationSubject,
                                                },
                                                {
                                                        id: "audit-permissions",
                                                        label: "权限变更审计",
                                                        href: "/audit/permissions",
                                                        requiredAction: "read",
                                                        requiredSubject:
                                                                AuditLogPermissionSubject,
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
