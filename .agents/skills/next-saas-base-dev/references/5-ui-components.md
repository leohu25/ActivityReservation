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
| **5. 树形工作台 (Tree)**             | `packages/base/ui/src/components/tree/`       | `HierarchyTree`, `DirectoryTreeFilter`, `DataTree` 等                                        | 组织架构、商品分类等层级数据维护、左树右表过滤与同级排序。                                                                                                        |
| **6. 应用布局与外壳 (Layout)**       | `packages/base/ui/src/components/layout/`     | `DashboardShell`, `TabBar`, `TopHeader`, `AppSidebar`, `MasterDetailShell`, `PageShell` 等   | 双端应用级主框架外壳、现代 ERP 多标签页、面包屑与自适应主从联动骨架。                                                                                             |
| **7. 交互反馈套件 (Feedback)**       | `packages/base/ui/src/components/feedback/`   | `ConfirmDialog`, `EmptyState`, `Toast` (基于 `sonner`) 等                                    | 全局统一反馈事实源、破坏性操作二次确认、空状态引导。                                                                                                              |

> ⚠️ **核心红线与行为准则**：
>
> 1. **全量遵循 shadcn 官方规范 (No Raw Divs/Controls)**：杜绝裸手写 `div` 布局或裸浏览器原生控件（如原生 `input type="date"`），所有布局排版与交互控件必须基于框架已有的原子与高阶中台组件开发。开发时直接指明使用 `.agents/skills/shadcn/` 最佳范式 Skill；
> 2. **原子层支持就地修改，禁止套壳伪封装**：新增变体直接修改 `components/ui/` 源码中的 `cva`，严禁为了加几个类名就在外层包一个 1:1 的同名包装壳；
> 3. **严禁写操作按钮裸奔（必须受控于 CASL）**：标准列表优先使用 `DataTable`（显式配置 `subject` 自动接管 `create`、`export` 与行操作 `DataTableRowActions`）；多级层级树统一使用 `DataTree`；自由定制页面必须通过受控组件 `<ActionButton>` / `<ActionGroup>` 或声明式 `<AuthGuard>` 包裹，严禁在业务中直接渲染无权限受控的裸 `<Button>` 写操作；
> 4. **平台 UI 基建沉淀主动提问机制 (UI Infrastructure Extraction Trigger)**：在垂直切片实施过程中，一旦发现当前交互模式、明细表、子表单或看板具备通用性，**严禁在切片内部私造或闭门造车，必须主动向用户发起提问**，评估并沉淀至 `@base/ui`；
> 5. **二次确认只在对话框提示一次**：破坏性操作统一由 `ActionButton` 或 `DataTableRowActions` 的 `ConfirmDialog` 进行模态对话框确认，严禁在回调函数内再次使用浏览器的 `window.confirm` 进行二次弹窗；
> 6. **消息通知右上角 Toast 弹出**：严禁在页面顶部塞入静态红色大横幅挤压变形表格布局，所有成功、警告与错误提示统一使用右上角 `toast`（基于 `sonner`）；页内粘性反馈用 `FeedbackBanner`（基于 shadcn `Alert`）；
> 7. **杜绝全页强刷**：严禁 `window.location.reload()`；mutation 默认 Action 内 `revalidatePath`，客户端默认不写 `router.refresh()`；
> 8. **服务端分页（生产必选）**：`DataTable` 默认不做客户端切片，服务端分页驱动。

`DataTable.Root` 默认**不做**客户端切片：`data` 必须是服务端返回的**当前页**，`total` 来自 API `count`。

```tsx
// RSC page.tsx — 见 references/9：createResourcePage 或等价 parse + query
const parsed = await customerSearchParams.parse(searchParams);
const { items, total } = await listCustomersQuery({
  page: parsed.page,
  pageSize: parsed.pageSize,
  keyword: parsed.keyword || undefined,
});
return <CustomerView data={items} total={total} />;

// Client View — 一体 DataTable + useListSearch（非手拼 Root + navigateList）
const list = useListSearch(customerSearchParams);
<DataTable
  {...list.dataTableProps}
  data={data}
  columns={columns}
  total={total}
  subject={customerPageContract.subject}
/>
```

服务层使用 `count` + `skip/take`，严禁 `findMany` 全量返回后再前端切页。
本地演示可用 `clientSidePagination` 显式开启，生产列表禁止。

**一体化卡片容器原则**：搜索栏、工具栏、表格主体与分页条必须包在同一张 `DataTable.Root` 白卡内，严禁零散漂浮在页面灰色背景上。

---

## 1. 统一通知组件 (Toast)

在 `@base/ui` 中封装了基于 `sonner` 的统一通知工具：

```tsx
import { toast } from "@base/ui";

toast.success("客户创建成功");
toast.error(res.error || "删除客户失败");
toast.warning("检测到该客户存在未结款项");
```

---

