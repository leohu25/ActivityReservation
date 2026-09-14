# 模块 7：官方 CASL 客户端范式（教科书形态）

> **权威样板**：`customer-center` + `apps/tenant/src/app/(dashboard)/customer/layout.tsx`  
> 新切片 / 迁移旧切片一律按本模块，禁止再引入「View 自建 plain ability + 传 `permissions` props」双轨。

## 0. 为什么是这个形态

| 约束 | 结论 |
| ------ | ------ |
| RSC 不能传 Ability 实例 | 只传可序列化快照 `{ subject, actions, fieldPolicies }` |
| 官方 `@casl/react` | 客户端用同一套规则 `createMongoAbility` 重建实例 |
| Next App Router | Client 边界挂 `AbilityProvider` 完全合法 |

```text
RSC layout  getTenantSubjectPermissions(subject…)
        │  纯数据快照
        ▼
build*AbilitySnapshots()  →  TenantAbilityProvider（仅 snapshots）
        │  createMongoAbility → AbilityProvider
        ▼
page / View / DataTable 积木
        useAbility() / <Can> / ActionButton / AuthField
        │
        ▼
Server Action  assert*Ability(...)   ← 安全真相永远在服务端
```

**UI 隐藏 ≠ 安全**。客户端 Provider 只做体验层；写路径必须服务端 CASL 断言。

---

## 1. 四个入口（必须记住）

| 角色 | API | 位置 |
| ------ | ----- | ------ |
| 拉权限 | `getTenantSubjectPermissions(subject)` | `apps/tenant/src/kernel` |
| 编快照 | `buildCustomerAbilitySnapshots` / 自建 `AbilitySnapshot[]` | Business Area `shared/ui/*AbilityBoundary.tsx` |
| 注入 | `TenantAbilityProvider snapshots={...}` | 切片 layout 或 Boundary |
| 消费 | `useAbility()` / `Can` / DataTable 积木 | Client View |
| 写路径 | `assert*Ability(ability, action, subject)` | Feature `actions.ts` |

导出（均可从 `@base/authorization` 或 `@base/ui`）：

```ts
import {
  TenantAbilityProvider,
  createAbilityFromSnapshot,
  Can,
  useAbility,
  useOptionalAbility,
  type AbilitySnapshot,
} from "@base/authorization";
```

---

## 2. 标准文件骨架

### 2.1 切片 Ability Boundary（Client）

```tsx
// packages/features/<business-area>/src/shared/ui/<Area>AbilityBoundary.tsx
"use client";
import React from "react";
import {
  TenantAbilityProvider,
  type AbilitySnapshot,
} from "@base/authorization";

export function buildSliceAbilitySnapshots(permissions: {
  /* 各 Subject 的 { actions, fieldPolicies } */
}): AbilitySnapshot[] {
  return [
    {
      subject: "Customer",
      actions: permissions.customer.actions,
      fieldPolicies: permissions.customer.fieldPolicies,
    },
    // …其他 Subject
  ];
}

export function SliceAbilityBoundary({
  permissions,
  children,
}: {
  permissions: /* 同上 */;
  children: React.ReactNode;
}) {
  const snapshots = React.useMemo(
    () => buildSliceAbilitySnapshots(permissions),
    [permissions],
  );
  return (
    <TenantAbilityProvider snapshots={snapshots}>{children}</TenantAbilityProvider>
  );
}
```

### 2.2 租户路由 layout（RSC，一次注入）

```tsx
// apps/tenant/src/app/(dashboard)/<slice>/layout.tsx
import { SliceAbilityBoundary } from "@base/feature-<area>/shared";
import { CustomerSubject } from "@base/feature-<area>/customer-management";
import { CustomerStoreSubject } from "@base/feature-<area>/store-management";
import { getTenantSubjectPermissions } from "@/kernel";

export default async function SliceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [customer, store] = await Promise.all([
    getTenantSubjectPermissions(CustomerSubject),
    getTenantSubjectPermissions(CustomerStoreSubject),
  ]);

  return (
    <SliceAbilityBoundary permissions={{ customer, store }}>
      {children}
    </SliceAbilityBoundary>
  );
}
```

### 2.3 page 只取业务数据

```tsx
// page.tsx — 禁止再 getTenantSubjectPermissions、禁止传 permissions/ability
const pageData = await listXxxQuery({ page, pageSize });
return <XxxView initialItems={pageData.items} initialTotal={pageData.total} />;
```

### 2.4 View 只声明 subject + useAbility

```tsx
"use client";
import { useAbility } from "@base/authorization";
import { DataTable } from "@base/ui";

export function XxxView({ initialItems }: Props) {
  const ability = useAbility(); // 仅导出等需要命令式 can() 时使用

  return (
    <DataTable.Workspace
      data={items}
      columns={columns}
      rowKey={(r) => r.id}
      subject={XxxSubject} // 只传 subject！
      title="…"
    />
  );
}
```

**禁止**出现在 View Props / Workspace 上：

