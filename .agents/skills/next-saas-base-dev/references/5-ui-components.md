# 模块 5：UI 交互、布局原语与组件沉淀规范

本系统基于技术中立的 `@base/ui`（shadcn/ui 官方原语体系）构建，具体视觉设计风格（如 Chenrun Digital ERP 风格）作为外部 Theme 资产在 `design-system/chenrun-digital-erp/MASTER.md` 与 CSS 语义变量中配置注入。

## 0. 设计系统资产模型与官方范式 (Monorepo Design System)

全系统严格遵循 **shadcn UI 官方最佳实践（Monorepo Design System 标准拓扑）**，落实“代码所有权（Code Ownership）”，消灭多余伪包装层：

| 层级与模块                           | 目录位置                                      | 典型代表                                                                                     | 职责与规范                                                                                                                                                        |
| ------------------------------------ | --------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. 官方原子基石 (Primitives)**     | `packages/base/ui/src/components/ui/`         | `button`, `input`, `dialog`, `card`, `badge`, `select`, `table`, `field`, `sonner` 等        | Base UI (`@base-ui/react`) / shadcn 官方原语基石，**源码归项目所有（Git 跟踪），允许且推荐就地通过 CVA 扩充变体与内嵌修补，遵循 `.agents/skills/shadcn/` 规范**。 |
| **2. 高阶表格资产 (Data Table)**     | `packages/base/ui/src/components/data-table/` | `DataTable`, `DataTableRoot`, `DataTableRowActions`, `DataTablePagination`, `DetailTable` 等 | 完整业务表格工作区，负责搜索、分面过滤、分页、列配置、Action 权限接管与 CSV 导出。                                                                                |
| **3. 权限基础设施 (Auth Guards)**    | `packages/base/ui/src/components/auth/`       | `ActionButton`, `ActionGroup`, `AuthGuard`, `AuthField`, `UiAbilityProvider` 等              | 注入 CASL 强类型权限判定、三态权限控制与防误删门禁，解耦业务与权限规则。                                                                                          |
| **4. 高阶表单与弹窗 (Form & Modal)** | `packages/base/ui/src/components/form/`       | `FormModal`, `Combobox`, `DatePicker`, `FormDrawer`, `FormFields`, `FormLayout` 等           | Zod Schema 运行时校验驱动的三态表单（create/edit/view）、复杂单据录入与内置明细表联动。                                                                           |
| **5. 树形工作台 (Tree)**             | `packages/base/ui/src/components/tree/`       | `HierarchyTree`, `TreeFilter`, `TreeNav`, `DataTree` 等                                      | 组织架构、商品分类等层级数据维护、左树右表过滤与同级排序。                                                                                                        |
| **6. 应用布局与外壳 (Layout)**       | `packages/base/ui/src/components/layout/`     | `DashboardShell`, `TabBar`, `TopHeader`, `AppSidebar`, `MasterDetailShell`, `PageShell` 等   | 双端应用级主框架外壳、现代 ERP 多标签页、面包屑与自适应主从联动骨架。                                                                                             |
| **7. 交互反馈套件 (Feedback)**       | `packages/base/ui/src/components/feedback/`   | `ConfirmDialog`, `EmptyState`, `Toast` (基于 `sonner`) 等                                    | 全局统一反馈事实源、破坏性操作二次确认、空状态引导。                                                                                                              |

