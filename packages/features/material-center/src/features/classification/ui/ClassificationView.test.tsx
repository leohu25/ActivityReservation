import * as React from "react";
import test from "node:test";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { TenantAbilityProvider } from "@base/authorization";
import { ClassificationView } from "./ClassificationView";
import { ItemCategorySubject, ItemVarietySubject } from "../contract";

// Node.js SSR 环境兜底
(globalThis as any).React = React;

test("ClassificationView 权限门禁：普通成员无 create 权限时，DataTable 模板的新增按钮自动隐藏", () => {
  // 1. 模拟只读权限快照（无 create 权限）
  const readOnlySnapshots = [
    {
      subject: ItemCategorySubject,
      actions: ["read"],
    },
    {
      subject: ItemVarietySubject,
      actions: ["read"],
    },
  ];

  const readOnlyHtml = renderToString(
    <TenantAbilityProvider snapshots={readOnlySnapshots}>
      <ClassificationView initialCategories={[]} initialVarieties={[]} />
    </TenantAbilityProvider>,
  );

  // 验证：无 create 权限时不应渲染 DataTable 工具栏的“新增分类”按钮
  assert.doesNotMatch(readOnlyHtml, /新增分类/);

  // 2. 模拟包含 create 权限的快照（如主管或管理员）
  const fullSnapshots = [
    {
      subject: ItemCategorySubject,
      actions: ["read", "create"],
    },
    {
      subject: ItemVarietySubject,
      actions: ["read", "create"],
    },
  ];

  const fullHtml = renderToString(
    <TenantAbilityProvider snapshots={fullSnapshots}>
      <ClassificationView initialCategories={[]} initialVarieties={[]} />
    </TenantAbilityProvider>,
  );

  // 验证：具有 create 权限时正确渲染 DataTable 模板的新增按钮
  assert.match(fullHtml, /新增分类/);
});
