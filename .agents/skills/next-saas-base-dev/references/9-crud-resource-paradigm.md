# 模块 9：标准资源 CRUD 最佳范式 (Standard CRUD Resource Paradigm)

> **定位与工程认知**：
>
> 1. **通用经验与基准模板**：本 10 步范式是全仓沉淀的**通用最佳基准模板（覆盖大部分标准 CRUD 场景）**，为团队提供统一的心智模型、清晰的阶段流线与开箱即用的代码参考；
> 2. **包容差异与务实扩展**：不同页面的业务复杂度天然存在差异（如主子表明细、复杂多步骤表单、特殊状态机等）。**本范式仅供通用参考，绝非教条主义枷锁**。在坚守核心底线（安全隔离、契约单一度量源、声明式权限）的前提下，各业务切片完全支持根据实际复杂度进行针对性的流程扩展与架构变体；
> 3. **核心心智**：契约驱动（SSoT）、声明式权限托管、单向数据流、少即是多；
> 4. **开发者权限使用极简心智口诀（两句话标准，底层零心智负担）**：
>    - **写操作 (Action)**：首行无脑调用 `assertDomainAbility(ability, Action, Subject)`，无权自动 Fail-Closed 阻断抛出 403，严禁手写 `if (!can)`；
>    - **读操作 (Query)**：首行提取 `accessibleWhere = getAccessibleWhere(ability, Subject, "read")` 直接塞入 Prisma `where.AND` 下推数据库，返回前调用 `pickReadableFields` 自动剔除敏感脱敏列。严禁查完全表到内存做二次过滤。

---

## 1. 分层与 API（锁定）

| 层               | 包                   | API                                                                 |
| :--------------- | :------------------- | :------------------------------------------------------------------ |
| 组件 / 列表 URL  | `@base/ui`           | `DataTable`、`FormModal`、`defineListSearchParams`、`useListSearch` |
| 业务中台通用资产 | `@biz/shared`        | `formatBusinessDocNo`、`approval`                                   |
| Action 包装      | `@base/shared`       | `defineServerAction` + `toPlainData`                                |
| 业务装配与工厂   | `@base/authorization/server` | `createTenantSliceContext` 高阶切片装配工厂                         |
| 业务             | `packages/domains/*` | contract / schema / service / queries / actions / ui                |

**不单开** `@base/crud`。`createCrudActions` 等仅为 `@deprecated` 别名。

---

## 2. 标准 10 步 SOP 流水线

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

### ③ assembly/context.ts（切片装配层，一行调用基座工厂）

依托基座高阶工厂 `createTenantSliceContext(catalog)` 自动打通租户 DB 连接池、员工门禁、部门拓扑与 CASL 权限引擎（内置 `React.cache()` 请求级记忆化），**严禁在切片手写重复样板**：

```ts
import {
  createTenantSliceContext,
  type TenantSliceContext,
} from "@base/authorization/server";
import { domainCatalog } from "../catalog";
import type {
  DomainActionType,
  DomainSubjectType,
} from "../shared/contract-types";

export type TenantDomainContext = TenantSliceContext<
  DomainActionType,
  DomainSubjectType
>;

export const {
  getContext: getTenantDomainContext,
  assertAbility: assertDomainAbility,
} = createTenantSliceContext<DomainActionType, DomainSubjectType>(domainCatalog);
```

### ④ service.ts

- 统一分页清洗与防御：使用 `@base/shared` 的 `resolvePagination(filter, options)`，一行解构出 `{ page, pageSize, skip, take }`，严禁在各 Service 手写 `Math.max` / `Math.min` / `skip` 样板代码；
- **必须支持接收 CASL 授权下推条件 (`accessibleWhere`)**：
  ```ts
  static async listPaged(
    client: TenantPrismaClient,
    filter: ListXxxFilter = {},
    accessibleWhere: TenantPrisma.XxxWhereInput = {},
  ): Promise<ListXxxResult> {
    const { skip, take, page, pageSize } = resolvePagination(filter);
    
    // 合并业务过滤与行级数据权限 SQL 下推条件
    const where: TenantPrisma.XxxWhereInput = {
      AND: [
        accessibleWhere,
        { isDeleted: false },
        filter.keyword ? { name: { contains: filter.keyword, mode: "insensitive" } } : {},
      ],
    };

    const [items, total] = await Promise.all([
      client.xxx.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
      client.xxx.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }
  ```