> ⚠️ **核心红线与行为准则**：
>
> 1. **全量遵循 shadcn 官方规范 (No Raw Divs/Controls)**：杜绝裸手写 `div` 布局或裸浏览器原生控件（如原生 `input type="date"`），所有布局排版与交互控件必须基于框架已有的原子与高阶中台组件开发。开发时直接指明使用 `.agents/skills/shadcn/` 最佳范式 Skill；
> 2. **原子层支持就地修改，禁止套壳伪封装**：新增变体直接修改 `components/ui/` 源码中的 `cva`，严禁为了加几个类名就在外层包一个 1:1 的同名包装壳；
> 3. **严禁写操作按钮裸奔（必须受控于 CASL）**：标准列表优先使用 `DataTable`（显式配置 `subject` 自动接管 `create`、`export` 与行操作 `DataTableRowActions`）；多级层级树统一使用 `DataTree`；自由定制页面必须通过受控组件 `<ActionButton>` / `<ActionGroup>` 或声明式 `<AuthGuard>` 包裹，严禁在业务中直接渲染无权限受控的裸 `<Button>` 写操作；
> 4. **单据与表单 CRUD 分级治理（依字段复杂度定形态，严禁一刀切）**：
>    - **多字段复杂主实体 / 业务单据（核心标准）**：如客户档案、物料主数据、供应商、报价单、销售订单、采购单、出入库单等（字段多、分区块、带明细表 DetailTable、带审批流、需多任务比对），**100% 采用全屏单据工作台 (`FormPage`) 通过独立路由在 TabBar 中打开新页签**；保存后默认留在当前页，由用户主动点击底栏返回或关闭页签；
>    - **轻量辅助实体 / 字典 / 标签 / 分类（敏捷标准）**：如客户分类、标签管理、计量单位、数据字典等（字段极少，通常 ≤ 4~5 个基础字段），**采用轻量模态窗 (`FormModal`) 或侧边抽屉 (`FormDrawer`) 就地操作**，即开即填即关，避免轻量操作大动干戈开新 Tab，保持高效率与轻快感；
> 5. **平台 UI 基建沉淀主动提问机制 (UI Infrastructure Extraction Trigger)**：在垂直切片实施过程中，一旦发现当前交互模式、明细表、子表单或看板具备通用性，**严禁在切片内部私造或闭门造车，必须主动向用户发起提问**，评估并沉淀至 `@base/ui`；
> 6. **二次确认只在对话框提示一次**：破坏性操作统一由 `ActionButton` 或 `DataTableRowActions` 的 `ConfirmDialog` 进行模态对话框确认，严禁在回调函数内再次使用浏览器的 `window.confirm` 进行二次弹窗；
> 7. **消息通知右上角 Toast 弹出**：严禁在页面顶部塞入静态红色大横幅挤压变形表格布局，所有成功、警告与错误提示统一使用右上角 `toast`（基于 `sonner`）；页内粘性反馈用 `FeedbackBanner`（基于 shadcn `Alert`）；
> 8. **杜绝全页强刷**：严禁 `window.location.reload()`；mutation 默认 Action 内 `revalidatePath`，客户端默认不写 `router.refresh()`；
> 9. **服务端分页（生产必选）**：`DataTable` 默认不做客户端切片，服务端分页驱动。

`DataTable.Root` 默认**不做**客户端切片：`data` 必须是服务端返回的**当前页**，`total` 来自 API `count`。

```tsx
// RSC page.tsx — 见 references/9：createResourcePage 或等价 parse + query
const parsed = await resourceSearchParams.parse(searchParams);
const { items, total } = await listResourcesQuery({
  page: parsed.page,
  pageSize: parsed.pageSize,
  keyword: parsed.keyword || undefined,
});
return <ResourceView data={items} total={total} />;

// Client View — 一体 DataTable + useListSearch（非手拼 Root + navigateList）
const list = useListSearch(resourceSearchParams);
<DataTable
  {...list.dataTableProps}
  data={data}
  columns={columns}
  total={total}
  subject={resourcePageContract.subject}
/>;
```

服务层使用 `count` + `skip/take`，严禁 `findMany` 全量返回后再前端切页。
本地演示可用 `clientSidePagination` 显式开启，生产列表禁止。

**一体化卡片容器原则**：搜索栏、工具栏、表格主体与分页条必须包在同一张 `DataTable.Root` 白卡内，严禁零散漂浮在页面灰色背景上。

---

## 1. 统一通知组件 (Toast)

在 `@base/ui` 中封装了基于 `sonner` 的统一通知工具：

```tsx
import { toast } from "@base/ui";

toast.success("记录创建成功");
toast.error(res.error || "删除记录失败");
toast.warning("检测到存在关联受限项目");
```

