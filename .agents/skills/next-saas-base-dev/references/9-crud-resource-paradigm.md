# 模块 9：标准资源 CRUD 最佳范式 (Standard CRUD Resource Paradigm)

> **定位与工程认知**：
>
> 1. **通用经验与基准模板**：本 8 步范式是全仓沉淀的**通用最佳基准模板（覆盖大部分标准 CRUD 场景）**，为团队提供统一的心智模型、清晰的阶段流线与开箱即用的代码参考；
> 2. **包容差异与务实扩展**：不同页面的业务复杂度天然存在差异（如主子表明细、复杂多步骤表单、特殊状态机等）。**本范式仅供通用参考，绝非教条主义枷锁**。在坚守核心底线（安全隔离、契约单一度量源、声明式权限）的前提下，各业务切片完全支持根据实际复杂度进行针对性的流程扩展与架构变体；
> 3. **核心心智**：契约驱动（SSoT）、声明式权限托管、单向数据流、少即是多。

---

## 1. 分层与 API（锁定）

| 层               | 包                   | API                                                                 |
| :--------------- | :------------------- | :------------------------------------------------------------------ |
| 组件 / 列表 URL  | `@base/ui`           | `DataTable`、`FormModal`、`defineListSearchParams`、`useListSearch` |
| 业务中台通用资产 | `@biz/shared`        | `formatBusinessDocNo`、`approval`                                   |
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

- 统一分页清洗与防御：使用 `@base/shared` 的 `resolvePagination(filter, options)`，一行解构出 `{ page, pageSize, skip, take }`，严禁在各 Service 手写 `Math.max` / `Math.min` / `skip` 样板代码；
- 事务 + 稳定发号（`SEQUENCE` / `pg_advisory_xact_lock`，**禁止** `count(*)+1`）；
- 软删除、业务约束、审计字段 `createdById`/`updatedById`/`deptId`。

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

// 官方内置启停状态操作（若实体具备状态字段）：
export const toggleXxxStatusAction = defineServerAction(async (id: string) => {
  const { client, ability, userId } = await getTenantXxxContext();
  assertXxxAbility(ability, StandardAction.TOGGLE_STATUS, XxxSubject);
  const updated = await XxxService.toggleStatus(client, id, { userId });
  revalidatePath("/domain/xxx");
  return updated;
}, "切换状态失败");
```

直观清晰：`上下文 -> CASL 守卫 -> Zod 验参 -> 调 Service -> revalidatePath`，零多余黑盒。

### ⑥ ui/*FormModal.tsx

```tsx
import {
  FormModal,
  type FormModalMode,
  type FormModalSection,
  toast,
} from "@base/ui";
import { XxxSubject } from "../contract";
import { createXxxSchema, type CreateXxxSchema } from "../schema";
import { createXxxAction, updateXxxAction } from "../actions";

export interface XxxFormModalProps {
  readonly open: boolean;
  readonly mode: FormModalMode;
  readonly record?: XxxItem | null;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
  readonly inline?: boolean;
}

/**
 * 通用 CRUD 三态模态框（新增/编辑/只读详情）
 * - 单一度量源 (SSoT)：直接消费 schema.ts 中的 createXxxSchema，严禁在 UI 层重复手写 Zod schema！
 * - 纯净生命周期：通过动态 key 驱动组件销毁与重置，保证每次打开状态干净，无旧数据残留；
 * - 模式托管：mode="view" 时 FormModal 自动接管全字段只读置灰与按钮隐藏，无需在字段上分散手写 disabled/required。
 */
