import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { Sidebar } from "./components/layout/Sidebar";

test("Sidebar 默认渲染出标准多级导航与各核心菜单分组", () => {
  const html = renderToString(
    React.createElement(Sidebar, { currentPath: "/workbench" }),
  );

  // 验证基础顶级菜单
  assert.ok(html.includes("工作台"));
  assert.ok(html.includes('href="/workbench"'));

  // 验证业务中心区块
  assert.ok(html.includes("业务中心"));
  assert.ok(html.includes("采购订单中心"));
  assert.ok(html.includes('href="/procurement/orders"'));

  // 验证系统管理区块与其多级折叠分组
  assert.ok(html.includes("系统管理"));
  assert.ok(html.includes("组织架构"));
  assert.ok(html.includes("权限管理"));
  assert.ok(html.includes("企业设置"));
  assert.ok(html.includes("审计日志"));
});

test("Sidebar 依据 currentPath 自动展开所属父级分组并高亮对应子项", () => {
  // 当访问 /settings/company 时，系统管理的“企业设置”应展开并渲染其子链接
  const html = renderToString(
    React.createElement(Sidebar, { currentPath: "/settings/company" }),
  );

  assert.ok(html.includes("企业信息"));
  assert.ok(html.includes('href="/settings/company"'));
  assert.ok(html.includes("基础设置"));
  assert.ok(html.includes("安全设置"));

  // 校验激活样式包含特定高亮类
  assert.ok(html.includes("bg-blue-50"));
});

test("Sidebar 支持通过 can 回调执行功能权限过滤", () => {
  // 拒绝 PurchaseOrder.read 权限
  const canMock = (action: string, subject: string) => {
    if (subject === "PurchaseOrder" && action === "read") {
      return false;
    }
    return true;
  };

  const html = renderToString(
    React.createElement(Sidebar, {
      currentPath: "/workbench",
      can: canMock,
    }),
  );

  // 采购订单中心被过滤
  assert.ok(!html.includes("采购订单中心"));
  assert.ok(!html.includes('href="/procurement/orders"'));

  // 工作台与其他公开/有权限项正常保留
  assert.ok(html.includes("工作台"));
  assert.ok(html.includes("组织架构"));
});

test("Sidebar 兼容扁平 navItems 传参模式", () => {
  const customItems = [
    { id: "custom-1", label: "自定义单页", href: "/custom/page" },
  ];

  const html = renderToString(
    React.createElement(Sidebar, {
      navItems: customItems,
      currentPath: "/custom/page",
    }),
  );

  assert.ok(html.includes("自定义单页"));
  assert.ok(html.includes('href="/custom/page"'));
});