---

## 2. 现代化工业风 DataTable 通用积木与权限开发手册

> **权限来源（官方 CASL）**：切片 layout 已挂 `TenantAbilityProvider`；`DataTable` **只传 `subject`**，禁止传 `permissions`/`ability`。完整范式见 `7-casl-ability-provider.md`。

### 2.0 状态流水线与列表约定（`defineListSearchParams` + `useListSearch`）

> **已固化规范**（对标 Element UI：约定大于配置）：
>
> - URL：`contract.ts` 内 `defineListSearchParams({ 扩展默认值 })`，自动自带 **page / pageSize / keyword**
> - Client：`useListSearch(params)` 返回 `dataTableProps`，直接 spread 到 `DataTable`
> - **禁止**：`useDataTableState`、`useListUrlNav`、`useTableUrlState`、`parseTableSearchParams`（旧 API 已 `@deprecated` 或作废）

```tsx
import { DataTable, useListSearch } from "@base/ui";
import { resourceSearchParams, resourcePageContract } from "../contract";

export function ResourceView({ data, total, options }: Props) {
  const list = useListSearch(resourceSearchParams);

  return (
    <DataTable
      {...list.dataTableProps}
      data={data}
      columns={columns}
      total={total}
      subject={resourcePageContract.subject}
      title="资源档案"
      description="维护主数据与业务条目..."
      keywordPlaceholder="搜索编码、名称、标签..."
      onExport={handleExport}
      onCreate={() => setModal({ open: true, mode: "create" })}
      statusOptions={[
        { value: "ACTIVE", label: "正常" },
        { value: "DISABLED", label: "已停用" },
      ]}
      statusValue={String(list.params.status ?? "")}
      onStatusChange={(v) => list.patch({ status: v || "" })}
      filterExtra={<CategorySelect />}  {/* 扩展插槽：与默认筛选并排 */}
    />
  );
}
```

### 2.1 一体化列表 chrome（约定大于配置）

**标准列表**直接使用 `DataTable` 一体组件（非手拼 Root/Header/FilterBar）：

- **默认 chrome（始终可见）**：标题、刷新、导出、列设置、新增、关键字搜索、查询/重置、分页
- **扩展插槽（叠加，不折叠默认项）**：`statusOptions`、`filterExtra`、`toolbarExtra`
- **禁止**业务层手绘壳（ListShell/TableRegion）或把默认能力收进抽屉
- `DataTable.Workspace` / `DataTable.Root` 原子积木：仅完全自定义布局时使用；标准 CRUD **优先一体 `DataTable` + `useListSearch`**

```tsx
// 标准范式（推荐）
const list = useListSearch(resourceSearchParams);
<DataTable {...list.dataTableProps} data={data} columns={columns} total={total} ... />

// 页面装配优先 createResourcePage（见 references/9-crud-resource-paradigm.md）
```

**原子拼装仍可用**（需要完全自定义布局时）：搜索栏、工具栏、表格主体与分页条必须包在同一张 `DataTable.Root` 白卡内，严禁零散漂浮在页面灰色背景上。

```tsx
// 原子范式（需要完全自定义布局时）
<DataTable.Root
  data={data}
  columns={columns}
  rowKey={(item) => item.id}
  subject="Resource"
  page={page}
  pageSize={pageSize}
  total={total}
  onPageChange={setPagination}
>
  <DataTable.Header
    category="BUSINESS WORKSPACE"
    title="资源档案"
    description="按业务清单维护查询字段、状态流、业务数据与操作留痕。"
    actions={
      <DataTable.Toolbar>
        <DataTable.ActionButton action="export" variant="outline" size="sm">
          导出
        </DataTable.ActionButton>
        <DataTable.ColumnSettings />
        <DataTable.ActionButton action="create" size="sm">
          新增
        </DataTable.ActionButton>
      </DataTable.Toolbar>
    }
  />

  <DataTable.FilterBar onSearch={handleSearch} onReset={handleReset}>
    <DataTable.InputGroup label="关键字" className="w-64">
      <Input placeholder="单号 / 名称 / 标识" />
    </DataTable.InputGroup>
    <DataTable.InputGroup label="状态" className="w-36">
      <Select ... />
    </DataTable.InputGroup>
  </DataTable.FilterBar>

  <DataTable.Content selectable showIndex />

  <DataTable.Pagination />
</DataTable.Root>
```

