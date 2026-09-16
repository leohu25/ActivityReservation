import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { TenantAbilityProvider } from "@base/authorization";
import { RolePermissionManager } from "./RolePermissionManager";
import { RoleManagementSubject } from "../contract";
import type { TenantRoleItem } from "../types";
import type { ModulePermissionDescriptor } from "../../../shared/public";

const mockPermissionTree: ModulePermissionDescriptor[] = [
  {
    moduleKey: "customer",
    label: "客户中心",
    iconName: "UserCheck",
    pages: [
      {
        resource: "customer.customers",
        subject: "Customer",
        label: "客户档案",
        actions: [{ action: "read", label: "查看" }],
      },
      {
        resource: "customer.stores",
        subject: "CustomerStore",
        label: "门店档案",
        actions: [{ action: "read", label: "查看" }],
      },
      {
        resource: "customer.categories-tags",
        subject: "CustomerCategory",
        label: "分类与标签",
        actions: [{ action: "read", label: "查看" }],
      },
      {
        resource: "customer.quotes",
        subject: "CustomerQuote",
        label: "门店报价单",
        actions: [{ action: "read", label: "查看" }],
      },
    ],
  },
  {
    moduleKey: "procurement",
    label: "采购订单中心",
    iconName: "PackageCheck",
    pages: [
      {
        resource: "procurement.order",
        subject: "PurchaseOrder",
        label: "采购订单管理",
        actions: [
          { action: "read", label: "查看" },
          { action: "update", label: "编辑" },
        ],
        configurableFields: [
          { field: "costPrice", label: "成本价", sensitive: true },
        ],
      },
    ],
  },
  {
    moduleKey: "organization",
    label: "组织架构",
    iconName: "Users",
    pages: [
      {
        resource: "organization.employee",
        subject: "Employee",
        label: "员工管理",
        actions: [{ action: "read", label: "查看" }],
      },
      {
        resource: "organization.department",
        subject: "Department",
        label: "部门管理",
        actions: [{ action: "read", label: "查看" }],
      },
      {
        resource: "organization.position",
        subject: "Position",
        label: "岗位管理",
        actions: [{ action: "read", label: "查看" }],
      },
    ],
  },
];

test("RolePermissionManager 彻底剔除 Owner 并正确渲染树状表格权限矩阵与各业务模块页面", () => {
  const sampleRoles: TenantRoleItem[] = [
    {
      id: "role_owner",
      role: "owner",
      name: "超级管理员 (Owner)",
      description: "租户全量最高权限",
      isSystem: true,
      permissions: {
        statement: {},
        dataScopes: [],
        fieldPolicies: [],
      },
      updatedAt: null,
    },
    {
      id: "role_admin",
      role: "admin",
      name: "租户管理员 (Admin)",
      description: "日常业务管理",
      isSystem: true,
      permissions: {
        statement: {
          "customer.customer": ["read", "create", "update"],
          "customer.store": ["read"],
          "customer.category": ["read"],
          "customer.tag": ["read"],
          "customer.quote": ["read"],
          "procurement.order": ["read", "create", "update", "audit", "export"],
          "organization.employee": ["read", "create"],
          "organization.department": ["read"],
          "organization.position": ["read"],
        },
        dataScopes: [
          {
            resource: "procurement.order",
            action: "read",
            scopeType: "DEPT_TREE",
          },
        ],
        fieldPolicies: [],
      },
      updatedAt: null,
    },
    {
      id: "role_buyer",
      role: "buyer",
      name: "采购专员",
      description: "日常采购单录入",
      isSystem: false,
      permissions: {
        statement: {
          "procurement.order": ["read", "create"],
        },
        dataScopes: [
          {
            resource: "procurement.order",
            action: "read",
            scopeType: "SELF",
          },
        ],
        fieldPolicies: [],
      },
      updatedAt: null,
    },
  ];

  const html = renderToString(
    <TenantAbilityProvider
      snapshots={[
        {
          subject: RoleManagementSubject,
          actions: ["read", "update"],
        },
      ]}
    >
      <RolePermissionManager
        initialRoles={sampleRoles}
        activeOrgId="org_test"
        permissionTree={mockPermissionTree}
      />
    </TenantAbilityProvider>,
  );

  // 1. 验证彻底屏蔽超级管理员 Owner
  assert.doesNotMatch(html, /超级管理员 \(Owner\)/);
  assert.match(html, /租户管理员 \(Admin\)/);
  assert.match(html, /采购专员/);

  // 2. 验证大模块
  assert.match(html, /客户中心/);
  assert.match(html, /采购订单中心/);
  assert.match(html, /组织架构/);

  // 3. 验证功能页面全量覆盖
  assert.match(html, /客户档案/);
  assert.match(html, /门店档案/);
  assert.match(html, /分类与标签/);
  assert.match(html, /门店报价单/);
  assert.match(html, /员工管理/);
  assert.match(html, /部门管理/);
  assert.match(html, /岗位管理/);

  // 4. 验证数据范围选择与保存操作
  assert.match(html, /保存权限/);
  assert.match(html, /数据过滤范围/);
  assert.match(html, /功能操作权限/);
});

