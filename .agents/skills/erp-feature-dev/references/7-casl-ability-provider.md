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

导出（均可从 `@chenrun/authorization` 或 `@chenrun/ui`）：

```ts
import {
  TenantAbilityProvider,
  createAbilityFromSnapshot,
  Can,
  useAbility,
  useOptionalAbility,
  type AbilitySnapshot,
} from "@chenrun/authorization";
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
} from "@chenrun/authorization";

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
import { SliceAbilityBoundary } from "@chenrun/feature-<area>/shared";
import { CustomerSubject } from "@chenrun/feature-<area>/customer-management";
import { CustomerStoreSubject } from "@chenrun/feature-<area>/store-management";
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
import { useAbility } from "@chenrun/authorization";
import { DataTable } from "@chenrun/ui";

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

## 4. DataTable 积木如何吃权限

积木内部统一 `useOptionalAbility()`（或 Root 显式 `ability` 时经 AbilityProvider 再下发）：

| 积木 | 行为 |
| ------ | ------ |
| `DataTable.ActionButton` | 无 ability/subject → 拒绝；`action` 未授权 → 隐藏/置灰 |
| `DataTable.Content` | `ColumnDef.field` 无 `read` → 整列剥离 |
| `AuthField` / `AuthorizedField` | HIDDEN 不渲染；READONLY → shadcn `Field` + `Badge「只读」` + 控件 disabled |
| `DataTableRowActions` | 行级 action 按 `ability.can` 过滤 |

`AuthField` 外壳已对齐官方 `Field`/`FieldLabel`（`pnpm ui:add field`），禁止再手写 label/div 私有样式。

页面侧：**声明按钮 + 契约 action**，不要手写 `can() && <Button>`。

---

## 5. 测试怎么写

用 `TenantAbilityProvider` 包一层，**不要**给 View 塞 `permissions` prop：

```tsx
import { TenantAbilityProvider } from "@chenrun/authorization";
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