特殊内嵌场景可关闭卡片壳：`integratedCard={false}`。

### 2.2 核心积木零件矩阵

| 积木                                     | 职责                                                                            | 关键开关                                                                  |
| :--------------------------------------- | :------------------------------------------------------------------------------ | :------------------------------------------------------------------------ |
| `DataTable`                              | **标准列表一体组件（推荐）** 默认 chrome + 可扩展 `filterExtra`/`statusOptions` | `title/subject/columns`、`dataTableProps`（useListSearch）、`filterExtra` |
| `DataTable.Workspace`                    | 自定义工作台积木（非标准 CRUD 首选）                                            | `showRefresh/Export/...`                                                  |
| `DataTable.Root`                         | 状态上下文 + 一体化白卡                                                         | `integratedCard`                                                          |
| `DataTable.Header`                       | 分类小标 + 竖条标题 + 说明 + actions 插槽                                       | `category/title/description/actions`                                      |
| `DataTable.Toolbar`                      | 全局操作按钮容器                                                                | children 自由装配                                                         |
| `DataTable.ActionButton`                 | 声明式权限按钮                                                                  | `action/subject/unauthorizedStrategy`（默认 hidden）                      |
| `DataTable.ColumnSettings`               | 动态列显隐（DropdownMenu+Checkbox）                                             | 列定义 `lockVisible/defaultVisible`                                       |
| `DataTable.FilterBar`                    | 组合筛选栏                                                                      | `onSearch/onReset/onAdvancedFilter`                                       |
| `DataTable.InputGroup`                   | `[标签 \| 控件]` 一体化输入组                                                   | `label`                                                                   |
| `DataTable.Content`                      | 紧凑表格主体                                                                    | `selectable/showIndex`                                                    |
| `DataTable.RowActions`                   | 行内平铺 + 折叠菜单；默认详情/编辑/删除                                         | `hideView/hideEdit/hideDelete`、`extraActions`、`menuOnly`                |
| `DataTable.Pagination`                   | 范围文案 + 数字页码                                                             | `showRange/pageSizeOptions`                                               |
| `DataTable.FormModal`                    | 编辑/新建弹窗（品牌徽标+可选底栏提示）                                          | `badge/headerExtra/auditHint`                                             |
| `DataTable.FormSection/FieldGrid/Banner` | 表单分组/字段网格/信息横幅                                                      | 配合 FormModal 使用                                                       |
| `DataTable.DetailDrawer`                 | 详情查看居中弹窗（与编辑弹窗同构）                                              | `record/onClose/children/badge`                                           |
| `DataTable.AuthField`                    | 字段三态表单控件（shadcn `Field`+`Badge` 组合）                                 | `field/action`                                                            |
| `DataTable.AuthGuard`                    | 权限包裹任意插槽                                                                | `action`                                                                  |

### 2.3 自定义操作按钮如何加权限

**约定大于配置**：页面直接声明按钮；普通用户按权限隐藏；不需要的按钮用 `hide*` 或不写该 Button，并同步从契约删 action。

```tsx
// 声明式：自动从 Root 继承 subject，Fail-Closed
<DataTable.ActionButton action="create" size="sm">新增</DataTable.ActionButton>

// 跨实体覆盖
<DataTable.ActionButton action="export" subject="Report" variant="outline">
  导出报表
</DataTable.ActionButton>

// 未授权策略：hidden（默认）| disabled-tooltip（置灰+提示）
<DataTable.ActionButton
  action="audit"
  unauthorizedStrategy="disabled-tooltip"
  unauthorizedTooltip="暂无审核权限"
>
  审核
</DataTable.ActionButton>

// 函数式插槽：批量流转
<DataTable.Actions>
  {({ can, isAnySelected, selectedKeys }) =>
    isAnySelected && can("batchSubmit") ? (
      <Button size="sm" onClick={() => batchSubmit(selectedKeys)}>
        批量提交
      </Button>
    ) : null
  }
</DataTable.Actions>
```

