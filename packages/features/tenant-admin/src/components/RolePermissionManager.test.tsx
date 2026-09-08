import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { ProcurementSubject } from "@chenrun/feature-procurement-center";
import { RolePermissionManager } from "./RolePermissionManager";
import type { TenantRoleItem } from "../types";

test("RolePermissionManager 正确渲染四层角色权限配置面板与字段矩阵", () => {
  const sampleRoles: TenantRoleItem[] = [
    {
      id: "role_owner",
      role: "owner",
      name: "超级管理员 (Owner)",
      description: "租户全量最高权限",
      isSystem: true,
      permissions: {
        statement: {
          "procurement.order": ["read", "create", "update", "audit", "export"],
        },
        dataScopes: [
          {
            resource: "procurement.order",
            action: "read",
            scopeType: "ALL",
          },
        ],
        fieldPolicies: [
          {
            subject: ProcurementSubject,
            field: "costPrice",
            access: "EDITABLE",
          },
        ],
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
        fieldPolicies: [
          {
            subject: ProcurementSubject,
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
      initialRoles: sampleRoles,
      activeOrgId: "org_test",
    }),
  );

  // 1. 角色列表与标识
  assert.match(html, /角色与权限配置中心/);
  assert.match(html, /超级管理员 \(Owner\)/);
  assert.match(html, /采购专员/);
  assert.match(html, /系统保留角色/);

  // 2. 第一层：功能操作权限
  assert.match(html, /功能按钮与操作权限/);
  assert.match(html, /查看订单/);
  assert.match(html, /审批订单/);
  assert.match(html, /导出数据/);

  // 3. 第二层：数据范围 Scopes
  assert.match(html, /数据过滤范围/);
  assert.match(html, /仅本人数据/);
  assert.match(html, /本部门数据/);
  assert.match(html, /本部门及下级部门/);
  assert.match(html, /全公司\/全租户/);

  // 4. 第三层：字段权限四维控制矩阵
  assert.match(html, /字段权限控制矩阵/);
  assert.match(html, /采购成本单价/);
  assert.match(html, /敏感资产/);
  assert.match(html, /供应商名称/);
  assert.match(html, /订单审批状态/);
});

test("RolePermissionManager 当 policy 为 undefined 时，拥有写权限推导为 EDITABLE，仅有读权限推导为 READONLY", () => {
  const rolesWithoutFieldPolicies: TenantRoleItem[] = [
    {
      id: "role_writer",
      role: "writer",
      name: "录入员",
      description: "拥有更新动作但无显式字段策略",
      isSystem: false,
      permissions: {
        statement: {
          "procurement.order": ["read", "update"],
        },
        dataScopes: [],
        fieldPolicies: [], // 未单独配置字段策略
      },
      updatedAt: null,
    },
  ];

  const html = renderToString(
    React.createElement(RolePermissionManager, {
      initialRoles: rolesWithoutFieldPolicies,
      activeOrgId: "org_test",
    }),
  );

  // 拥有 update 动作，默认推导为可编辑 (EDITABLE)
  assert.match(html, /可编辑 \(EDITABLE\)/);
  assert.doesNotMatch(html, /只读 \(READONLY\)/);

  const rolesOnlyReader: TenantRoleItem[] = [
    {
      id: "role_reader",
      role: "reader",
      name: "只读员",
      description: "仅有查看动作但无显式字段策略",
      isSystem: false,
      permissions: {
        statement: {
          "procurement.order": ["read"],
        },
        dataScopes: [],
        fieldPolicies: [], // 未单独配置字段策略
      },
      updatedAt: null,
    },
  ];

  const readerHtml = renderToString(
    React.createElement(RolePermissionManager, {
      initialRoles: rolesOnlyReader,
      activeOrgId: "org_test",
    }),
  );

  // 仅有 read 动作，默认推导为只读 (READONLY)
  assert.match(readerHtml, /只读 \(READONLY\)/);
  assert.doesNotMatch(readerHtml, /可编辑 \(EDITABLE\)/);
});
