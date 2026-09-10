import {
  StandardAction,
  type TenantFeatureManifest,
} from "@chenrun/authorization";

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
              requiredSubject: "Employee",
            },
            {
              id: "org-departments",
              label: "部门管理",
              href: "/organization/departments",
              requiredAction: "read",
              requiredSubject: "Department",
            },
            {
              id: "org-positions",
              label: "岗位管理",
              href: "/organization/positions",
              requiredAction: "read",
              requiredSubject: "Position",
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
              requiredSubject: "RoleManagement",
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
              requiredSubject: "CompanyProfile",
            },
            {
              id: "settings-general",
              label: "基础设置",
              href: "/settings/general",
              requiredAction: "read",
              requiredSubject: "GeneralSettings",
            },
            {
              id: "settings-security",
              label: "安全设置",
              href: "/settings/security",
              requiredAction: "read",
              requiredSubject: "SecuritySettings",
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
              requiredSubject: "AuditLogOperation",
            },
            {
              id: "audit-logins",
              label: "登录日志",
              href: "/audit/logins",
              requiredAction: "read",
              requiredSubject: "AuditLogLogin",
            },
            {
              id: "audit-permissions",
              label: "权限变更日志",
              href: "/audit/permissions",
              requiredAction: "read",
              requiredSubject: "AuditLogPermission",
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
        {
          resource: "organization.employee",
          subject: "Employee",
          label: "员工管理",
          path: "/organization/employees",
          actions: [
            { action: StandardAction.READ, label: "查看" },
            { action: StandardAction.CREATE, label: "新建" },
            { action: StandardAction.UPDATE, label: "调岗/调部门" },
            { action: StandardAction.DELETE, label: "停用/离职" },
          ],
        },
        {
          resource: "organization.department",
          subject: "Department",
          label: "部门管理",
          path: "/organization/departments",
          actions: [
            { action: StandardAction.READ, label: "查看" },
            { action: StandardAction.CREATE, label: "新建" },
            { action: StandardAction.UPDATE, label: "调整部门" },
            { action: StandardAction.DELETE, label: "撤销部门" },
          ],
        },
        {
          resource: "organization.position",
          subject: "Position",
          label: "岗位管理",
          path: "/organization/positions",
          actions: [
            { action: StandardAction.READ, label: "查看" },
            { action: StandardAction.CREATE, label: "新建" },
            { action: StandardAction.UPDATE, label: "编辑" },
            { action: StandardAction.DELETE, label: "删除" },
          ],
        },
      ],
    },
    {
      moduleKey: "permissions",
      label: "权限管理",
      iconName: "ShieldCheck",
      order: 40,
      pages: [
        {
          resource: "system.roles",
          subject: "RoleManagement",
          label: "角色权限管理",
          path: "/settings/roles",
          actions: [
            { action: StandardAction.READ, label: "查看配置" },
            { action: StandardAction.UPDATE, label: "保存/分配权限" },
          ],
        },
      ],
    },
    {
      moduleKey: "settings",
      label: "企业设置",
      iconName: "Settings",
      order: 50,
      pages: [
        {
          resource: "settings.company",
          subject: "CompanyProfile",
          label: "企业信息",
          path: "/settings/company",
          actions: [
            { action: StandardAction.READ, label: "查看信息" },
            { action: StandardAction.UPDATE, label: "修改资料" },
          ],
        },
        {
          resource: "settings.general",
          subject: "GeneralSettings",
          label: "基础设置",
          path: "/settings/general",
          actions: [
            { action: StandardAction.READ, label: "查看设置" },
            { action: StandardAction.UPDATE, label: "保存配置" },
          ],
        },
        {
          resource: "settings.security",
          subject: "SecuritySettings",
          label: "安全设置",
          path: "/settings/security",
          actions: [
            { action: StandardAction.READ, label: "查看安全策略" },
            { action: StandardAction.UPDATE, label: "修改策略" },
          ],
        },
      ],
    },
    {
      moduleKey: "audit",
      label: "审计日志",
      iconName: "FileText",
      order: 60,
      pages: [
        {
          resource: "audit.operations",
          subject: "AuditLogOperation",
          label: "操作日志",
          path: "/audit/operations",
          actions: [
            { action: StandardAction.READ, label: "查看日志" },
            { action: StandardAction.EXPORT, label: "导出日志" },
          ],
        },
        {
          resource: "audit.logins",
          subject: "AuditLogLogin",
          label: "登录日志",
          path: "/audit/logins",
          actions: [
            { action: StandardAction.READ, label: "查看日志" },
            { action: StandardAction.EXPORT, label: "导出日志" },
          ],
        },
        {
          resource: "audit.permissions",
          subject: "AuditLogPermission",
          label: "权限变更日志",
          path: "/audit/permissions",
          actions: [
            { action: StandardAction.READ, label: "查看日志" },
            { action: StandardAction.EXPORT, label: "导出日志" },
          ],
        },
      ],
    },
  ],
};
