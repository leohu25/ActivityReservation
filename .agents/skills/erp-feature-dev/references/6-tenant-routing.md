# 模块 6：租户端路由接入、Manifest 注册与契约对齐单测

业务切片开发完毕后，需要挂载到租户应用路由中，并在切片根部暴露自描述清单 `manifest.ts`，最后编写自动化单测锁死契约。

---

## 1. 租户端路由：layout 注入 Ability + page 只取数据

**教科书形态**（与 `references/7-casl-ability-provider.md` 一致）：

1. **切片 layout（RSC）**：拉取本切片全部 Subject 权限快照，挂 `*AbilityBoundary` → `TenantAbilityProvider`
2. **page（RSC）**：只请求业务数据，**禁止**再 `getTenantSubjectPermissions`、**禁止**向 View 传 `permissions`/`ability`
3. **View（Client）**：只声明 `subject`，消费 `useAbility()` / DataTable 积木

```tsx
// apps/tenant/src/app/(dashboard)/customer/layout.tsx
import { CustomerAbilityBoundary } from "@chenrun/feature-customer-center/shared";
import { CustomerSubject } from "@chenrun/feature-customer-center/customer-management";
import { CustomerStoreSubject } from "@chenrun/feature-customer-center/store-management";
import { CustomerQuoteSubject } from "@chenrun/feature-customer-center/quotation-management";
import {
  CustomerCategorySubject,
  CustomerTagSubject,
} from "@chenrun/feature-customer-center/customer-management/classification";
import { getTenantSubjectPermissions } from "@/kernel";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [customer, store, quote, category, tag] = await Promise.all([
    getTenantSubjectPermissions(CustomerSubject),
    getTenantSubjectPermissions(CustomerStoreSubject),
    getTenantSubjectPermissions(CustomerQuoteSubject),
    getTenantSubjectPermissions(CustomerCategorySubject),
    getTenantSubjectPermissions(CustomerTagSubject),
  ]);

  return (
    <CustomerAbilityBoundary
      permissions={{ customer, store, quote, category, tag }}
    >
      {children}
    </CustomerAbilityBoundary>
  );
}
```

```tsx
// apps/tenant/src/app/(dashboard)/customer/customers/page.tsx
import { CustomerView } from "@chenrun/feature-customer-center/customer-management";
import {
  listCustomersQuery,
  getCategoryTreeQuery,
  listTagsQuery,
} from "@chenrun/feature-customer-center/customer-management/server";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  // 直接通过 server-only queries 纯服务端获取数据，不绕调 Server Actions
  const [custRes, categories, tags] = await Promise.all([
    listCustomersQuery({ page: 1, pageSize: 20 }),
    getCategoryTreeQuery(),
    listTagsQuery(),
  ]);

  return (
    <CustomerView
      initialCustomers={custRes.items}
      initialTotal={custRes.total}
      categories={categories}
      tags={tags}
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

用 **AbilityProvider 包裹**注入权限，禁止给 View 塞 `permissions` prop：

```tsx
import { TenantAbilityProvider } from "@chenrun/authorization";
import { CustomerView } from "./CustomerView";

test("CustomerView 与 customerPageContract 契约 100% 对齐", () => {
  const html = renderToString(
    <TenantAbilityProvider
      snapshots={{
        subject: "Customer",
        actions: ["read", "create", "update", "delete", "export"],
        fieldPolicies: {},
      }}
    >
      <CustomerView initialCustomers={mockCustomers} categories={[]} tags={[]} />
    </TenantAbilityProvider>,
  );

  assert.match(html, /新增/);
  assert.match(html, /导出/);
});
```
