# 模块 9：客户档案黄金标杆 CRUD 范式（已固化）

> **状态**：范式已定。新业务切片照抄本流程；差异走逃生舱，禁止另起平行壳/平行包。  
> **标杆代码**：`packages/domains/customer-center/src/features/customer-management/*`  
> **页面**：`apps/tenant/src/app/(dashboard)/customer/customers/page.tsx`  
> **目标规格**：`docs/architecture/refactoring-architecture-and-official-patterns.md`

---

## 1. 分层与 API（锁定）

| 层               | 包                   | API                                                                 |
| :--------------- | :------------------- | :------------------------------------------------------------------ |
| 组件 / 列表 URL  | `@base/ui`           | `DataTable`、`FormModal`、`defineListSearchParams`、`useListSearch` |
| 业务中台通用资产 | `@base/biz-shared`   | `formatBusinessDocNo`、`approval`                                   |
| Action 包装      | `@base/shared`       | `defineServerAction` + `toPlainData`                                |
| 业务             | `packages/domains/*` | contract / schema / service / queries / actions / ui                |

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
export const createXxxSchema = z.object({/* ... */});
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
export const getXxxPageOptionsQuery = cache(async () => {
  /* 下拉选项 */
});
export async function listXxxQuery(parsed) {
  const { client, ability } = await getTenantXxxContext();
  // Ability → accessibleWhere → DTO 投影（无 Decimal/Date 直出）
}
```

### ⑤ actions.ts（"use server" 平铺导出，推荐 defineServerAction 保持直观）

```ts
"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import { StandardAction } from "@base/authorization";
import { assertXxxAbility, getTenantXxxContext } from "../../assembly/context";
import { XxxService } from "./service";
import { XxxSubject } from "./contract";
import { parseCreateXxxInput, parseUpdateXxxInput } from "./schema";

export const createXxxAction = defineServerAction(async (raw: unknown) => {
  const { client, ability, userId, employeeProfile } =
    await getTenantXxxContext();
  assertXxxAbility(ability, StandardAction.CREATE, XxxSubject);
  const input = parseCreateXxxInput(raw);
  const created = await XxxService.create(client, input, {
    userId,
    deptId: employeeProfile?.departmentId ?? null,
  });
  revalidatePath("/domain/xxx");
  return created;
}, "创建失败");

export const updateXxxAction = defineServerAction(
  async (id: string, raw: unknown) => {
    const { client, ability, userId } = await getTenantXxxContext();
    assertXxxAbility(ability, StandardAction.UPDATE, XxxSubject);
    const input = parseUpdateXxxInput(raw);
    const updated = await XxxService.update(client, id, input, { userId });
    revalidatePath("/domain/xxx");
    return updated;
  },
  "修改失败",
);

export const deleteXxxAction = defineServerAction(async (id: string) => {
  const { client, ability, userId } = await getTenantXxxContext();
  assertXxxAbility(ability, StandardAction.DELETE, XxxSubject);
  const deleted = await XxxService.remove(client, id, { userId });
  revalidatePath("/domain/xxx");
  return deleted;
}, "删除失败");
```

直观清晰：`上下文 -> CASL 守卫 -> Zod 验参 -> 调 Service -> revalidatePath`，零多余黑盒。

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

- **按钮全量由模板接管（严禁手写）**：
  - 展开 `{...list.dataTableProps}`，`DataTable` 自动渲染内置「查询」与「重置」按钮，并支持回车即搜；
  - 顶部工具栏自动渲染「刷新」、「导出」、「新增」按钮，严禁业务视图内自行手写查询/重置/刷新按钮；
- **行操作（DataTableRowActions）与详情闭环**：
  - `DataTableRowActions` 默认 `hideView = false`；
  - **若需要详情**：传入 `onView={() => setModal({ open: true, mode: "view", record })}`，且 `FormModal` 必须支持 `mode: "view"`（全字段只读展示）；
  - **若无需详情**：必须显式传入 `hideView={true}`，**严禁漏传 `onView` 导致操作列出现置灰不可点击的「详情」按钮**；
- **分页器绝不可缺失**：
  - 所有标准列表与字典均需配备分页（`DataTablePagination`），由 `total`、`page`、`pageSize`、`onPageChange` 驱动；
  - **严禁配置 `showPagination={false}`** 导致页面失去分页能力；
- **多实体聚合页布局规范**：
  - 聚合页（如分类+标签同页）**严禁左右并排挤压展示**（会导致表格变形与换行错乱）；
  - 必须在顶部使用**横向平铺的 Tab 导航**，切换后每个实体独占 100% 全宽 DataTable 视图。

### ⑧ apps page.tsx

**正统 Next.js App Router 范式**：直接编写标准异步 Server Component，杜绝黑盒过度封装。

```tsx
interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function XxxPage({ searchParams }: PageProps) {
  const parsed = await xxxSearchParams.parse(searchParams);

  const [pageResult, options] = await Promise.all([
    listXxxQuery({
      page: parsed.page,
      pageSize: parsed.pageSize,
      keyword: String(parsed.keyword ?? "") || undefined,
      status: String(parsed.status ?? "") || undefined,
    }),
    getXxxPageOptionsQuery(),
  ]);

  return (
    <XxxView
      data={pageResult.items}
      total={pageResult.total}
      options={options}
    />
  );
}
```

- 一行 `xxxSearchParams.parse(searchParams)` 搞定服务端 URL 参数校验与默认值；
- `Promise.all` 并发拉取列表与选项纯数据；
- 直接渲染自定义 `XxxView`，**零黑盒工厂包裹，无需填任何无用空属性**。

---

## 3. Element UI 心智映射

| Element UI                 | 本仓                                         |
| :------------------------- | :------------------------------------------- |
| `el-table` + 默认分页/工具 | `DataTable` 默认 chrome                      |
| `el-form` rules            | `FormModal` + Zod `schema`                   |
| URL 查询状态               | `defineListSearchParams` + `useListSearch`   |
| 资源 CRUD 管道             | 正统 Next.js RSC 装配 + `defineServerAction` |

---

## 4. 定制与红线

**逃生舱**：自定义 List、`onBeforeCreate`、自定义 columns/Form、`filterExtra`。

**红线**：见 SKILL.md；尤其禁止过时 URL hook、业务手写表单壳、Promise props、`count()+1`、`use server` 导出嵌套对象。

---

## 5. 存量迁移（DEBT）

`StoreView` / `QuoteView` / `RoleListView` 等仍用旧 hook 的，按本模块迁移；迁完删除 `@deprecated` API。
