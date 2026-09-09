import {
  DataScope,
  StandardAction,
  type DataScopeType,
} from "@chenrun/authorization";
import {
  CustomerAction,
  CustomerResource,
  CustomerSubject,
  CustomerStoreResource,
  CustomerStoreSubject,
  CustomerCategoryTagResource,
  CustomerCategorySubject,
  CustomerQuoteResource,
  CustomerQuoteSubject,
} from "@chenrun/feature-customer-center";
import {
  ProcurementAction,
  ProcurementPermission,
  ProcurementSubject,
  procurementConfigurableFields,
} from "@chenrun/feature-procurement-center";

/** 权限动作配置项模型 */
export interface ActionConfigItem {
  readonly action: string;
  readonly label: string;
  readonly supportedScopes?: readonly DataScopeType[];
}

/** 受控页面/实体模型 */
export interface PagePermissionDescriptor {
  readonly resource: string;
  readonly subject: string;
  readonly label: string;
  readonly path?: string;
  readonly actions: readonly ActionConfigItem[];
  readonly configurableFields?: readonly {
    readonly field: string;
    readonly label: string;
    readonly sensitive?: boolean;
  }[];
}

/** 业务顶级模块（对应侧边栏主分类/主菜单分组）模型 */
export interface ModulePermissionDescriptor {
  readonly moduleKey: string;
  readonly label: string;
  readonly iconName: string;
  readonly pages: readonly PagePermissionDescriptor[];
}

export const DATA_SCOPE_SELECT_OPTIONS: Array<{
  value: DataScopeType;
  label: string;
  desc: string;
}> = [
  {
    value: DataScope.SELF,
    label: "仅本人",
    desc: "仅允许访问当前成员创建的数据",
  },
  {
    value: DataScope.DEPT,
    label: "本部门",
    desc: "允许访问当前成员所属部门的数据",
  },
  {
    value: DataScope.DEPT_TREE,
    label: "部门及下级",
    desc: "包含本部门以及所有下属分支部门数据",
  },
  {
    value: DataScope.ALL,
    label: "全租户",
    desc: "允许访问全租户组织全部数据",
  },
];

/**
 * 租户业务系统功能模块与权限树注册表（形态 A：纯粹业务实体与操作权限，无伪模块资源）
 */
export const TENANT_PERMISSION_TREE: readonly ModulePermissionDescriptor[] = [
  // 1. 客户中心 (4个独立功能页面)
  {
    moduleKey: "customer",
    label: "客户中心",
    iconName: "UserCheck",
    pages: [
      {
        resource: CustomerResource,
        subject: CustomerSubject,
        label: "客户档案",
        path: "/customer/customers",
        actions: [
          {
            action: CustomerAction.READ,
            label: "查看",
            supportedScopes: [
              DataScope.SELF,
              DataScope.DEPT,
              DataScope.DEPT_TREE,
              DataScope.ALL,
            ],
          },
          { action: CustomerAction.CREATE, label: "新建" },
          { action: CustomerAction.UPDATE, label: "修改" },
          { action: CustomerAction.DELETE, label: "删除" },
        ],
      },
      {
        resource: CustomerStoreResource,
        subject: CustomerStoreSubject,
        label: "门店档案",
        path: "/customer/stores",
        actions: [
          {
            action: CustomerAction.READ,
            label: "查看",
            supportedScopes: [
              DataScope.SELF,
              DataScope.DEPT,
              DataScope.DEPT_TREE,
              DataScope.ALL,
            ],
          },
          { action: CustomerAction.CREATE, label: "新建" },
          { action: CustomerAction.UPDATE, label: "修改" },
          { action: CustomerAction.DELETE, label: "删除" },
        ],
      },
      {
        resource: CustomerCategoryTagResource,
        subject: CustomerCategorySubject,
        label: "分类与标签",
        path: "/customer/categories-tags",
        actions: [
          { action: CustomerAction.READ, label: "查看" },
          { action: CustomerAction.CREATE, label: "新增" },
          { action: CustomerAction.UPDATE, label: "编辑" },
          { action: CustomerAction.DELETE, label: "删除" },
        ],
      },
      {
        resource: CustomerQuoteResource,
        subject: CustomerQuoteSubject,
        label: "门店报价单",
        path: "/customer/quotes",
        actions: [
          {
            action: CustomerAction.READ,
            label: "查看",
            supportedScopes: [
              DataScope.SELF,
              DataScope.DEPT,
              DataScope.DEPT_TREE,
              DataScope.ALL,
            ],
          },
          { action: CustomerAction.CREATE, label: "拟定" },
          { action: CustomerAction.UPDATE, label: "编辑" },
          { action: CustomerAction.AUDIT, label: "审核" },
        ],
      },
    ],
  },

  // 2. 采购订单中心
  {
    moduleKey: "procurement",
    label: "采购订单中心",
    iconName: "PackageCheck",
    pages: [
      {
        resource: ProcurementPermission.order.resource,
        subject: ProcurementSubject,
        label: "采购订单管理",
        path: "/procurement/orders",
        actions: [
          {
            action: StandardAction.READ,
            label: "查看",
            supportedScopes: [
              DataScope.SELF,
              DataScope.DEPT,
              DataScope.DEPT_TREE,
              DataScope.ALL,
            ],
          },
          { action: StandardAction.CREATE, label: "新建" },
          {
            action: StandardAction.UPDATE,
            label: "修改",
            supportedScopes: [
              DataScope.SELF,
              DataScope.DEPT,
              DataScope.DEPT_TREE,
              DataScope.ALL,
            ],
          },
          {
            action: ProcurementAction.AUDIT,
            label: "审批",
            supportedScopes: [DataScope.DEPT, DataScope.DEPT_TREE],
          },
          {
            action: StandardAction.EXPORT,
            label: "导出",
            supportedScopes: [
              DataScope.SELF,
              DataScope.DEPT,
              DataScope.DEPT_TREE,
              DataScope.ALL,
            ],
          },
        ],
        configurableFields: procurementConfigurableFields.map((f) => ({
          field: f.field,
          label: f.label,
          sensitive: f.isSensitive,
        })),
      },
    ],
  },

  // 3. 组织架构
  {
    moduleKey: "organization",
    label: "组织架构",
    iconName: "Users",
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

  // 4. 权限管理
  {
    moduleKey: "permissions",
    label: "权限管理",
    iconName: "ShieldCheck",
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

  // 5. 企业设置
  {
    moduleKey: "settings",
    label: "企业设置",
    iconName: "Settings",
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

  // 6. 审计日志
  {
    moduleKey: "audit",
    label: "审计日志",
    iconName: "FileText",
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
];