**Fail-Closed 规则**：上层已挂 `AbilityProvider` 时，无权限 → 隐藏/置灰；无 Provider / 缺 `subject` 时视为无权限（禁止默认放行）。

**禁止**手写 `canExport && <Button>` 再包一层——用 `ActionButton` 即可。

### 2.4 行级操作：平铺链接 + 折叠菜单

对齐工业风参考：高频操作直接平铺文字链接（详情/编辑），次要与危险操作折叠进 `...`：

**默认全量展示**内置「详情 / 编辑 / 删除」；页面不需要时用 `hideView` / `hideEdit` / `hideDelete` 显式关闭，并同步从契约移除对应 action。

> ⚠️ **「详情」置灰避坑红线**：
> `DataTableRowActions` 内部对内置动作实施闭环检查：若用户拥有 `read` 权限但页面未传递 `onView` 回调，系统会判定为“未配置操作回调”，从而将「详情」按钮**以置灰不可点击态（disabled）暴露在界面上**。
> **行级操作严格规范**：
>
> 1. **增删改查标准形态**：内置 `onView`（查看）、`onEdit`（编辑）、`onDelete`（删除）；若页面不需要某项（例如只读流水无需删除），显式传入 `hideDelete={true}`；
> 2. **内置停用/启用状态操作**：`onToggleStatus` 已作为官方一等公民内置能力！无需再手动拼接 `extraActions`。通过 `toggleStatusOptions` 传入 status、文案与确认逻辑即可；若实体无此状态字段，不传 `onToggleStatus` 即可自动隐去；
> 3. **严禁无回调置灰残留**：不需要的操作显式 hide，严禁漏传回调导致灰色不可点击按钮破坏界面质感。

```tsx
<DataTable.RowActions
  record={row}
  onView={() => setViewing(row)}
  onEdit={() => setEditing(row)}
  // 官方内置启停操作（有 status 字段且需要启停控制时传入）：
  onToggleStatus={() => handleToggle(row)}
  toggleStatusOptions={{
    status: row.status,
    action: "toggle_status",
    confirm: (record, active) =>
      active
        ? { title: `确认停用「${record.name}」？`, confirmText: "确认停用" }
        : undefined,
  }}
  // 页面不需要删除时显式声明：
  // hideDelete={true}
  onDelete={() => handleDelete(row)}
  deleteConfirm={{
    title: `确认删除「${row.name}」？`,
    confirmText: "确认删除",
  }}
/>
```

自定义动作（如 `toggle_status`）必须：

1. 在 `contracts/<page>.contract.ts` 的 `actions` 中声明；
2. 在 RowActions/ActionButton 上挂同一 `action`；
3. 在 Server Action 里 `assert*Ability(ability, action, subject)`。

两页都要同名操作但权限独立 → **各自契约、不同 Subject**。

### 2.5 动态列设置

列定义上声明 `defaultVisible` / `lockVisible`：

```tsx
const columns: ColumnDef<ResourceItem>[] = [
  { id: "code", header: "编码", lockVisible: true, cell: (r) => r.code },
  { id: "name", header: "名称", cell: (r) => r.name },
  { id: "secret", header: "内部指标", field: "secretMetric", defaultVisible: false, cell: ... },
];
```

- `lockVisible: true` → 列设置面板中锁定不可隐藏；
- `defaultVisible: false` → 初始隐藏，用户可手动打开；
- `field` 列同时受 CASL `HIDDEN` 物理剥离（服务端与客户端双重过滤）。

### 2.6 字段三态自动推导与拦截

**列表列**：`ColumnDef.field` + ability → 无 `read` 权限时整列从表头与单元格物理剥离，列设置面板同步剔除。

**表单控件**：使用 `DataTable.AuthField` 自动三态：

