import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  TenantAbilityProvider,
  createAbilityFromSnapshot,
} from "@base/authorization";
import { UiAbilityProvider } from "@base/ui";
import { CategoryTagView } from "./CategoryTagView";
import { CustomerCategorySubject, CustomerTagSubject } from "../contract";
import type { CustomerCategoryItem, CustomerTagItem } from "../types";

const mockCategories: CustomerCategoryItem[] = [
  {
    categoryCode: "CAT_VIP",
    categoryName: "VIP 战略客户",
    parentCode: null,
    status: "ACTIVE",
    description: "大宗年采客户",
    children: [],
  },
];

const mockTags: CustomerTagItem[] = [
  {
    tagCode: "TAG_DELIVERY_COLD",
    tagName: "冷链专送",
    tagType: "DELIVERY",
    status: "ACTIVE",
    description: "需全程冷链",
  },
];

function renderViewWithAbility(
  ui: React.ReactElement,
  permissions: {
    categoryActions?: readonly string[];
    tagActions?: readonly string[];
  },
) {
  const snapshots = [
    {
      subject: CustomerCategorySubject,
      actions: permissions.categoryActions ?? [],
      fieldPolicies: {},
    },
    {
      subject: CustomerTagSubject,
      actions: permissions.tagActions ?? [],
      fieldPolicies: {},
    },
  ];
  const ability = createAbilityFromSnapshot(snapshots);

  return renderToString(
    <TenantAbilityProvider snapshots={snapshots}>
      <UiAbilityProvider ability={ability}>{ui}</UiAbilityProvider>
    </TenantAbilityProvider>,
  );
}

test("CategoryTagView: 仅拥有 read 权限时不渲染任何新增/编辑/删除/状态操作按钮", () => {
  const html = renderViewWithAbility(
    <CategoryTagView
      initialCategories={mockCategories}
      initialTags={mockTags}
      canReadCategory={true}
      canReadTag={true}
    />,
    {
      categoryActions: ["read"],
      tagActions: ["read"],
    },
  );

  assert.doesNotMatch(
    html,
    /新增一级根分类/,
    "无 create 权限不应显示新增根分类",
  );
  assert.doesNotMatch(html, /新增标签/, "无 create 权限不应显示新增标签");
  assert.doesNotMatch(html, />编辑</, "无 update 权限不应显示编辑按钮");
  // 注意 Badge 会显示状态字样（如 "启用"），断言操作按钮时匹配 Button 专属交互
  assert.doesNotMatch(
    html,
    /Button[^>]*>[\s\S]*?(停用|启用)<\/Button>/,
    "无 update 权限不应显示停用/启用操作按钮",
  );
  assert.doesNotMatch(
    html,
    /title="删除分类"/,
    "无 delete 权限不应显示删除分类",
  );
  assert.doesNotMatch(
    html,
    /title="删除标签"/,
    "无 delete 权限不应显示删除标签",
  );
});

test("CategoryTagView: 具有完整 CRUD 权限时展示新增、编辑与删除按钮", () => {
  const html = renderViewWithAbility(
    <CategoryTagView
      initialCategories={mockCategories}
      initialTags={mockTags}
      canReadCategory={true}
      canReadTag={true}
    />,
    {
      categoryActions: ["read", "create", "update", "delete"],
      tagActions: ["read", "create", "update", "delete"],
    },
  );

  assert.match(html, /新增一级根分类/, "有 create 权限应展示新增根分类");
  assert.match(html, /新增标签/, "有 create 权限应展示新增标签");
  assert.match(html, />编辑</, "有 update 权限应展示编辑按钮");
  assert.match(html, />停用</, "有 update 权限且当前为 ACTIVE 应展示停用按钮");
  assert.match(html, /title="删除分类"/, "有 delete 权限应展示删除分类按钮");
  assert.match(
    html,
    />删除<\/span>/,
    "有 delete 权限应在表格操作列中展示删除按钮",
  );
});
