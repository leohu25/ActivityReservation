# @base/ui — 通用企业级 SaaS UI 组件系统

现代化多租户 SaaS 基础设施的共享 UI 资产库。本模块保持**设计与技术完全中立**，不与特定业务或单一行业视觉绑定，作为各垂直切片与平台的统一界面基础设施。

代码架构严格遵循清晰、零冗余、高内聚的 **Atomic Design 三层递进拓扑体系（原子 Atoms -> 分子 Molecules -> 模板 Templates）**：

```text
packages/ui/src/
├── components/
│   ├── shadcn/                     # Layer 1: 基础原子层 (Atoms / 底层原语，无权限逻辑，纯粹 UI 基石)
│   │   └── button, input, dialog, popover, table, command, select, card...
│   ├── composite/                  # Layer 2: 分子受控层 (Molecules / 注入 CASL 抽象权限、防误删、Zod等中立能力)
│   │   ├── auth/                   # 权限动作分子 (ActionButton, ActionGroup, AuthGuard, AuthorizedField...)
│   │   ├── table/                  # 表格分子 (DataTableRowActions, DetailTable, Toolbar, FilterBar...)
│   │   ├── form/                   # 表单分子 (FormFields, Combobox, TagMultiSelect, Layout...)
│   │   └── tree/                   # 树状分子 (HierarchyTree, DirectoryTreeFilter...)
│   └── templates/                  # Layer 3: 业务模板层 (Templates / 完整业务容器，负责布局编排与协议闭环)
│       ├── DataTable.tsx           # 全功能数据列表工作台模板 (搜索、高级筛选、分页、列配置、Action 权限接管)
│       ├── FormModal.tsx           # 全功能表单弹窗模板 (三态切换、Zod 强校验、字段三态动态豁免、内置明细表)
│       ├── HierarchyWorkspace.tsx  # 多级树形维护工作台模板 (层级树、同级上下移排序、Action Schema 受控动作)
│       ├── MasterDetailShell.tsx   # 企业级主从 (Master-Detail) 联动布局骨架
│       ├── PageShell.tsx           # 非列表标准页面容器 (统一页头、描述、快捷操作与反馈横幅)
│       └── DashboardShell.tsx      # 应用级后台主框架外壳 (侧边栏布局与自适应滚动)
```

---

## 核心设计与使用原则

1. **层层递进原则 (Atomic Design)**：
   - **原子层 (Atoms)**：纯粹的 UI 渲染原语，不包含任何权限逻辑；
   - **分子层 (Molecules)**：组合原子原语并注入中立规则（如权限判定、二次确认），自由定制页面**必须使用分子级受控组件（如 `ActionButton` / `ActionGroup`）**，严禁使用裸原子组件进行写操作；
   - **模板层 (Templates)**：完整业务工作区，通过 Action Schema 或契约声明自动闭环权限与交互。
2. **复杂场景优先使用标准模板**：
   - 扁平数据列表与 CRUD 工作台统一使用 `DataTable`；
   - 多级分类、组织架构等层级数据维护统一使用 `HierarchyWorkspace`；
   - 数据录入、信息修改及详情查看弹窗统一使用 `FormModal`；
   - 避免在业务切片内手写重复的 Dialog 遮罩拼装、原生表格布局或样板表单逻辑。
3. **底层原子组件保持纯粹中立**：
   - `shadcn/` 原子组件作为基石零件，不掺杂任何业务假定，能复用尽量复用；
   - 视觉主题由 CSS 语义变量与 Design System 外部注入，组件库内部不硬编码定制样式。
4. **零冗余、单一事实源 (SSoT)**：
   - 权限判定仅依赖抽象的 `UiAbilityLike` 接口（`can(action, subject)`），与具体 CASL 库解耦；
   - 外部调用统一从 `@base/ui` 顶级入口扁平导入。

---

## 常用核心组件与模板指南

### 1. 列表场景：`DataTable`

通过 Compound 组件模式提供开箱即用的工作台能力，内置关键字搜索、分面过滤、分页器及列显示配置：

```tsx
import { DataTable, type ColumnDef } from "@base/ui";

const columns: ColumnDef<UserItem>[] = [
  { accessorKey: "name", header: "姓名" },
  { accessorKey: "email", header: "邮箱" },
];

<DataTable.Workspace
  title="用户管理"
  description="维护租户成员名单与访问权限"
  columns={columns}
  data={userList}
  total={totalCount}
  searchField="name"
  searchPlaceholder="输入姓名搜索..."
  onCreate={() => setModalOpen(true)}
/>;
```

---

### 2. 弹窗表单场景：`FormModal`

支持 `mode="create" | "edit" | "view"` 三态合一，直接由 Zod Schema 驱动运行时 safeParse 强校验，并**内置可选的行明细表 (`DetailTable`)**。

#### A. 基础主表单场景

```tsx
import { z, FormModal, type FormFieldSchema } from "@base/ui";

const schema = z.object({
  name: z.string().min(2, "名称至少2个字符"),
  category: z.string().min(1, "请选择分类"),
});

const fields: FormFieldSchema[] = [
  { name: "name", label: "名称", type: "text", required: true },
  {
    name: "category",
    label: "分类",
    type: "select",
    options: [{ value: "A", label: "分类 A" }],
  },
];

<FormModal
  open={isOpen}
  mode="create"
  title="新建项目"
  schema={schema}
  fields={fields}
  initialValues={{ name: "", category: "" }}
  onClose={() => setIsOpen(false)}
  onSubmit={async (values) => {
    await saveItem(values);
  }}
/>;
```

#### B. 单据录入与详情场景 (开启内置明细表)

配置 `detailConfig` 即可原地开启明细表格：

- `create` / `edit` 模式：支持添加行、删除行、行内输入与实时汇总；
- `view` 模式：自动隐藏添加与操作按钮，转换为只读明细展示。

```tsx
<FormModal<OrderHeader, OrderItem>
  open={isOpen}
  mode={isView ? "view" : "create"}
  title="业务订单"
  schema={orderHeaderSchema}
  fields={headerFields}
  initialValues={headerData}
  detailConfig={{
    title: "商品明细",
    columns: itemColumns,
    onAddRow: () => ({ itemCode: "", qty: 1 }),
    minRows: 1,
  }}
  initialItems={itemsData}
  itemsSchema={orderItemSchema.array().min(1, "至少需添加一行商品明细")}
  onClose={() => setIsOpen(false)}
  onSubmit={async (data) => {
    await submitOrder(data);
  }}
/>
```

---

### 3. 基础复合组件

- **`Combobox`**：通用搜索下拉框（基于 Popover + Command），支持动态过滤、快捷清空与大容量列表；
- **`DetailTable`**：统一行明细表格组件，支持可编辑模式与纯只读模式；
- **`FormFields`**：表单字段动态排版引擎，支持 text, number, date, select, combobox, radio, switch, custom 等多种形态；
- **`ConfirmDialog`**：全局破坏性操作二次确认框，替代浏览器原生 confirm。