```tsx
<DataTable.AuthField field="costPrice" label="成本价" action="update">
  <Input type="number" />
</DataTable.AuthField>
// HIDDEN → 不渲染；READONLY → disabled + 只读徽标；EDITABLE → 正常交互
```

### 2.7 详情查看居中弹窗

详情与编辑统一使用**居中 Dialog**（非侧边抽屉），视觉同构：

```tsx
<DataTable.DetailDrawer
  record={viewing}
  onClose={() => setViewing(null)}
  title={(r) => `记录详情：${r.name}`}
  description="主数据只读视图 · 操作过程自动留痕"
  footer={(r, close) => (
    <>
      <Button variant="outline" size="sm" onClick={close}>
        关闭
      </Button>
      <Button
        size="sm"
        onClick={() => {
          close();
          setEditing(r);
        }}
      >
        进入编辑
      </Button>
    </>
  )}
>
  {(r) => (
    <DataTable.FormSection title="基本信息">
      <DataTable.FormFieldGrid columns={2}>
        <DataTable.InputGroup label="编码">
          <span>{r.code}</span>
        </DataTable.InputGroup>
        <DataTable.InputGroup label="名称">
          <span>{r.name}</span>
        </DataTable.InputGroup>
      </DataTable.FormFieldGrid>
    </DataTable.FormSection>
  )}
</DataTable.DetailDrawer>
```

### 2.8 新建/编辑/查看三态弹窗与 Zod 运行时拦截 (`FormModal`)

对于 80% 的通用 CRUD 业务表单，推荐使用基于 **TypeScript + Zod Schema 真实运行时驱动** 的 `FormModal`，实现新增、编辑、查看三态合一复用：

```tsx
import { z, FormModal, type FormFieldSchema } from "@base/ui";

// 1. 真实 Zod Schema 校验（负责格式验证与运行时拦截）
const resourceSchema = z.object({
  code: z.string().min(3, "编码至少3位").describe("业务编码"),
  name: z.string().min(2, "名称至少2个字符").describe("业务名称"),
  phone: z
    .string()
    .regex(/^1\d{10}$/, "手机号格式不正确")
    .describe("联系电话"),
  type: z.enum(["TYPE_A", "TYPE_B"]).describe("业务类型"),
});

// 2. UI 渲染字段配置（负责控件类型、网格布局与提示）
const resourceFormFields: FormFieldSchema[] = [
  {
    name: "code",
    label: "业务编码",
    type: "text",
    required: true,
    placeholder: "如: ITEM-001",
    disabled: true, // 编辑或查看时锁定
  },
  {
    name: "name",
    label: "业务全称",
    type: "text",
    required: true,
    placeholder: "标准全称",
  },
  {
    name: "phone",
    label: "联系电话",
    type: "text",
    required: true,
  },
  {
    name: "type",
    label: "业务类型",
    type: "select",
    required: true,
    options: [
      { label: "类型 A", value: "TYPE_A" },
      { label: "类型 B", value: "TYPE_B" },
    ],
  },
];

<FormModal
  open={modalOpen}
  mode={formMode} // "create" | "edit" | "view"
  title={
    formMode === "create"
      ? "新增记录"
      : formMode === "edit"
        ? "编辑记录"
        : "记录档案详情"
  }
  schema={resourceSchema} // 👈 传入真正的 Zod Schema，自动激活 safeParse 运行时校验
  fields={resourceFormFields}
  initialValues={currentRecord}
  onClose={() => setModalOpen(false)}
  onSubmit={async (values) => {
    if (formMode === "create") {
      await createResourceAction(values);
    } else {
      await updateResourceAction(currentRecord.id, values);
    }
  }}
/>;
```

- **运行时校验机制**：点击提交或修改输入时自动调用 `schema.safeParse`。校验不通过时阻止 `onSubmit`，并在对应字段下方显示原生 `<p data-slot="form-message">` 红字提示，输入框标注 `aria-invalid` 触发红框；
- `mode === "view"`：所有字段自动转为 disabled 只读态，底栏隐藏保存按钮，仅展示“关闭”；
- `mode === "edit"`：带入已有数据初值，支持唯一标识等字段单独 disabled；
- 20% 极端复杂业务（如多行配方/动态审批树）通过逃生通道直接使用 shadcn 原生 JSX 对话框。

