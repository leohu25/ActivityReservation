# 模块 7：官方 CASL 客户端范式（教科书形态）

> **设计原则**：切片 Layout 负责声明式一次性注入权限快照，View 视图只负责渲染业务数据并通过 `useAbility()` 消费权限。禁止再引入「View 自建 plain ability + 传 `permissions` props」双轨模式。

## 0. 为什么是这个形态

| 约束                    | 结论                                                   |
| ----------------------- | ------------------------------------------------------ |
| RSC 不能传 Ability 实例 | 只传可序列化快照 `{ subject, actions, fieldPolicies }` |
| 官方 `@casl/react`      | 客户端用同一套规则 `createMongoAbility` 重建实例       |
| Next App Router         | Client 边界挂 `AbilityProvider` 完全合法               |

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

| 角色   | API                                                     | 位置                                           |
| ------ | ------------------------------------------------------- | ---------------------------------------------- |
| 拉权限 | `getTenantSubjectPermissions(subject)`                  | `apps/tenant/src/kernel`                       |
| 编快照 | `buildSliceAbilitySnapshots` / 自建 `AbilitySnapshot[]` | Business Area `shared/ui/*AbilityBoundary.tsx` |
| 注入   | `TenantAbilityProvider snapshots={...}`                 | 切片 layout 或 Boundary                        |
| 消费   | `useAbility()` / `Can` / DataTable 积木                 | Client View                                    |
| 写路径 | `assert*Ability(ability, action, subject)`              | Feature `actions.ts`                           |

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
// packages/domains/<business-area>/src/shared/ui/<Area>AbilityBoundary.tsx
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
      subject: "ResourceA",
      actions: permissions.resourceA.actions,
      fieldPolicies: permissions.resourceA.fieldPolicies,
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
import { SliceAbilityBoundary } from "@domain/<area>/shared";
import { ResourceASubject } from "@domain/<area>/<feature-a>";
import { ResourceBSubject } from "@domain/<area>/<feature-b>";
import { getTenantSubjectPermissions } from "@/kernel";

export default async function SliceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [resourceA, resourceB] = await Promise.all([
    getTenantSubjectPermissions(ResourceASubject),
    getTenantSubjectPermissions(ResourceBSubject),
  ]);

  return (
    <SliceAbilityBoundary permissions={{ resourceA, resourceB }}>
      {children}
    </SliceAbilityBoundary>
  );
}
```

### 2.3 page 只取业务数据

```tsx
// page.tsx — 禁止再 getTenantSubjectPermissions、禁止传 permissions/ability
const pageData = await listXxxQuery({ page, pageSize });
return <XxxView data={pageData.items} total={pageData.total} />;
```

### 2.4 View 只声明 subject + useAbility

```tsx
"use client";
import { useAbility } from "@base/authorization";
import { DataTable, DataTree } from "@base/ui";

