import type { TenantFeatureManifest } from "@chenrun/authorization";
import {
    AuditLogLoginSubject,
    AuditLogOperationSubject,
    AuditLogPermissionSubject,
    CompanyProfileSubject,
    DepartmentSubject,
    EmployeeSubject,
    GeneralSettingsSubject,
    PositionSubject,
    RoleManagementSubject,
    auditLoginPageContract,
    auditOperationPageContract,
    auditPermissionPageContract,
    companyProfilePageContract,
    departmentPageContract,
    employeePageContract,
    generalSettingsPageContract,
    positionPageContract,
    rolePageContract,
    securitySettingsPageContract,
    SecuritySettingsSubject,
} from "./contracts";

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
                            requiredSubject: EmployeeSubject,
                        },
                        {
                            id: "org-departments",
                            label: "部门管理",
                            href: "/organization/departments",
                            requiredAction: "read",
                            requiredSubject: DepartmentSubject,
                        },
                        {
                            id: "org-positions",
                            label: "岗位管理",
                            href: "/organization/positions",
                            requiredAction: "read",
                            requiredSubject: PositionSubject,
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
                            href: "/settings/company",
                            requiredAction: "read",
                            requiredSubject: CompanyProfileSubject,
                        },
                        {
                            id: "settings-general",
                            label: "基础设置",
                            href: "/settings/general",
                            requiredAction: "read",
                            requiredSubject: GeneralSettingsSubject,
                        },
                        {
                            id: "settings-security",
                            label: "安全设置",
                            href: "/settings/security",
                            requiredAction: "read",
                            requiredSubject: SecuritySettingsSubject,
                        },
                    ],
                },
                {
                    id: "group-audit",
                    label: "审计追踪",
                    icon: "FileText",
                    items: [
                        {
                            id: "audit-operations",
                            label: "操作日志",
                            href: "/audit/operations",
                            requiredAction: "read",
                            requiredSubject: AuditLogOperationSubject,
                        },
                        {
                            id: "audit-logins",
                            label: "登录日志",
                            href: "/audit/logins",
                            requiredAction: "read",
                            requiredSubject: AuditLogLoginSubject,
                        },
                        {
                            id: "audit-permissions",
                            label: "权限变更日志",
                            href: "/audit/permissions",
                            requiredAction: "read",
                            requiredSubject: AuditLogPermissionSubject,
                        },
                    ],
                },
            ],
        },
    ],
    permissionModules: [
        {
            moduleKey: "organization",
            label: "组织架构",
            iconName: "Users",
            order: 30,
            pages: [
                employeePageContract,
                departmentPageContract,
                positionPageContract,
            ],
        },
        {
            moduleKey: "permissions",
            label: "权限管理",
            iconName: "ShieldCheck",
            order: 40,
            pages: [rolePageContract],
        },
        {
            moduleKey: "settings",
            label: "企业设置",
            iconName: "Settings",
            order: 50,
            pages: [
                companyProfilePageContract,
                generalSettingsPageContract,
                securitySettingsPageContract,
            ],
        },
        {
            moduleKey: "audit",
            label: "审计日志",
            iconName: "FileText",
            order: 60,
            pages: [
                auditOperationPageContract,
                auditLoginPageContract,
                auditPermissionPageContract,
            ],
        },
    ],
};
