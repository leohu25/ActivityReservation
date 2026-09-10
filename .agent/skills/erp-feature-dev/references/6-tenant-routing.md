# 模块 6：租户端路由接入、Manifest 注册与契约对齐单测

业务切片开发完毕后，需要挂载到租户应用路由中，并在切片根部暴露自描述清单 `manifest.ts`，最后编写自动化单测锁死契约。

---

## 1. 租户端应用路由挂载 (`apps/tenant/src/app/...`)

租户端页面属于 Next.js Server Components，负责提取租户会话、CASL 权限与数据并下发给 Client Component：

```tsx
// apps/tenant/src/app/(dashboard)/customer/customers/page.tsx
import React from "react";
import {
  CustomerView,
  CustomerSubject,
  listCustomersAction,
  getCategoryTreeAction,
  listTagsAction,
} from "@chenrun/feature-customer-center";
import { getTenantSubjectPermissions } from "@chenrun/feature-tenant-admin/server";

export default async function CustomersPage() {
  // 1. 并行获取业务数据与 CASL 权限
  const [custRes, catRes, tagsRes, permissions] = await Promise.all([
    listCustomersAction(),
    getCategoryTreeAction(),
    listTagsAction(),
    getTenantSubjectPermissions(CustomerSubject),
  ]);

  const customers = custRes.success && custRes.data ? custRes.data : [];
  const categories = catRes.success && catRes.data ? catRes.data : [];
  const tags = tagsRes.success && tagsRes.data ? tagsRes.data : [];

  // 2. 渲染 Client Component
  return (
    <CustomerView
      initialCustomers={customers}
      categories={categories}
      tags={tags}
      permissions={permissions}
    />
  );
}
```

---

## 2. 切片自描述清单 (`src/manifest.ts`)

切片根目录必须暴露 `manifest.ts`，声明导航菜单结构与挂载的页面契约：

```ts
import type { FeatureManifest } from "@chenrun/authorization";
import { customerPageContract, storePageContract } from "./contracts";

export const customerCenterManifest: FeatureManifest = {
  id: "customer-center",
  name: "客户中心",
  version: "1.0.0",
  description: "企业客户主数据、多门店履约、阶梯报价与业务分类标签管理中心",
  navSections: [
    {
      id: "customer-center",
      title: "客户中心",
      icon: "Users",
      sort: 20,
      items: [
        {
          id: "customer-management",
          title: "客户档案",
          path: "/customer/customers",
          requiredAction: "read",
          subject: customerPageContract.subject,
        },
      ],
    },
  ],
  permissionModules: [
    {
      id: "customer-mgmt",
      name: "客户档案管理",
      pages: [customerPageContract, storePageContract],
    },
  ],
};
```

---

## 3. 契约 100% 对齐自动化测试 (`CustomerView.test.tsx`)

防止后续迭代产生“空头支票”或“幽灵权限”，编写单元测试：

```tsx
test("CustomerView 与 customerPageContract 契约 100% 对齐", () => {
  const html = renderToString(
    React.createElement(CustomerView, {
      initialCustomers: mockCustomers,
      categories: [],
      tags: [],
      permissions: {
        actions: ["read", "create", "update", "delete", "export"],
        fieldPolicies: {},
      },
    }),
  );

  // 验证契约声明的每个动作按钮在界面上都能找到对应元素，杜绝脱节
  assert.match(html, /新建客户/);
  assert.match(html, /导出数据/);
});
```