### 2.9 Table 列契约根据 Zod Schema 自动派生 (`createColumnsFromSchema`)

为了消除每个页面反复手动书写大量同质化 `allColumns = [...]` 的代码，提供根据 Zod Schema 快速生成 `ColumnDef` 的辅助工具：

```tsx
import { z, createColumnsFromSchema, type ColumnDef } from "@base/ui";

const entitySchema = z.object({
  code: z.string().describe("编码"),
  name: z.string().describe("名称"),
  amount: z.number().describe("金额"),
  status: z.string().describe("状态"),
});

// 自动生成列定义：自动继承 describe 描述，数值字段自动右对齐 (align: 'right')
const columns: ColumnDef<ResourceItem>[] = createColumnsFromSchema(entitySchema, {
  overrides: {
    creditLimit: {
      format: (val) => `¥${Number(val).toLocaleString()}`,
    },
    status: {
      cell: (val) => <Badge>{val === "ACTIVE" ? "正常" : "停用"}</Badge>,
    },
  },
  extraColumns: [
    {
      id: "actions",
      header: "操作",
      align: "right",
      cell: (row) => <DataTableRowActions record={row} ... />,
    },
  ],
});
```

### 2.10 编辑/新建弹窗定制模板 (DataTable.FormModal)

```tsx
<DataTable.FormModal
  open={open}
  onOpenChange={setOpen}
  record={editing}
  title={(r) => (r ? `编辑记录：${r.name}` : "新建记录")}
  description="操作过程自动留痕"
  onSubmit={handleSubmit}
  headerExtra={
    <DataTable.FormBanner
      title="记录主数据"
      description="保存后立即进入列表，操作自动留痕。"
    />
  }
>
  {({ record }) => (
    <DataTable.FormSection title="基本信息">
      <DataTable.FormFieldGrid columns={4}>
        <DataTable.InputGroup label="编码">
          <Input defaultValue={record?.code} />
        </DataTable.InputGroup>
        <DataTable.InputGroup label="名称">
          <Input defaultValue={record?.name} />
        </DataTable.InputGroup>
        <DataTable.AuthField
          field="phone"
          label="联系电话"
          action={record ? "update" : "create"}
        >
          <Input />
        </DataTable.AuthField>
      </DataTable.FormFieldGrid>
    </DataTable.FormSection>
  )}
</DataTable.FormModal>
```

底部默认不展示无意义冗余文本（可传入 `auditHint` 自定义展示提示）。

**底栏按钮分组约定**（对齐参考高保真）：

- 左侧：审计提示（盾牌图标 + 文案）
- 右侧：同一组按钮，`gap-2` 紧凑排列；次级在左、主操作在右
- 常用主数据弹窗按钮组：`返回 / 另存为新产品 / 保存并新增 / 保存`

```tsx
<DataTable.FormModal
  // ...
  cancelText="返回"
  submitText="保存"
  extraActions={[
    {
      key: "saveAs",
      label: "另存为新产品",
      variant: "outline",
      onClick: async (record) => {
        /* 另存 */
      },
    },
    {
      key: "saveAndCreate",
      label: "保存并新增",
      variant: "outline",
      onClick: async (record) => {
        /* 保存并清空表单 */
      },
    },
  ]}
/>
```

**工具栏按钮组约定**：

```tsx
<DataTable.Toolbar>
  {" "}
  {/* 默认 justify-end，gap-2 */}
  <Button variant="outline" size="sm">
    刷新
  </Button>
  <DataTable.ActionButton action="export" variant="outline" size="sm">
    导出
  </DataTable.ActionButton>
  <DataTable.ColumnSettings />
  <DataTable.ActionButton action="create" size="sm">
    新增
  </DataTable.ActionButton>
</DataTable.Toolbar>
```

主操作（新增/提交）用 solid primary，次级统一 outline，同高同字重。