- 事务 + 稳定发号（`SEQUENCE` / `pg_advisory_xact_lock`，**禁止** `count(*)+1`）；
- 软删除、业务约束、审计字段 `createdById`/`updatedById`/`deptId`。

### ⑤ queries.ts（server-only，CASL + Prisma 行级数据权限下发完整范式）

```ts
import "server-only";
import { cache } from "react";
import { getAccessibleWhere, pickReadableFields, StandardAction } from "@base/authorization";
import { toPlainData } from "@base/shared";
import { assertXxxAbility, getTenantXxxContext } from "../../assembly/context";
import { XxxSubject } from "./contract";
import { XxxService } from "./service";
import type { ListXxxFilter, ListXxxResult } from "./types";

export const getXxxPageOptionsQuery = cache(async () => {
  /* 下拉选项 */
});

/**
 * 列表查询标准范式：
 * 1. 门禁断言：assertXxxAbility 阻断未授权操作；
 * 2. 行级下推：getAccessibleWhere(ability, Subject, "read") 直接下发 SQL 到 Prisma where.AND；
 * 3. 列级脱敏：pickReadableFields 剔除无权查阅的敏感字段。
 */
export async function listXxxQuery(filter: ListXxxFilter = {}): Promise<ListXxxResult> {
  const { client, ability } = await getTenantXxxContext();
  assertXxxAbility(ability, StandardAction.READ, XxxSubject);

  // 核心：通过 getAccessibleWhere 生成当前用户角色对应的数据范围条件 (SELF/DEPT/DEPT_TREE/ALL)
  const accessibleWhere = getAccessibleWhere(ability, XxxSubject, StandardAction.READ);

  const result = await XxxService.listPaged(client, filter, accessibleWhere);

  // 对结果进行列级权限过滤
  const items = result.items.map((item) => {
    const readable = pickReadableFields(ability, XxxSubject, item as Record<string, unknown>);
    return { id: item.id, ...readable };
  });

  return toPlainData({ ...result, items });
}
```

### ⑥ actions.ts（"use server" 平铺导出，操作权限纯粹由角色二元控制，直观清晰拒绝黑盒）

