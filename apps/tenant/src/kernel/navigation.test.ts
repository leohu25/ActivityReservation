import test from "node:test";
import assert from "node:assert/strict";
import type { FeatureNavSection } from "@base/authorization";
import { getFirstAccessiblePath } from "./navigation";

test("getFirstAccessiblePath: 当授权列表中存在工作台时，优先返回工作台路径", () => {
  const mockSections: FeatureNavSection[] = [
    {
      id: "base",
      items: [
        {
          id: "workbench",
          label: "工作台",
          href: "/workbench",
        },
      ],
    },
    {
      id: "customer",
      title: "客户中心",
      items: [
        {
          id: "customers",
          label: "客户档案",
          href: "/customer/customers",
        },
      ],
    },
  ];

  const landing = getFirstAccessiblePath(mockSections);
  assert.equal(landing, "/workbench");
});

test("getFirstAccessiblePath: 当未配置工作台或无工作台权限时，自动降落到首个有效业务叶子路由", () => {
  const mockSections: FeatureNavSection[] = [
    {
      id: "customer",
      title: "客户中心",
      items: [
        {
          id: "customer-group",
          label: "客户管理",
          items: [
            {
              id: "customers",
              label: "客户档案",
              href: "/customer/customers",
            },
            {
              id: "tags",
              label: "客户标签",
              href: "/customer/tags",
            },
          ],
        },
      ],
    },
  ];

  const landing = getFirstAccessiblePath(mockSections);
  assert.equal(landing, "/customer/customers");
});

test("getFirstAccessiblePath: 当授权菜单列表为空时，安全回退到 /login", () => {
  const landing = getFirstAccessiblePath([]);
  assert.equal(landing, "/login");
});