## 2. 现代化工业风 DataTable 通用积木与权限开发手册

> **权限来源（官方 CASL）**：切片 layout 已挂 `TenantAbilityProvider`；`DataTable` **只传 `subject`**，禁止传 `permissions`/`ability`。完整范式见 `7-casl-ability-provider.md`。

### 2.0 状态流水线与列表约定（`defineListSearchParams` + `useListSearch`）

> **已固化规范**（对标 Element UI：约定大于配置）：  
> - URL：`contract.ts` 内 `defineListSearchParams({ 扩展默认值 })`，自动自带 **page / pageSize / keyword**  
> - Client：`useListSearch(params)` 返回 `dataTableProps`，直接 spread 到 `DataTable`  
> - **禁止**：`useDataTableState`、`useListUrlNav`、`useTableUrlState`、`parseTableSearchParams`（旧 API 已 `@deprecated` 或作废）

```tsx
import { DataTable, useListSearch } from "@base/ui";
import { customerSearchParams, customerPageContract } from "../contract";

export function CustomerView({ data, total, categoryOptions }: Props) {
  const list = useListSearch(customerSearchParams);

  return (
    <DataTable
      {...list.dataTableProps}
      data={data}
      columns={columns}
      total={total}
      subject={customerPageContract.subject}
      title="客户档案"
      description="维护企业客户主数据..."
      keywordPlaceholder="搜索客户编码、名称、联系人、电话..."
      onExport={handleExport}
      onCreate={() => setModal({ open: true, mode: "create" })}
      statusOptions={[
        { value: "ACTIVE", label: "正常" },
        { value: "DISABLED", label: "已停用" },
      ]}
      statusValue={String(list.params.status ?? "")}
      onStatusChange={(v) => list.patch({ status: v || "" })}
      filterExtra={<客户分类 Select />}  {/* 扩展插槽：与默认筛选并排 */}
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
const list = useListSearch(customerSearchParams);
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
  subject="Customer"
  page={page}
  pageSize={pageSize}
  total={total}
  onPageChange={setPagination}
>
  <DataTable.Header
    category="BUSINESS WORKSPACE"
    title="客户档案"
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
      <Input placeholder="单号 / 名称 / 客户" />
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

| 积木                                     | 职责                                                                      | 关键开关                                                                     |
| :--------------------------------------- | :------------------------------------------------------------------------ | :--------------------------------------------------------------------------- |
| `DataTable`                             | **标准列表一体组件（推荐）** 默认 chrome + 可扩展 `filterExtra`/`statusOptions` | `title/subject/columns`、`dataTableProps`（useListSearch）、`filterExtra` |
| `DataTable.Workspace`                   | 自定义工作台积木（非标准 CRUD 首选） | `showRefresh/Export/...` |
| `DataTable.Root`                         | 状态上下文 + 一体化白卡                                                   | `integratedCard`                                                             |
| `DataTable.Header`                       | 分类小标 + 竖条标题 + 说明 + actions 插槽                                 | `category/title/description/actions`                                         |
| `DataTable.Toolbar`                      | 全局操作按钮容器                                                          | children 自由装配                                                            |
| `DataTable.ActionButton`                 | 声明式权限按钮                                                            | `action/subject/unauthorizedStrategy`（默认 hidden）                         |
| `DataTable.ColumnSettings`               | 动态列显隐（DropdownMenu+Checkbox）                                       | 列定义 `lockVisible/defaultVisible`                                          |
| `DataTable.FilterBar`                    | 组合筛选栏                                                                | `onSearch/onReset/onAdvancedFilter`                                          |
| `DataTable.InputGroup`                   | `[标签 \| 控件]` 一体化输入组                                             | `label`                                                                      |
| `DataTable.Content`                      | 紧凑表格主体                                                              | `selectable/showIndex`                                                       |
| `DataTable.RowActions`                   | 行内平铺 + 折叠菜单；默认详情/编辑/删除                                   | `hideView/hideEdit/hideDelete`、`extraActions`、`menuOnly`                   |
| `DataTable.Pagination`                   | 范围文案 + 数字页码                                                       | `showRange/pageSizeOptions`                                                  |
| `DataTable.FormModal`                    | 编辑/新建弹窗（品牌徽标+可选底栏提示）                                    | `badge/headerExtra/auditHint`                                                |
| `DataTable.FormSection/FieldGrid/Banner` | 表单分组/字段网格/信息横幅                                                | 配合 FormModal 使用                                                          |
| `DataTable.DetailDrawer`                 | 详情查看居中弹窗（与编辑弹窗同构）                                        | `record/onClose/children/badge`                                              |
| `DataTable.AuthField`                    | 字段三态表单控件（shadcn `Field`+`Badge` 组合）                           | `field/action`                                                               |
| `DataTable.AuthGuard`                    | 权限包裹任意插槽                                                          | `action`                                                                     |

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

```tsx
<DataTable.RowActions
  record={row}
  onView={() => setViewing(row)}
  onEdit={() => setEditing(row)}
  // 页面不需要删除时：
  // hideDelete
  extraActions={[
    {
      label: row.status === "ACTIVE" ? "停用" : "启用",
      variant: row.status === "ACTIVE" ? "destructive" : "default",
      // 自定义扩展动作：必须与契约 actions 声明的 action 一致
      action: "toggle_status",
      onClick: () => handleToggle(row),
      confirm:
        row.status === "ACTIVE"
          ? { title: `确认停用「${row.name}」？`, confirmText: "确认停用" }
          : undefined,
    },
  ]}
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
const columns: ColumnDef<Customer>[] = [
  { id: "code", header: "客户编码", lockVisible: true, cell: (r) => r.code },
  { id: "name", header: "客户名称", cell: (r) => r.name },
  { id: "secret", header: "内部成本", field: "secretCost", defaultVisible: false, cell: ... },
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
  title={(r) => `客户详情：${r.name}`}
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
        <DataTable.InputGroup label="客户编码">
          <span>{r.code}</span>
        </DataTable.InputGroup>
        <DataTable.InputGroup label="客户名称">
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
const customerSchema = z.object({
  customerCode: z.string().min(3, "编码至少3位").describe("客户编码"),
  customerName: z.string().min(2, "全称至少2个字符").describe("客户全称"),
  contactPhone: z
    .string()
    .regex(/^1\d{10}$/, "手机号格式不正确")
    .describe("联系电话"),
  settlementType: z.enum(["CASH", "MONTHLY_30"]).describe("结算方式"),
});

// 2. UI 渲染字段配置（负责控件类型、网格布局与提示）
const customerFormFields: FormFieldSchema[] = [
  {
    name: "customerCode",
    label: "客户编码",
    type: "text",
    required: true,
    placeholder: "如: CUST-001",
    disabled: true, // 编辑或查看时锁定
  },
  {
    name: "customerName",
    label: "客户全称",
    type: "text",
    required: true,
    placeholder: "工商全称",
  },
  {
    name: "contactPhone",
    label: "联系电话",
    type: "text",
    required: true,
  },
  {
    name: "settlementType",
    label: "结算方式",
    type: "select",
    required: true,
    options: [
      { label: "现结", value: "CASH" },
      { label: "月结30天", value: "MONTHLY_30" },
    ],
  },
];

<FormModal
  open={modalOpen}
  mode={formMode} // "create" | "edit" | "view"
  title={
    formMode === "create"
      ? "新增客户"
      : formMode === "edit"
        ? "编辑客户"
        : "客户档案详情"
  }
  schema={customerSchema} // 👈 传入真正的 Zod Schema，自动激活 safeParse 运行时校验
  fields={customerFormFields}
  initialValues={currentRecord}
  onClose={() => setModalOpen(false)}
  onSubmit={async (values) => {
    if (formMode === "create") {
      await createCustomerAction(values);
    } else {
      await updateCustomerAction(currentRecord.id, values);
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
  customerCode: z.string().describe("客户编码"),
  customerName: z.string().describe("客户全称"),
  creditLimit: z.number().describe("授信额度"),
  status: z.string().describe("状态"),
});

// 自动生成列定义：自动继承 describe 描述，数值字段自动右对齐 (align: 'right')
const columns: ColumnDef<CustomerItem>[] = createColumnsFromSchema(entitySchema, {
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
  title={(r) => (r ? `编辑客户：${r.name}` : "新建客户")}
  description="操作过程自动留痕"
  onSubmit={handleSubmit}
  headerExtra={
    <DataTable.FormBanner
      title="客户主数据"
      description="保存后立即进入客户列表，操作自动留痕。"
    />
  }
>
  {({ record }) => (
    <DataTable.FormSection title="基本信息">
      <DataTable.FormFieldGrid columns={4}>
        <DataTable.InputGroup label="客户编码">
          <Input defaultValue={record?.code} />
        </DataTable.InputGroup>
        <DataTable.InputGroup label="客户名称">
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
// ✅ 已固化标杆（禁止镜像 state / router.refresh）
export function CustomerView({ data, total, categoryOptions }: Props) {
  const list = useListSearch(customerSearchParams);
  const [modal, setModal] = useState({ open: false, mode: "create" as const });

  return (
    <>
      <DataTable
        {...list.dataTableProps}
        data={data}
        columns={columns}
        total={total}
        subject={customerPageContract.subject}
        onExport={handleExport}
        onCreate={() => setModal({ open: true, mode: "create" })}
        filterExtra={/* 扩展筛选 */}
      />
      <CustomerFormModal open={modal.open} mode={modal.mode} ... />
    </>
  );
}
// 删除/状态变更：调用 createResourceActions 导出的 Action；
// Action 内 revalidatePath 自愈，客户端不 router.refresh()
```
