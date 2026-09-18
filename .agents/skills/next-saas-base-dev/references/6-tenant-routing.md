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
import { createResourcePage } from "@base/biz-shared";
import {
  CustomerView,
  customerSearchParams,
  customerPageContract,
  CustomerSubject,
  type CustomerListItem,
} from "@base/feature-customer-center/customer-management";
import {
  listCustomersQuery,
  getCustomerPageOptionsQuery,
} from "@base/feature-customer-center/customer-management/server";

export default createResourcePage<CustomerListItem, { categoryOptions: []; tagOptions: [] }>({
  search: customerSearchParams,
  subject: CustomerSubject,
  pageContract: customerPageContract,
  title: "客户档案",
  rowKey: (c) => c.id || c.customerCode,
  columns: [],
  List: ({ data, total, options }) => (
    <CustomerView
      data={data}
      total={total}
      categoryOptions={options?.categoryOptions}
      tagOptions={options?.tagOptions}
    />
  ),
  query: {
    list: async (parsed) => {
      const r = await listCustomersQuery({
        page: parsed.page,
        pageSize: parsed.pageSize,
        keyword: String(parsed.keyword ?? "") || undefined,
        categoryCode: String(parsed.category ?? "") || undefined,
        status: String(parsed.status ?? "") || undefined,
      });
      return { items: r.items as CustomerListItem[], total: r.total };
    },
    options: async () => getCustomerPageOptionsQuery(),
  },
});
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
  /** 切片贡献的标准功能页面池（切片内无需重复写 featureId/featureName，由容器自动注入） */
  pages: [
    {
      pageKey: "customer-customers",
      defaultLabel: "客户档案",
      href: "/customer/customers",
      defaultIcon: "Users",
      requiredAction: StandardAction.READ,
      requiredSubject: CustomerSubject,
    },
    {
      pageKey: "customer-stores",
      defaultLabel: "门店档案",
      href: "/customer/stores",
      defaultIcon: "Store",
      requiredAction: StandardAction.READ,
      requiredSubject: CustomerStoreSubject,
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

> **核心设计规范（解耦与单一源头）**：
>
> 1. **切片只管能力，不管菜单**：业务切片通过 `pages` 贡献标准功能页面，彻底消除过时的 `navSections` 嵌套伪契约；
> 2. **消除重复冗余**：每个页面无需重复手写 `featureId` 与 `featureName`，系统在派生时自动从 Manifest 的 `id` 与 `name` 继承注入；
> 3. **动态多级菜单与权限解耦**：租户在界面上无论是创建 2 级还是 3 级目录、对菜单项重命名、还是挂载外部链接，都不会破坏底层 CASL 权限；
> 4. **角色权限自动对齐**：角色权限管理界面自动调用 `deriveMenuAlignedPermissionTree`，100% 按照租户当前生效的业务菜单树展示大纲，并以【查看 (read)】权限作为页面访问与菜单点亮的联动开关。

---

## 3. 契约 100% 对齐自动化测试 (`CustomerView.test.tsx`)

用 **AbilityProvider 包裹**注入权限，禁止给 View 塞 `permissions` prop：

```tsx
import { TenantAbilityProvider } from "@base/authorization";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
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
      <NuqsTestingAdapter>
        <CustomerView
          data={mockCustomers}
          total={mockCustomers.length}
          categoryOptions={[]}
          tagOptions={[]}
        />
      </NuqsTestingAdapter>
    </TenantAbilityProvider>,
  );

  assert.match(html, /新增/);
  assert.match(html, /导出/);
});
```
