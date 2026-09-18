# 模块 9：客户档案黄金标杆 CRUD 范式（已固化）

> **状态**：范式已定。新业务切片照抄本流程；差异走逃生舱，禁止另起平行壳/平行包。  
> **标杆代码**：`packages/domains/customer-center/src/features/customer-management/*`  
> **页面**：`apps/tenant/src/app/(dashboard)/customer/customers/page.tsx`  
> **目标规格**：`docs/architecture/refactoring-architecture-and-official-patterns.md`

---

## 1. 分层与 API（锁定）

| 层 | 包 | API |
| :--- | :--- | :--- |
| 组件 / 列表 URL | `@base/ui` | `DataTable`、`FormModal`、`defineListSearchParams`、`useListSearch` |
| 资源管道 | `@base/biz-shared` | `createResourceActions`、`createResourceList`、`createResourcePage` |
| Action 包装 | `@base/shared` | `defineServerAction` + `toPlainData` |
| 业务 | `packages/domains/*` | contract / schema / service / queries / actions / ui |

**不单开** `@base/crud`。`createCrudActions` 等仅为 `@deprecated` 别名。

---

## 2. 标准 8 步

### ① contract.ts

```ts
import { defineListSearchParams } from "@base/ui";
import { StandardAction, STANDARD_DATA_SCOPES } from "@base/authorization";

export const XxxSubject = "Xxx";
export const XxxField = { NAME: "name", STATUS: "status" } as const;

/** 列表 URL：默认 page/pageSize/keyword，业务只写扩展默认值 */
export const xxxSearchParams = defineListSearchParams({
  status: "",
  category: "",
});

export const xxxPageContract = {
  resource: "domain.xxx",
  subject: XxxSubject,
  label: "xxx",
  path: "/domain/xxx",
  actions: [/* READ/CREATE/UPDATE/DELETE/EXPORT + 自定义 */],
  configurableFields: [/* 供 exportContractCsv */],
} as const;
```

### ② schema.ts

```ts
import { z } from "@base/ui";
export const createXxxSchema = z.object({ /* ... */ });
export const updateXxxSchema = createXxxSchema.partial();
export const parseCreateXxxInput = (raw: unknown) => createXxxSchema.parse(raw);
```

### ③ service.ts

- 事务 + 稳定发号（`SEQUENCE` / `pg_advisory_xact_lock`，**禁止** `count(*)+1`）
- 软删除、业务约束、审计字段 `createdById`/`updatedById`/`deptId`

### ④ queries.ts（server-only）

```ts
import "server-only";
import { cache } from "react";
export const getXxxPageOptionsQuery = cache(async () => { /* 下拉选项 */ });
export async function listXxxQuery(parsed) {
  const { client, ability } = await getTenantXxxContext();
  // Ability → accessibleWhere → DTO 投影（无 Decimal/Date 直出）
}
```

### ⑤ actions.ts（"use server" 平铺导出）

```ts
"use server";
import { createResourceActions } from "@base/biz-shared";

const actions = createResourceActions({
  getContext: async () => {
    const ctx = await getTenantXxxContext();
    return { client: ctx.client, ability: ctx.ability, userId: ctx.userId, deptId: ctx.employeeProfile?.departmentId ?? null };
  },
  subject: XxxSubject,
  controlledFields: Object.values(XxxField),
  assertAbility: (ability, action, subject) => { assertXxxAbility(ability as never, action as never, subject as never); },
  revalidatePaths: ["/domain/xxx"],
  schemas: { create: parseCreateXxxInput, update: parseUpdateXxxInput },
  service: {
    create: (client, input, ctx) => XxxService.create(client as never, input as never, ctx),
    update: (client, id, input, ctx) => XxxService.update(client as never, id, input as never, ctx),
    remove: (client, id, ctx) => XxxService.remove(client as never, id, ctx),
    // toggleStatus 可选
  },
});

export const createXxxAction = actions.create!;
export const updateXxxAction = actions.update!;
export const deleteXxxAction = actions.remove!;
```

管道顺序（工厂内置）：`getContext → assertAbility → Zod parse → assertEditableFields → service → revalidatePath`。

### ⑥ ui/*FormModal.tsx

```tsx
import { FormModal, z } from "@base/ui";
<FormModal
  open={open}
  mode={mode}
  subject={XxxSubject}
  title="..."
  schema={createXxxSchema}
  sections={[{ title: "基础信息", columns: 2, fields: [{ name, label, type: "text", required: true }, /* select/number/custom */] }]}
  initialValues={...}
  onClose={...}
  onSubmit={async (values) => { /* create/update action */ }}
/>
```

**禁止**业务手写 Dialog+Input 树或直接 RHF。

### ⑦ ui/*View.tsx

```tsx
import { DataTable, useListSearch } from "@base/ui";

const list = useListSearch(xxxSearchParams);

<DataTable
  {...list.dataTableProps}
  data={data}
  columns={columns}
  total={total}
  subject={xxxPageContract.subject}
  title="..."
  onExport={...}
  onCreate={() => setModal({ open: true, mode: "create" })}
  statusOptions={[...]}
  statusValue={String(list.params.status ?? "")}
  onStatusChange={(v) => list.patch({ status: v || "" })}
  filterExtra={/* 扩展筛选，并排展示 */}
/>
```

- 默认 chrome：搜索/新增/刷新/导出/列设置/分页 —— **不要手绘**
- 扩展 = `filterExtra` / `statusOptions` / `toolbarExtra`，**不是**把默认能力折进抽屉
- 数据来自 RSC props；**禁止** `useState(props.data)` 镜像

### ⑧ apps page.tsx

```tsx
import { createResourcePage } from "@base/biz-shared";

export default createResourcePage({
  search: xxxSearchParams,
  subject: XxxSubject,
  pageContract: xxxPageContract,
  title: "...",
  rowKey: (row) => row.id,
  columns: [],
  List: ({ data, total, options }) => <XxxView data={data} total={total} options={options} />,
  query: {
    list: async (parsed) => {
      const r = await listXxxQuery(parsed);
      return { items: r.items, total: r.total };
    },
    options: async () => getXxxPageOptionsQuery(),
  },
});
```

标准列表可不传 `List`，由 `createResourceList` 生成（需配 `columns` + `actions` + 可选 `form`）。

---

## 3. Element UI 心智映射

| Element UI | 本仓 |
| :--- | :--- |
| `el-table` + 默认分页/工具 | `DataTable` 默认 chrome |
| `el-form` rules | `FormModal` + Zod `schema` |
| URL 查询状态 | `defineListSearchParams` + `useListSearch` |
| 资源 CRUD 管道 | `createResourceActions` / `createResourcePage` |

---

## 4. 定制与红线

**逃生舱**：自定义 List、`onBeforeCreate`、自定义 columns/Form、`filterExtra`。

**红线**：见 SKILL.md；尤其禁止过时 URL hook、业务手写表单壳、Promise props、`count()+1`、`use server` 导出嵌套对象。

---

## 5. 存量迁移（DEBT）

`StoreView` / `QuoteView` / `RoleListView` 等仍用旧 hook 的，按本模块迁移；迁完删除 `@deprecated` API。