- `permissions`
- 自建 plain `ability` 对象
- View 内部再包一层 `TenantAbilityProvider`（除非独立 Story/测试）

---

## 3. 字段三态与快照编译

`createAbilityFromSnapshot` 将快照编译为 CASL `RawRule[]`：

| fieldPolicies | read | create/update |
| --------------- | ------ | ---------------- |
| 无策略 | `{ action, subject }` 全字段 | 同左 |
| `HIDDEN` | **不进入** `fields` | 不可写 |
| `READONLY` | 进入 `fields` | **不进入** writable fields |
| `EDITABLE` | 进入 `fields` | 进入 `fields` |

Fail-Closed：`actions: []` → 一切拒绝；无 Provider 时 `useOptionalAbility()` 为 `null` → 积木拒绝渲染。

---

## 4. DataTable 积木与自定义控件如何吃权限

积木内部统一 `useOptionalAbility()`（或 Root 显式 `ability` 时经 AbilityProvider 再下发）：

| 场景 / 积木 | 规范与行为 |
| ------ | ------ |
| **标准 `DataTable` / `DataTable.Workspace`** | **必须传入 `subject={XxxSubject}`**。内部工具栏 `onCreate`（新增）、`onExport`（导出）、`onRefresh`、列设置及分页自动继承该上下文；当用户缺少 `create` 权限时，表格右上方的新建按钮自动 Fail-Closed 隐藏。 |
| **页面自定义独立按钮 / 快捷操作入口** | **必须使用 `<AuthGuard subject={...} action={...}>` 包裹**。例如页面顶部的独立“新建物料”、“编排 BOM”等按钮，若脱离了 DataTable 容器，必须用 `<AuthGuard>` 包裹，确保普通成员在无相应 Action 权限时组件完全不渲染。 |
| `DataTable.ActionButton` | 无 ability/subject → 拒绝；`action` 未授权 → 隐藏/置灰 |
| `DataTable.Content` | `ColumnDef.field` 无 `read` → 整列剥离 |
| `AuthField` / `AuthorizedField` | HIDDEN 不渲染；READONLY → shadcn `Field` + `Badge「只读」` + 控件 disabled |
| `DataTableRowActions` | 行级 action 按 `ability.can` 过滤 |

### 4.1 核心实战范式 (DataTable vs AuthGuard)

#### (1) 使用标准模板 DataTable 时：显式注入 subject

```tsx
<DataTable
  data={items}
  columns={columns}
  rowKey={(i) => i.id}
  subject={ItemMasterSubject} // 👈 必须传：内部 ActionButton 自动按此 Subject 校验 create/export 等权限
  title="商品档案列表"
/>
```

#### (2) 脱离 DataTable 上下文的独立自定义按钮/表单：必须使用 AuthGuard

```tsx
import { AuthGuard } from "@base/ui";
import { ItemMasterSubject, StandardAction } from "../contract";

// 自定义页面顶部按钮或快捷录入表单
<AuthGuard subject={ItemMasterSubject} action={StandardAction.CREATE}>
  <Button onClick={() => setShowModal(true)}>
    <Plus className="mr-1 h-4 w-4" /> 新建商品
  </Button>
</AuthGuard>
```

> ⚠️ **严禁反模式**：
>
> 1. 严禁直接手写裸 `<Button onClick={...}>新建</Button>` 却不加 `<AuthGuard>` 包裹；
> 2. 严禁使用 `<DataTable>` 时遗漏 `subject` 属性，导致内部权限判断失效；
> 3. 严禁在页面侧手写 `can("create", ...) && <Button>`（用 `<AuthGuard>` 声明式包裹）。

---

## 5. 测试怎么写

用 `TenantAbilityProvider` 包一层，**不要**给 View 塞 `permissions` prop：

```tsx
import { TenantAbilityProvider } from "@base/authorization";
import { CustomerView } from "./CustomerView";

renderToString(
  <TenantAbilityProvider
    snapshots={{
      subject: "Customer",
      actions: ["read", "export"],
      fieldPolicies: {},
    }}
  >
    <CustomerView initialCustomers={[]} categories={[]} tags={[]} />
  </TenantAbilityProvider>,
);
```

---

## 6. 迁移旧切片检查清单

1. 新增 `<slice>/layout.tsx` + `*AbilityBoundary`
2. page 去掉 `getTenantSubjectPermissions`（挪到 layout）与 `permissions=` 传参
3. View 去掉 `ability`/`permissions` props 与本地 shim
4. View 改 `useAbility()`；Workspace 只传 `subject`
5. Server `assert*Ability` **保持不动**
6. 测试改为 Provider 包裹
7. `pnpm --filter <pkg> check && test` 全绿

**标杆**：`customer-center`、`procurement-center`（均已迁）。  
**字段策略编译**：`snapshotToRawRules` 用 CASL `inverted` 规则实现 HIDDEN/READONLY，未声明字段默认放行（与 plain 语义一致）。
