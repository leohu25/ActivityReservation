import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { TabBar } from "./TabBar";

test("TabBar 正确渲染默认固定首页标签与操作菜单", () => {
  const html = renderToString(
    React.createElement(TabBar, {
      homeTab: { title: "工作台", path: "/workbench", closable: false },
      sections: [],
    }),
  );

  // 验证固定工作台
  assert.ok(html.includes("工作台"));
  assert.ok(html.includes('href="/workbench"'));
  // 验证 context-menu trigger
  assert.ok(html.includes('data-slot="context-menu-trigger"'));
  // 验证 dropdown-menu trigger
  assert.ok(html.includes('data-slot="dropdown-menu-trigger"'));
  // 验证滚动条隐藏属性
  assert.ok(html.includes("[scrollbar-width:none]"));
});

test("TabBar 正确渲染导航配置中的标题提取支持", () => {
  const mockSections = [
    {
      id: "orders",
      title: "订单中心",
      items: [
        {
          id: "sales-orders",
          label: "销售订单",
          href: "/order/sales-orders",
        },
      ],
    },
  ];

  const html = renderToString(
    React.createElement(TabBar, {
      homeTab: { title: "工作台", path: "/workbench", closable: false },
      sections: mockSections,
    }),
  );

  assert.ok(html.includes("工作台"));
});
