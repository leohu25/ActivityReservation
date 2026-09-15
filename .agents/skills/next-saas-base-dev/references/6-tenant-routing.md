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
import { CustomerAbilityBoundary } from "@base/feature-customer-center/shared";
import { CustomerSubject } from "@base/feature-customer-center/customer-management";
import { CustomerStoreSubject } from "@base/feature-customer-center/store-management";
import { CustomerQuoteSubject } from "@base/feature-customer-center/quotation-management";
import {
  CustomerCategorySubject,
  CustomerTagSubject,
} from "@base/feature-customer-center/customer-management/classification";
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
import { CustomerView } from "@base/feature-customer-center/customer-management";
import {
  listCustomersQuery,
  getCategoryTreeQuery,
  listTagsQuery,
} from "@base/feature-customer-center/customer-management/server";

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

切片根目录必须暴露 `manifest.ts`，声明切片基本信息、默认导航推荐树、权限受控模块，以及**供动态菜单选用挂载的 `StandardPageDescriptor` 标准页面功能池**：

```ts
import {
  StandardAction,
  type TenantFeatureManifest,
} from "@base/authorization";
import {
  CustomerSubject,
  customerPageContract,
} from "./features/customer-management/contract";
import {
  CustomerStoreSubject,
  storePageContract,
} from "./features/store-management/contract";

export const customerManifest: TenantFeatureManifest = {
  id: "customer-center",
  name: "客户中心",
  order: 10,
  /** 切片贡献的标准功能页面池（供租户业务导航菜单配置器自由选用与跨切片挂载） */
  pages: [
    {
      pageKey: "customer.customer",
      defaultLabel: "客户档案",
      href: "/customer/customers",
      defaultIcon: "Users",
      requiredAction: StandardAction.READ,
      requiredSubject: CustomerSubject,
      featureId: "customer-center",
      featureName: "客户中心",
    },
    {
      pageKey: "customer.store",
      defaultLabel: "门店档案",
      href: "/customer/stores",
      defaultIcon: "Store",
      requiredAction: StandardAction.READ,
      requiredSubject: CustomerStoreSubject,
      featureId: "customer-center",
      featureName: "客户中心",
    },
  ],
  /** 出厂默认预设推荐树（当切片未配置显式 pages 时，构建期引擎亦会自动从 navSections 递归提取） */
  navSections: [
    {
      id: "customer",
      order: 10,
      items: [
        {
          id: "group-customer-center",
          label: "客户中心",
          icon: "UserCheck",
          items: [
            {
              id: "customer-customers",
              label: "客户档案",
              href: "/customer/customers",
              requiredAction: StandardAction.READ,
              requiredSubject: CustomerSubject,
            },
          ],
        },
      ],
    },
  ],
  permissionModules: [
    {
      moduleKey: "customer",
      label: "客户中心",
      iconName: "UserCheck",
      order: 10,
      pages: [customerPageContract, storePageContract],
    },
  ],
};
```

> **核心设计规范（解耦与对齐）**：
>
> 1. **纯业务功能池解耦**：切片通过 `pages` 贡献标准功能页面（包含底层路由 `href` 与权限主体 `requiredSubject`）。业务菜单配置器只能选用纯业务页面，系统管理基座被刚性隔离；
> 2. **动态多级菜单与权限解耦**：租户在界面上无论是创建 2 级还是 3 级目录、对菜单项重命名、还是挂载外部链接，都不会破坏底层 CASL 权限；
> 3. **角色权限自动对齐**：角色权限管理界面自动调用 `deriveMenuAlignedPermissionTree`，100% 按照租户当前生效的业务菜单树展示大纲，并以【查看 (read)】权限作为页面访问与菜单点亮的联动开关。

---

## 3. 契约 100% 对齐自动化测试 (`CustomerView.test.tsx`)

用 **AbilityProvider 包裹**注入权限，禁止给 View 塞 `permissions` prop：

```tsx
import { TenantAbilityProvider } from "@base/authorization";
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
      <CustomerView
        initialCustomers={mockCustomers}
        categories={[]}
        tags={[]}
      />
    </TenantAbilityProvider>,
  );

  assert.match(html, /新增/);
  assert.match(html, /导出/);
});
```
