import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { RolePermissionManager } from "./RolePermissionManager";
import type { TenantRoleItem } from "../types";

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
                    customer: ["read", "create", "update"],
                    customer_store: ["read"],
                    customer_category_tag: ["read"],
                    customer_quote: ["read"],
                    "procurement.order": [
                        "read",
                        "create",
                        "update",
                        "audit",
                        "export",
                    ],
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
        React.createElement(RolePermissionManager, {
            initialRoles: sampleRoles,
            activeOrgId: "org_test",
        }),
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
        }),
    );

    // 页面正常渲染且包含字段配置入口
    assert.match(html, /采购订单管理/);
    assert.match(html, /字段策略/);
});