test("RolePermissionManager 支持展开字段策略并正确显示字段三态", () => {
  const roles: TenantRoleItem[] = [
    {
      id: "role_admin",
      role: "admin",
      name: "管理员",
      description: "管理角色",
      isSystem: true,
      permissions: {
        statement: {
          "procurement.order": ["read", "update"],
        },
        dataScopes: [],
        fieldPolicies: [
          {
            subject: "PurchaseOrder",
            field: "costPrice",
            access: "READONLY",
          },
        ],
      },
      updatedAt: null,
    },
  ];

  const html = renderToString(
    React.createElement(RolePermissionManager, {
      initialRoles: roles,
      activeOrgId: "org_test",
      permissionTree: mockPermissionTree,
    }),
  );

  // 页面正常渲染且包含字段配置入口
  assert.match(html, /采购订单管理/);
  assert.match(html, /字段策略/);
});

test("RolePermissionManager 在未授权 update 时隐藏新建/保存按钮并禁用表单复选框 (Fail-Closed)", () => {
  const roles: TenantRoleItem[] = [
    {
      id: "role_admin",
      role: "admin",
      name: "管理员",
      description: "管理角色",
      isSystem: true,
      permissions: {
        statement: {
          "procurement.order": ["read"],
        },
        dataScopes: [],
        fieldPolicies: [],
      },
      updatedAt: null,
    },
  ];

  // 仅具有 read 权限，无 update 权限（即李四的场景）
  const readOnlyHtml = renderToString(
    <TenantAbilityProvider
      snapshots={[
        {
          subject: RoleManagementSubject,
          actions: ["read"],
        },
      ]}
    >
      <RolePermissionManager
        initialRoles={roles}
        activeOrgId="org_test"
        permissionTree={mockPermissionTree}
      />
    </TenantAbilityProvider>,
  );

  // 1. 写操作按钮被安全隐藏
  assert.doesNotMatch(readOnlyHtml, /新建角色/);
  assert.doesNotMatch(readOnlyHtml, /保存权限/);
  assert.doesNotMatch(readOnlyHtml, /载入推荐模板/);

  // 2. 表单复选框与全选操作被禁用置灰
  assert.match(
    readOnlyHtml,
    /disabled="" class="size-3 rounded text-blue-600 focus:ring-blue-500 border-slate-300 disabled:cursor-not-allowed"/,
  );
  assert.match(readOnlyHtml, /cursor-not-allowed/);

  // 3. 当拥有 update 权限时，按钮正常展现
  const writableHtml = renderToString(
    <TenantAbilityProvider
      snapshots={[
        {
          subject: RoleManagementSubject,
          actions: ["read", "update"],
        },
      ]}
    >
      <RolePermissionManager
        initialRoles={roles}
        activeOrgId="org_test"
        permissionTree={mockPermissionTree}
      />
    </TenantAbilityProvider>,
  );

  assert.match(writableHtml, /新建角色/);
  assert.match(writableHtml, /保存权限/);
});

test("RolePermissionManager 支持复合页面（多实体模块）行内嵌套展开与独立权限展示", () => {
  const compositeTree: ModulePermissionDescriptor[] = [
    {
      moduleKey: "customer",
      label: "客户中心",
      iconName: "UserCheck",
      pages: [
        {
          resource: "customer.categories-tags",
          subject: "CustomerCategory",
          label: "分类与标签",
          path: "/customer/categories-tags",
          actions: [],
          entities: [
            {
              resource: "customer.category",
              subject: "CustomerCategory",
              label: "客户分类",
              path: "/customer/categories-tags",
              actions: [
                { action: "read", label: "查看分类" },
                { action: "create", label: "新建分类" },
              ],
            },
            {
              resource: "customer.tag",
              subject: "CustomerTag",
              label: "客户标签",
              path: "/customer/categories-tags",
              actions: [
                { action: "read", label: "查看标签" },
                { action: "create", label: "新建标签" },
              ],
            },
          ],
        },
      ],
    },
  ];

  const roles: TenantRoleItem[] = [
    {
      id: "role_member",
      role: "member",
      name: "普通成员",
      description: "仅看标签",
      isSystem: false,
      permissions: {
        statement: {
          "customer.tag": ["read"],
        },
        dataScopes: [],
        fieldPolicies: [],
      },
      updatedAt: null,
    },
  ];

  const html = renderToString(
    <TenantAbilityProvider
      snapshots={[
        {
          subject: RoleManagementSubject,
          actions: ["read", "update"],
        },
      ]}
    >
      <RolePermissionManager
        initialRoles={roles}
        activeOrgId="org_test"
        permissionTree={compositeTree}
      />
    </TenantAbilityProvider>,
  );

  // 1. 验证父级复合容器行
  assert.match(html, /分类与标签/);
  assert.match(html, /聚合.*2.*个数据实体模块/);
  assert.match(html, /全选本页/);

  // 2. 验证行内嵌套展开的两个子实体模块独立渲染
  assert.match(html, /客户分类/);
  assert.match(html, /查看分类/);
  assert.match(html, /新建分类/);
  assert.match(html, /客户标签/);
  assert.match(html, /查看标签/);
  assert.match(html, /新建标签/);
});