export function XxxFormModal({
  open,
  mode,
  record,
  onClose,
  onSuccess,
  inline,
}: XxxFormModalProps) {
  const isEdit = mode === "edit";

  const initialValues = useMemo<CreateXxxSchema>(
    () => ({
      name: record?.name || "",
      status: record?.status || "ACTIVE",
    }),
    [record],
  );

  const sections: FormModalSection[] = useMemo(
    () => [
      {
        title: "基础信息",
        columns: 2,
        fields: [
          {
            name: "name",
            label: "名称",
            type: "text",
            required: true,
            placeholder: "请输入名称",
          },
        ],
      },
    ],
    [],
  );

  return (
    <FormModal<CreateXxxSchema>
      key={`${mode}-${record?.id || "new"}-${open ? "open" : "closed"}`}
      open={open}
      inline={inline}
      mode={mode}
      subject={XxxSubject}
      title={
        mode === "create"
          ? "新建数据"
          : isEdit
            ? `编辑: ${record?.name}`
            : `详情: ${record?.name}`
      }
      schema={createXxxSchema}
      sections={sections}
      initialValues={initialValues}
      onClose={onClose}
      onSubmit={async (values) => {
        if (isEdit && record) {
          const res = await updateXxxAction(record.id, values);
          if (!res.success) throw new Error(res.error || "更新失败");
          toast.success("修改已保存");
        } else {
          const res = await createXxxAction(values);
          if (!res.success) throw new Error(res.error || "创建失败");
          toast.success("创建成功");
        }
        onSuccess?.();
      }}
    />
  );
}
```

- **单一度量源 (SSoT)**：直接消费 schema.ts 中的 createXxxSchema，严禁在 UI 层重复手写 Zod schema！
- **纯净生命周期**：通过动态 key 驱动组件销毁与重置，保证每次打开状态干净，无旧数据残留；
- **模式托管**：mode="view" 时 FormModal 自动接管全字段只读置灰与按钮隐藏，无需在字段上分散手写 disabled/required；
- **Ability 上下文自动感知（严禁测试属性入侵）**：`FormModal` 自动从上下文 `useUiAbility()` 感知权限并驱动字段三态闭环，**严禁**在业务组件 props 中声明 `ability?: ...` 作为测试后门。单测统一在测试层使用 `<UiAbilityProvider ability={...}>` 注入；
- **禁止**业务手写 Dialog+Input 树或直接 RHF。

### ⑦ ui/*View.tsx

```tsx
import { useState, useMemo, useCallback } from "react";
import {
  DataTable,
  DataTableRowActions,
  DataTableInputGroup,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  useListSearch,
  toast,
  type ColumnDef,
} from "@base/ui";
import { exportContractCsv, MasterDataStatus } from "@base/shared";
import { useAbility } from "@base/authorization";
import {
  xxxPageContract,
  xxxSearchParams,
  XxxField,
  XxxAction,
} from "../contract";
import { updateXxxStatusAction, deleteXxxAction } from "../actions";
import { XxxFormModal } from "./XxxFormModal";

