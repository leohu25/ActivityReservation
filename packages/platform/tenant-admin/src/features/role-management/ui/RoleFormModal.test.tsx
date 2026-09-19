import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { UiAbilityProvider } from "@base/ui";
import { RoleFormModal } from "./RoleFormModal";
import type { TenantRoleItem } from "../types";

const mockRole: TenantRoleItem = {
  id: "role-001",
  role: "warehouse_keeper",
  name: "仓管员",
  description: "负责出入库盘点与货位管理",
  isSystem: false,
  permissions: {
    statement: {},
    dataScopes: [],
    fieldPolicies: [],
  },
  updatedAt: new Date(),
};

test("RoleFormModal [新建模式]: 渲染新建业务角色标题与代码录入字段", () => {
  const html = renderToString(
    <RoleFormModal
      open={true}
      inline={true}
      mode="create"
      record={null}
      onClose={() => {}}
    />,
  );

  assert.match(html, /新建业务角色/);
  assert.match(html, /角色标识代码/);
  assert.match(html, /角色显示名称/);
  assert.match(html, /确认创建/);
});

test("RoleFormModal [编辑模式]: 回填既有角色信息并锁定不可变代码", () => {
  const html = renderToString(
    <RoleFormModal
      open={true}
      inline={true}
      mode="edit"
      record={mockRole}
      onClose={() => {}}
    />,
  );

  assert.match(html, /编辑角色: 仓管员/);
  assert.match(html, /warehouse_keeper/);
  assert.match(html, /保存修改/);
});

test("RoleFormModal [CASL 权限感知]: 隐藏敏感字段时不予渲染", () => {
  const restrictedAbility = {
    can(_action: string, subject: string, field?: string) {
      if (subject === "Role" && field === "description") {
        return false;
      }
      return true;
    },
  };

  const html = renderToString(
    <UiAbilityProvider ability={restrictedAbility}>
      <RoleFormModal
        open={true}
        inline={true}
        mode="create"
        record={null}
        onClose={() => {}}
      />
    </UiAbilityProvider>,
  );

  assert.match(html, /角色显示名称/);
  assert.doesNotMatch(html, /职责描述/);
});