export function XxxView({ data, total }: Props) {
  const ability = useAbility(); // 仅导出等需要命令式 can() 时使用

  const list = useListSearch(xxxSearchParams); // 见 references/9

  return (
    <DataTable
      {...list.dataTableProps}
      data={data}
      columns={columns}
      total={total}
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

| fieldPolicies | read                         | create/update              |
| ------------- | ---------------------------- | -------------------------- |
| 无策略        | `{ action, subject }` 全字段 | 同左                       |
| `HIDDEN`      | **不进入** `fields`          | 不可写                     |
| `READONLY`    | 进入 `fields`                | **不进入** writable fields |
| `EDITABLE`    | 进入 `fields`                | 进入 `fields`              |

Fail-Closed：`actions: []` → 一切拒绝；无 Provider 时 `useOptionalAbility()` 为 `null` → 积木拒绝渲染。

---

## 4. 常见避坑：新增子路由导致页面列与按钮“全部消失” (Fail-Closed 陷阱)

- **现象**：新页面已开发完毕，在浏览器打开时，**表格所有业务数据列消失、右上角显示「列设置 1/1」、新增按钮不见**。
- **根因**：`DataTable` 判定列是否可见依赖 `ability.can("read", subject, col.field)`，新增按钮依赖 `ability.can("create", subject)`。若父级 `layout.tsx` 漏掉了当前新 `Subject` 的加载，客户端 Context 中该实体的 Ability 规则为空，根据 Fail-Closed 机制全部返回 `false`，从而导致除操作列外的所有业务列和写按钮被物理剥离。
- **解法**：每当新增任何子路由页面时，**必须第一时间在所属路由组的 `layout.tsx` 中补齐 `getTenantSubjectPermissions(NewSubject)`** 并注入到 AbilityBoundary 中。

---

## 4. 模板与受控分子组件如何吃权限

组件内部统一通过 `useUiAbility()` 判定权限（面向纯接口解耦）：

| 场景 / 组件                                 | 分层定位 | 规范与行为                                                                                                                                                                                                                                                                                    |
| ------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **标准 `DataTable`**                        | 模板层   | **必须传入 `subject={XxxSubject}`**。内部工具栏 `onCreate`（新增）、`onExport`（导出）、`onRefresh`、列设置及分页自动继承该上下文；当用户缺少 `create` 权限时，表格右上方的新建按钮自动 Fail-Closed 隐藏。受控列若为 `HIDDEN` 整列从 DOM 物理剔除。                                           |
| **标准 `DataTree`**                         | 模板层   | **必须传入 `subject={XxxSubject}`**。面向层级树形维护（如分类、组织树）。顶部新建根节点、节点操作栏（`nodeActions`）自动通过 Action Schema 执行权限过滤，内置同级排序上下移受控开关与防误删。                                                                                                 |
| **标准 `FormModal`**                        | 模板层   | **必须传入 `subject={XxxSubject}`**。内部自动感应 CASL 字段三态闭环：`HIDDEN` 字段从 DOM 与 Schema 校验中彻底剥离（**不显示则自动豁免必填**，绝不阻塞提交）；`READONLY` 字段在新增/编辑时自动标记 `disabled` 并展示只读提示；空 Section 自动折叠移除。支持 `FormFieldSchema.field` 别名映射。 |
| **受控分子 `ActionButton` / `ActionGroup`** | 分子层   | **必须声明 `action={...}` 与 `subject={...}`**。自由定制页面中涉及写操作的按钮一律使用分子组件，自动根据权限决定显隐或置灰提示，内置 `confirm` 二次防误删确认。                                                                                                                               |
| **声明式门禁 `<AuthGuard>`**                | 分子层   | 声明式包裹自定义区域。例如页面顶部的独立快捷入口，确保普通成员在无相应 Action 权限时组件完全不渲染。                                                                                                                                                                                          |
| `DataTableRowActions`                       | 分子层   | 行级 action 按 `ability.can` 自动过滤并平铺/折叠呈现。                                                                                                                                                                                                                                        |
| `AuthorizedField` / `AuthField`             | 分子层   | 详情与表单中展示受控字段：HIDDEN 不渲染；READONLY 呈现只读徽章与锁定控件。                                                                                                                                                                                                                    |

### 4.1 核心实战范式 (DataTable / DataTree / FormModal vs ActionButton / AuthGuard)

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

#### (2) 使用标准树形模板 DataTree 时：显式注入 subject 与 Action Schema

```tsx
<DataTree<CategoryTreeItem>
  data={treeData}
  subject={CategorySubject} // 👈 必须传：内部 ActionButton 自动按此 Subject 校验 create/update/delete
  title="多级分类树"
  onCreateRoot={handleCreateRoot}
  nodeActions={[
    {
      key: "add-child",
      action: "create",
      label: "下级",
      onClick: handleAddChild,
    },
    { key: "edit", action: "update", label: "编辑", onClick: handleEdit },
    {
      key: "delete",
      action: "delete",
      label: "删除",
      confirm: { title: "确认删除分类？" },
      onClick: handleDelete,
    },
  ]}
  enableOrdering={true}
/>
```

#### (3) 使用标准表单模态框 FormModal 时：显式注入 subject，零私有权限胶水代码

```tsx
<FormModal<ResourceFormData>
  open={open}
  mode={mode}
  subject={ResourceSubject} // 👈 必须传：内部自动执行字段三态过滤、动态豁免不可见字段必填并禁用只读项
  schema={resourceFormZodSchema}
  sections={sections}
  initialValues={initialValues}
  onClose={onClose}
  onSubmit={handleSubmit}
/>
```

#### (4) 脱离模板上下文的独立自定义按钮/页面：必须使用分子组件 ActionButton 或 AuthGuard

```tsx
import { ActionButton, AuthGuard } from "@base/ui";
import { ItemMasterSubject, StandardAction } from "../contract";

// 自定义页面顶部按钮：直接使用受控分子组件
<ActionButton
  subject={ItemMasterSubject}
  action={StandardAction.CREATE}
  onClick={() => setShowModal(true)}
>
  <Plus className="mr-1 h-4 w-4" /> 新增记录
</ActionButton>

// 或使用 AuthGuard 声明式包裹：
<AuthGuard subject={ItemMasterSubject} action={StandardAction.CREATE}>
  <CustomCard onClick={...} />
</AuthGuard>
```

#### (4) 写路径物理安全闭环 (Server Action)

前端 UI 隐藏绝不等于物理安全。所有 `createXxxAction` 与 `updateXxxAction` 必须在执行事务前加锁：

```tsx
// 1. 动作级校验
assertSliceAbility(ability, StandardAction.UPDATE, ResourceSubject);
// 2. 字段级防篡改校验 (拦截恶意通过网络请求篡改只读/隐藏字段)
assertEditableFields(
  ability as unknown as AnyMongoAbility,
  ResourceSubject,
  extractControlledPayload(input),
);
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
import { ResourceView } from "./ResourceView";

renderToString(
  <TenantAbilityProvider
    snapshots={{
      subject: "Resource",
      actions: ["read", "export"],
      fieldPolicies: {},
    }}
  >
    <ResourceView data={[]} total={0} options={[]} />
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

**字段策略编译**：`snapshotToRawRules` 用 CASL `inverted` 规则实现 HIDDEN/READONLY，未声明字段默认放行（与 plain 语义一致）。