export function XxxView({ data, total }: { data: XxxItem[]; total: number }) {
  const ability = useAbility();
  const list = useListSearch(xxxSearchParams);
  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "create" | "edit" | "view";
    record?: XxxItem | null;
  }>({ open: false, mode: "create", record: null });

  // 1. 健壮的异步操作封装（统一 try...catch 兜底）
  const runAction = useCallback(
    async (
      fn: () => Promise<{ success: boolean; error?: string }>,
      successText: string,
    ) => {
      try {
        const res = await fn();
        if (res.success) toast.success(successText);
        else toast.error(res.error || "操作失败");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "操作异常");
      }
    },
    [],
  );

  const handleToggleStatus = useCallback(
    (id: string, currentStatus: string) => {
      const nextStatus =
        currentStatus === MasterDataStatus.ACTIVE
          ? MasterDataStatus.DISABLED
          : MasterDataStatus.ACTIVE;
      void runAction(
        () => updateXxxStatusAction(id, nextStatus),
        nextStatus === MasterDataStatus.ACTIVE ? "已启用" : "已停用",
      );
    },
    [runAction],
  );

  const handleDelete = useCallback(
    (id: string) => {
      void runAction(() => deleteXxxAction(id), "删除成功");
    },
    [runAction],
  );

  // 2. 列定义记忆化与声明式权限托管
  const columns: ColumnDef<XxxItem>[] = useMemo(
    () => [
      { id: "name", field: XxxField.NAME, header: "名称" },
      {
        id: "actions",
        header: "操作",
        width: 120,
        align: "right",
        cell: (record) => (
          <DataTableRowActions
            record={record}
            onView={() => setModalState({ open: true, mode: "view", record })}
            onEdit={() => setModalState({ open: true, mode: "edit", record })}
            onDelete={() => handleDelete(record.id)}
            extraActions={[
              {
                label:
                  record.status === MasterDataStatus.ACTIVE ? "停用" : "启用",
                action: XxxAction.TOGGLE_STATUS,
                onClick: () => handleToggleStatus(record.id, record.status),
              },
            ]}
          />
        ),
      },
    ],
    [handleDelete, handleToggleStatus],
  );

  return (
    <>
      <DataTable<XxxItem>
        {...list.dataTableProps}
        data={data}
        columns={columns}
        total={total}
        subject={xxxPageContract.subject}
        title={xxxPageContract.label}
        onCreate={() => setModalState({ open: true, mode: "create" })}
        statusOptions={[
          { value: MasterDataStatus.ACTIVE, label: "正常" },
          { value: MasterDataStatus.DISABLED, label: "已停用" },
        ]}
        statusValue={String(list.params.status ?? "")}
        onStatusChange={(v) => list.patch({ status: v || "" })}
        filterExtra={/* 扩展业务维度筛选 */}
      />

      <XxxFormModal
        open={modalState.open}
        mode={modalState.mode}
        record={modalState.record}
        onClose={() =>
          setModalState({ open: false, mode: "create", record: null })
        }
        onSuccess={() =>
          setModalState({ open: false, mode: "create", record: null })
        }
      />
    </>
  );
}
```

- **权限 100% 声明式接管（严禁顶层手动计算 `ability.can`）**：
  - `DataTable` 根据 `subject` 自动判定并渲染顶部「新增」、「导出」按钮；
  - `DataTableRowActions` 自动根据当前用户 Ability 判定「查看/编辑/删除/扩展操作」的权限与显隐，外部无需手写多余三元判断或包装 div；
- **零向后兼容胶水代码（Pure Controlled Props）**：
  - View 组件严格只接收标准 `{ data, total, ...options }` 受控 props，严禁在组件内部维护 `initialXxx`、`legacyXxx`、`propData` 等向后兼容别名与兜底胶水代码；
- **状态筛选语义规范**：
  - `statusOptions` / `statusValue` / `onStatusChange` 专用于实体状态（启用/停用等）；
  - 业务维度筛选（如分类、类型等）一律放入 `filterExtra`，严禁借用 statusOptions 槽位；
- **行操作与详情闭环**：
  - 若需要详情，传入 `onView`，且 `FormModal` 必须支持 `mode: "view"`；若无需详情，必须显式配置 `hideView={true}`，严禁漏传；
- **分页器与多实体布局**：
  - 分页器严禁禁用（严禁 `showPagination={false}`）；多实体聚合页严禁左右并排挤压，必须在顶部使用横向 Tab 导航。

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

## 4. 复杂业务应对与扩展指南（逃生舱）

本流程作为通用模板，主要覆盖单实体的标准增删改查。当遇到复杂度更高的业务页面时，推荐按以下合规方式扩展，无需削足适履：

| 复杂场景                  | 推荐扩展范式                                                                                 | 规范底线                                                                 |
| :------------------------ | :------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| **超长字段 / 多阶段录入** | 扩展为多步骤向导（Wizard 弹窗/抽屉），或独立的完整编辑页面（如 `[id]/page.tsx`）             | 依然直接消费 `schema.ts`（支持分步 schema），禁止在前端散落非校验状态    |
| **主子表 / 行明细嵌套**   | 主表维持 `DataTable`，子表在 Modal/Drawer 内部使用内嵌表格或受控明细列表                     | 明细数据与主数据在单个事务内原子提交，保持纯数据输入                     |
| **复杂复合筛选**          | 充分利用 `DataTable` 的 `filterExtra` 插槽，搭配 `DataTableInputGroup`、日期范围、级联选择器 | URL 参数仍收敛于 `contract.ts` 的 `defineListSearchParams`，保持可分享性 |
| **批量操作 / 数据导入**   | 启用 `contentProps={{ selectable: true }}`，利用 `selectedRows` 触发批量 Action              | 批量写操作同样经 `defineServerAction` 并在后端做循环事务安全校验         |
| **轻量字典 / 配置项**     | 简化 `queries.ts`（无需 `accessibleWhere`），保留轻量 CRUD 闭环                              | UI 与 FormModal 保持与主实体一致的受控生命周期与模式接管                 |

---

## 5. 红线与底线

无论业务如何复杂定制，以下原则始终不可突破：

1. **禁止绕过权限**：写操作按钮必须受控于 CASL（优先由 `DataTable` 自动托管，自定义栏位用 `<AuthGuard>`）；
2. **禁止破坏序列化**：RSC 向客户端传递纯数据（`toPlainData` 防腐），严禁直接透传函数或未受控 Prisma 对象；
3. **禁止裸写原生 HTML 控件**：100% 使用 `@base/ui` 原子套件构建界面；
4. **禁止二次手写 Zod**：表单校验一律直接导入 `schema.ts` 唯一定义源。

---

## 5. 存量迁移（DEBT）

凡仍使用旧版 URL hook、手动计算权限或手绘表单的存量视图，按本标准最佳范式重构对齐；迁完删除 `@deprecated` API。