---

## 3. 表格操作列与单次确认 (`DataTableRowActions`)

见 2.4。破坏性操作必须走 `ConfirmDialog`，按钮文案与动作严格对齐（禁止显示错位的「确认删除」却执行停用）。

---

## 4. 响应式无感更新模式 (No Reload)

```tsx
// ✅ 标准响应式视图（禁止镜像 state / router.refresh）
export function XxxView({ data, total, options }: Props) {
  const list = useListSearch(xxxSearchParams);
  const [modal, setModal] = useState({ open: false, mode: "create" as const });

  return (
    <>
      <DataTable
        {...list.dataTableProps}
        data={data}
        columns={columns}
        total={total}
        subject={xxxPageContract.subject}
        onExport={handleExport}
        onCreate={() => setModal({ open: true, mode: "create" })}
        filterExtra={/* 扩展筛选 */}
      />
      <XxxFormModal open={modal.open} mode={modal.mode} ... />
    </>
  );
}
// 删除/状态变更：调用 Server Action；
// Action 内 revalidatePath 自愈，客户端不 router.refresh()
```

---

## 5. 通用树形筛选与导航组件 (`TreeFilter` / `TreeNav`)

在现代 B 端“左树右表”或“左侧导航 + 右侧矩阵”布局中（如：部门架构管理、员工人事过滤、角色权限配置中心等），**必须统一采用 `@base/ui` 导出的 `TreeFilter`（主流语义别名 `TreeNav`）**，严禁在业务切片内手写私有树、独立卡片列表或带静态事件的裸 `div` 布局。

### 5.1 核心原则与架构规范

1. **彻底业务中立**：默认配置杜绝写死“全公司所有部门”等领域特定文案。默认 `allLabel="全部"`，标题自定；
2. **模式自适应**：
   - **过滤树模式**（`showAll={true}`，默认）：顶部常驻“全部”根项汇总，点击传 `null`；
   - **单选导航模式**（`showAll={false}`）：无“全部”项，用于必须选中具体实体（如角色配置中心）；
3. **递归搜索与祖先保全算法**：
   - 过滤算法必须满足：若某子节点或孙节点命中关键字，**其祖先链路上的所有父节点必须自动保留在渲染树中**；
   - 搜索进行时，算法**自动将所有匹配节点的祖先 ID 纳入展开集合**，无需用户手动逐层点击寻找；
4. **全链路强类型（TypeScript Generics，零 `any`）**：
   - 节点类型规范：统一使用 `TreeNode`（别名 `TreeFilterNode` / `TreeNavNode`）；
   - 属性涵盖：`id`, `name`, `code?`, `description?`, `badge?`, `icon?`, `disabled?`, `children?`；
5. **语义化与无障碍 (A11y)**：
   - 折叠指示器与节点标题独立为语义化 `<button type="button">`，严禁在静态 `<div>` 上直接绑定 `onClick` 或手写伪按钮角色。

### 5.2 标准使用范式

```tsx
import { TreeFilter, type TreeNode } from "@base/ui";

// 1. 左树右表部门架构过滤树
<TreeFilter
  title="部门组织拓扑"
  allLabel="全公司所有部门"
  totalCount={departments.length}
  nodes={departmentTreeNodes}
  selectedId={selectedDeptId}
  onSelect={(id) => setSelectedDeptId(id)}
  cascadeToggle={{
    checked: includeChildren,
    onChange: setIncludeChildren,
    label: "包含下级所有子部门",
  }}
  searchPlaceholder="搜索部门名称或编码..."
/>

// 2. 左侧角色导航列表 (单选模式，showAll=false)
<TreeFilter
  title="选择配置角色"
  icon={<Shield className="size-3.5 text-primary" />}
  showAll={false}
  totalCount={roles.length}
  nodes={roleNodes}
  selectedId={selectedRoleCode}
  onSelect={(id) => { if (id) setSelectedRoleCode(id); }}
  searchPlaceholder="过滤角色..."
  maxHeight="max-h-[calc(100vh-14rem)]"
/>
```