```ts
"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import { StandardAction } from "@base/authorization";
import { assertXxxAbility, getTenantXxxContext } from "../../assembly/context";
import { XxxService } from "./service";
import { XxxSubject } from "./contract";
import { parseCreateXxxInput, parseUpdateXxxInput } from "./schema";

/**
 * 操作鉴权规范（所见即所得，与权限界面 100% 对应）：
 * 1. 写操作权限纯粹由“角色”二元控制：assertXxxAbility(ability, Action, Subject)；
 * 2. 角色勾选了该操作即允许执行，未勾选则拦截；不叠加隐式行数据判断，杜绝逻辑黑盒；
 * 3. 行数据权限（数据范围）已在 listXxxQuery 列表查询阶段由 SQL 严格物理过滤完成。
 */
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

### ⑦ ui/*FormModal.tsx

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

#### ⑦-B. 复杂全屏单据/档案页面 (FormPage) 顶栏规范：强制使用 DocumentHeader

当采用独立路由打开新页面（如 `new/page.tsx`, `[id]/page.tsx`）构建全屏表单工作台时：
- **必须 100% 统一使用 `@base/ui` 的通用单据顶栏组件 `<DocumentHeader />`，严禁业务切片自行手绘返回按钮、标题或操作栏**；
- **操作按钮一律通过 `slotActions` 插槽注入**：取消、保存草稿、保存/发布、编辑等自定义按钮全部在 `slotActions` 内聚合，且写操作按钮必须使用 `<AuthGuard action={...} subject={...}>` 声明式守卫；
- 紧随标题使用 `badges` 插槽回显状态徽章（如“正常启用/已停用”、“草稿/已发布”）；
- 中间预留 `slotMiddle` 插槽可注入类型切换分段控制器（Tabs）；
- 详见 `references/5-ui-components.md` 第 2.5 节标准范式。

### ⑧ ui/*View.tsx

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

- **权限 100% 声明式接管（操作列强制使用 DataTableRowActions，严禁顶层手动计算 `ability.can`）**：
  - `DataTable` 根据 `subject` 自动判定并渲染顶部「新增」、「导出」按钮；
  - **操作列 (id: "actions") 必须 100% 统一使用 `<DataTableRowActions />` 渲染！** 严禁手写裸 `<button>`/`<div>` 导致权限与确认逻辑裸奔。`DataTableRowActions` 内部自动根据当前用户 Ability 判定「查看/编辑/删除/扩展操作」的权限与显隐，外部无需手写多余三元判断或包装 div，门禁脚本强制拦截任何裸奔操作列；
- **零向后兼容胶水代码（Pure Controlled Props）**：
  - View 组件严格只接收标准 `{ data, total, ...options }` 受控 props，严禁在组件内部维护 `initialXxx`、`legacyXxx`、`propData` 等向后兼容别名与兜底胶水代码；
- **状态筛选语义规范**：
  - `statusOptions` / `statusValue` / `onStatusChange` 专用于实体状态（启用/停用等）；
  - 业务维度筛选（如分类、类型等）一律放入 `filterExtra`，严禁借用 statusOptions 槽位；
- **行操作与详情闭环**：
  - 若需要详情，传入 `onView`，且 `FormModal` 必须支持 `mode: "view"`；若无需详情，必须显式配置 `hideView={true}`，严禁漏传；
- **分页器与多实体布局**：
  - 分页器严禁禁用（严禁 `showPagination={false}`）；多实体聚合页严禁左右并排挤压，必须在顶部使用横向 Tab 导航。

### ⑨ layout.tsx（切片专属 CASL Ability 边界注入 — 绝对必选关键步）

> **⚠️ 核心架构宪法与高频避坑（严禁借道寄生）**：
> 1. **业务切片必须挂载在应用层专属的路由组下**（如 `(dashboard)/archives/`），严禁借道塞入不相关的模块（如 `settings`）；
> 2. **该专属路由组的 `layout.tsx` 必须且仅能消费本切片专属导出的 `*AbilityBoundary`**（如 `BaseArchivesAbilityBoundary`），严禁跨切片借道其他模块的 Boundary；
> 3. **必须显式补齐对应实体的 `getTenantSubjectPermissions(Subject)`**！若遗漏，在 Fail-Closed 机制下客户端将拿不到该实体的权限快照，导致页面中 `DataTable` 的所有业务数据列被自动隐藏脱敏（右上角仅显示「列设置 1/1」），新增/编辑/停用/删除按钮完全不显示！

```tsx
// apps/tenant/src/app/(dashboard)/<area>/layout.tsx
import { AreaAbilityBoundary } from "@domain/<area>/shared";
import { ResourceASubject } from "@domain/<area>/resource-a";
import { ResourceBSubject } from "@domain/<area>/resource-b";
import { getTenantSubjectPermissions } from "@/kernel";

export default async function AreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 一次性并发获取当前路由组下所有需要的 Subject 权限纯数据快照
  const [resourceAPerms, resourceBPerms] = await Promise.all([
    getTenantSubjectPermissions(ResourceASubject),
    getTenantSubjectPermissions(ResourceBSubject),
  ]);

  return (
    <AreaAbilityBoundary
      permissions={{
        resourceA: resourceAPerms,
        resourceB: resourceBPerms,
      }}
    >
      {children}
    </AreaAbilityBoundary>
  );
}
```

### ⑩ apps page.tsx

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

- **表单与单据双轨策略 (Dual-Track Form & Document Strategy)**：
  - **标准模式 (80% 通用主数据与主子表)**：采用**配置化驱动 (Schema-Driven)**。轻量弹窗使用 `<FormModal>`，独立全屏路由使用 `<FormPage>`，直接声明 `sections: FormPageSection[]` 与 `schema`，由框架自动接管 `<AuthField>` 字段权限三态、`<AuthGuard>` 按钮权限与 `<DetailTable>` 明细表；
  - **自由模式 (20% 复杂联动/个性化单据)**：采用**积木拼装 (Blocks Assembly)**。如制造 BOM、复杂工单工作台等。**积木拼装严禁裸写外壳**，必须跑在通用外壳 **`<DocumentShell>`** 之中，由外壳统一接管顶栏吸顶、单据三态广播 (`create/edit/view`)、CASL 权限分发、只读穿透与未保存离开守卫，内部业务各积木自由自治拼装。

---

## 4. 资源 CRUD 复杂度三级递进演进模型 (Progressive Slice Architecture)

> **核心心智**：这三个层级**绝不是互斥的“分支选择”，而是随着业务复杂度与实体关系纵深发展的“三级递进包容关系”**。  
> **终极形态是 Level 3**：Level 3 完整包容并复用了 Level 1 与 Level 2 的能力，在内部通过 Level 2 拆解积木组件、在需要时复用 Level 1 的标准弹窗，同时实现了跨实体的领域边界彻底隔离。

```text
Level 1 (基础：标准简易资源层) ──▶ Level 2 (进阶：组件积木化与状态解耦层) ──▶ Level 3 (终极：子切片领域自治层)
   [单表/轻量增删改]                    [复杂单切片UI与流程拆解]                     [主子实体/复合聚合根]
  (FormModal / FormPage 模板)         (<DocumentShell> 外壳 + 积木拼装)               (内部全量复用 L1 与 L2)
