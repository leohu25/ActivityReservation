import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { NavigationConfigView } from "./NavigationConfigView";
import type { NavigationConfigData } from "../types";

const mockInitialData: NavigationConfigData = {
  currentTree: [
    {
      id: "group-base",
      parentId: null,
      itemType: "GROUP",
      customLabel: "基础设置",
      customIcon: "Settings",
      sortOrder: 1,
      isVisible: true,
      children: [
        {
          id: "item-unit",
          parentId: "group-base",
          itemType: "PAGE",
          pageKey: "material.unit",
          customLabel: "单位档案",
          sortOrder: 1,
          isVisible: true,
        },
      ],
    },
  ],
  availablePages: [
    {
      pageKey: "material.unit",
      defaultLabel: "计量单位",
      href: "/materials/units",
      defaultIcon: "Scale",
      requiredAction: "read",
      requiredSubject: "MaterialUnit",
      featureId: "customer-center",
      featureName: "物料管理",
    },
    {
      pageKey: "customer.classification",
      defaultLabel: "分类与标签",
      href: "/customer/categories-tags",
      defaultIcon: "Tags",
      requiredAction: "read",
      requiredSubject: "CustomerCategory",
      featureId: "customer-center",
      featureName: "客户中心",
    },
  ],
  isDefault: false,
};

test("NavigationConfigView 双栏 Master-Detail 布局渲染正常且支持外链与功能池", () => {
  const html = renderToString(
    <NavigationConfigView data={mockInitialData} />,
  );

  // 验证全局操作条
  assert.ok(html.includes("保存生效"));

  // 验证左侧大纲树
  assert.ok(html.includes("业务菜单树"));
  assert.ok(html.includes("基础设置"));
  assert.ok(html.includes("单位档案"));

  // 验证右侧属性面板与功能池
  assert.ok(html.includes("功能页面池"));
  assert.ok(html.includes("分类与标签"));
});

test("NavigationConfigView 受保护节点渲染保护徽标且禁用删除", () => {
  const protectedData: NavigationConfigData = {
    currentTree: [
      {
        id: "node-nav",
        parentId: null,
        itemType: "PAGE",
        pageKey: "settings-navigation",
        sortOrder: 1,
        isVisible: true,
      },
    ],
    availablePages: [
      {
        pageKey: "settings-navigation",
        defaultLabel: "菜单导航设置",
        href: "/settings/navigation",
        defaultIcon: "FolderTree",
        requiredAction: "read",
        requiredSubject: "TenantMenuItem",
        featureId: "tenant-admin",
        featureName: "系统管理",
        isSystem: true,
        isProtected: true,
      },
    ],
    isDefault: false,
  };

  const html = renderToString(
    <NavigationConfigView data={protectedData} />,
  );

  // 验证保护徽标被渲染
  assert.ok(html.includes("保护"));
  // 验证受保护节点的提示与禁用说明
  assert.ok(html.includes("系统核心受保护功能不可删除"));
});