```

---

### Level 1：标准简易资源层 (Base Standard Resource — 单表与轻量辅助主数据)
- **适用场景**：字段明确单一、业务流程扁平、无复杂子表与附属实体的标准主数据或辅助配置（如计量单位、基础字典、单表分类等 ≤ 5 字段）；
- **核心形态**：**直接使用开箱即用的标准化大组件**（`DataTable` 默认 chrome 列表 + `FormModal` 声明式轻量弹窗）；
- **权限闭环心智**：
  - **列表端 (`DataTable`)**：传入 `subject={XxxSubject}`，受控列声明 `field: XxxField.YYY` 即可自动托管导出与列可见性；
  - **表单端 (`FormModal`)**：外层声明 `subject={XxxSubject}`，内部控件由 DTO 属性映射全自动实现 `HIDDEN` 剥离与 `READONLY` 置灰；
- **定位**：零过度设计，最快速闭环单点基础能力。

---

### Level 2：组件积木化与状态解耦层 (Modular Lego Decomposition — 单切片内部防巨石)
- **适用场景**：当单个切片内的业务逻辑增多、字段庞大、包含多块技术参数、多步骤交互或非标排版（如全屏单据、主档技术参数分块、SOP 与复杂工艺要求等）；
- **核心形态**：**严禁将复杂业务无脑写成千行单文件巨石 (Monolith)**！强制执行**积木化物理拆解**，且**必须优先编排现有公共资产**：
  1. **纯状态逻辑抽离 (`useXxxFormState.ts`)**：将表单数据、联动计算、前置校验与提交网络调用完全从 UI 中剥离，UI 仅做响应式绑定；
  2. **单一职责积木组件拆解**：在 `ui/form/`（或 `ui/detail/`）下拆分为各个高内聚积木（如 `XxxBasicSection.tsx`、`XxxTechnicalSection.tsx`、`XxxDetailSection.tsx`），单文件代码严格控制在 50~180 行以内；
  3. **公共资产优先编排铁律 (Public Assets Composition First)**：
     - **积木拼装不是从零手绘**，必须最大限度复用现有的基础设施与受控组件：
     - **表单区块**：优先使用 `<FormFields />` 或在卡片内使用 `<AuthField>` 包装受控原子控件（`<Combobox>`、`<Input>`），自动继承三态控制与必填红星；
     - **操作按钮**：必须受控于 `<AuthGuard>`，严禁在积木内部裸写写操作按钮；
     - **明细表格**：优先复用 `<DetailTable />`（内置增删行、只读态、合计统计栏）；
     - **逃生舱原则**：**只有当公共资产确实无法覆盖业务特性时**（如复杂树形图谱、联动公式计算器），才允许自主封装特定业务积木，但外层仍需受控。
  4. **受控外壳统一接管**：所有积木装配在 `<DocumentShell>` 之中，由外壳统一广播单据三态与权限上下文。

---

### Level 3：子切片领域自治层 (Sub-Feature / Sub-Slice Domain Autonomy — 复合特性的终极形态)
- **适用场景**：当一个业务特性包含**从属子实体、明细子表或附属主数据**（如工序主档下挂**工艺规格明细**；客户主档下挂**客户分类与标签**；制造 BOM 下挂**版本与投入产出工艺清单**）；
- **核心形态与全仓标杆（参考 `packages/domains/customer-center`）**：
  - **彻底告别大杂烩**：严禁 AI 或开发者把所有主子实体、明细表格和辅助业务无脑混在一个目录或同一个 `service.ts` 中！
  - **按领域聚合根物理划清边界**：在主 Feature 目录下为从属子实体建立**独立的子切片目录（Sub-Slice）**：
  ```text
  features/customer-management/          # 主切片：客户管理聚合根
  ├── contract.ts                        # 主客户权限契约
  ├── schema.ts                          # 主客户 Zod 校验
  ├── types.ts                           # 主客户 ViewModel 与 DTO
  ├── service.ts                         # 主客户领域服务
  ├── queries.ts / actions.ts            # 主客户读写网关
  ├── category/                          # 【独立子切片】：客户分类（自包含完整闭环）
  │   ├── contract.ts / schema.ts / types.ts
  │   ├── service.ts / queries.ts / actions.ts
  │   └── ui/ (CategoryView, CategoryFormModal)
  ├── tag/                               # 【独立子切片】：客户标签（自包含完整闭环）
  │   ├── contract.ts / schema.ts / types.ts
  │   ├── service.ts / queries.ts / actions.ts
  │   └── ui/ (TagView, TagFormModal)
  └── ui/                                # 主切片积木视图（使用 Level 2 积木拆分）
      ├── CustomerView.tsx
      └── form/ (CustomerFormPage, CustomerBasicSection, etc.)
  ```
- **Level 3 对 Level 1 与 Level 2 的全面包容与复用法则**：
  1. **实体与契约自治**：子切片自包含其自身的 `contract.ts`（独立的 Subject、Field、权限项），受控列与权限边界清晰；
  2. **在 Level 3 内部复用 Level 2**：
     - 子切片自身的明细表格（如 `SpecificationTable.tsx`）采用 **Level 2** 单一职责积木化开发；
     - 主-子复合页面（如上半部分工序技术信息，下半部分工艺规格明细表）通过 **Level 2** 的积木组合方式拼装，由主切片的 `useXxxFormState.ts` 集中管理；
  3. **在 Level 3 内部复用 Level 1**：
     - 若子切片拥有独立维护的入口（如客户分类/标签），直接复用 **Level 1** 的标准 `DataTable` + `FormModal`，心智极度统一；
  4. **服务层单向协作**：子切片 Service（如 `ProcessingSpecificationService`）负责自身的增量比对同步（Sync）、校验与业务计算；主切片 Service 在事务内单向调用子切片 Service，严禁反向双向循环依赖。

---

## 5. 复杂业务应对与扩展指南（逃生舱）

本流程作为通用模板，主要覆盖单实体的标准增删改查。当遇到复杂度更高的业务页面时，推荐按以下合规方式扩展，无需削足适履：

| 复杂场景                  | 推荐扩展范式                                                                                 | 规范底线                                                                 |
| :------------------------ | :------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| **超长字段 / 多阶段录入** | 扩展为多步骤向导（Wizard 弹窗/抽屉），或独立的完整编辑页面（如 `[id]/page.tsx`）             | 依然直接消费 `schema.ts`（支持分步 schema），禁止在前端散落非校验状态    |
| **主子表 / 行明细嵌套**   | 主表维持 `DataTable`，子表在 Modal/Drawer 内部使用内嵌表格或受控明细列表                     | 明细数据与主数据在单个事务内原子提交，保持纯数据输入                     |
| **复杂复合筛选**          | 充分利用 `DataTable` 的 `filterExtra` 插槽，搭配 `DataTableInputGroup`、日期范围、级联选择器 | URL 参数仍收敛于 `contract.ts` 的 `defineListSearchParams`，保持可分享性 |
| **批量操作 / 数据导入**   | 启用 `contentProps={{ selectable: true }}`，利用 `selectedRows` 触发批量 Action              | 批量写操作同样经 `defineServerAction` 并在后端做循环事务安全校验         |
| **轻量字典 / 配置项**     | 简化 `queries.ts`（无需 `accessibleWhere`），保留轻量 CRUD 闭环                              | UI 与 FormModal 保持与主实体一致的受控生命周期与模式接管                 |

---

## 6. 红线与底线

无论业务如何复杂定制，以下原则始终不可突破：

1. **禁止绕过权限**：写操作按钮必须受控于 CASL（优先由 `DataTable` 自动托管，自定义栏位用 `<AuthGuard>`）；
2. **禁止破坏序列化**：RSC 向客户端传递纯数据（`toPlainData` 防腐），严禁直接透传函数或未受控 Prisma 对象；
3. **禁止裸写原生 HTML 控件**：100% 使用 `@base/ui` 原子套件构建界面；
4. **禁止二次手写 Zod**：表单校验一律直接导入 `schema.ts` 唯一定义源。

---

## 7. 存量迁移（DEBT）

凡仍使用旧版 URL hook、手动计算权限或手绘表单的存量视图，按本标准最佳范式重构对齐；迁完删除 `@deprecated` API。
