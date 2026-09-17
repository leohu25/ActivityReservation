# @base/ui — 通用企业级 SaaS UI 组件系统

现代化多租户 SaaS 基础设施的共享 UI 资产库。本模块保持**设计与技术完全中立**，不与特定业务或单一行业视觉绑定，作为各垂直切片与应用平面的统一界面基础设施。

代码架构严格遵循 **shadcn UI 官方最佳实践（Monorepo Design System 标准拓扑）**，落实“代码所有权（Code Ownership）”，消灭多余的伪包装层与深层嵌套，形成扁平、高内聚、语义化的设计系统架构：

```text
packages/base/ui/
├── components.json              # 官方标准别名配置 ("ui": "@/components/ui")
├── package.json                 # 依赖版本锁死 (@base-ui/react 1.8.0, sonner 2.0.8 等)
├── src/
│   ├── components/
│   │   ├── ui/                  # 【官方原子 Primitives】(Base UI 无头原语与 CVA 样式基石)
│   │   │   ├── button.tsx       # 按钮基石
│   │   │   ├── badge.tsx        # 内置 default/secondary/destructive/success/warning/process 与 sm/lg
│   │   │   ├── select.tsx       # 内置中文 label 自动递归解析与回显
│   │   │   ├── sonner.tsx       # 统一 Toast 呈现容器
│   │   │   ├── field.tsx        # 官方表单基石 (FieldGroup + Field + FieldLabel)
│   │   │   ├── dialog.tsx
│   │   │   └── ... (共 62 个纯净原子组件，由 Git 跟踪)
│   │   │
│   │   ├── data-table/          # 【高阶数据表格资产】(全功能数据列表工作台)
│   │   │   ├── DataTable.tsx    # 全系统标准列表模板 (搜索、高级筛选、分页、列配置、权限接管)
│   │   │   ├── DataTableRoot.tsx
│   │   │   ├── DataTableToolbar.tsx
│   │   │   ├── DataTableFilterBar.tsx
│   │   │   ├── DataTablePagination.tsx
│   │   │   └── ...
│   │   │
│   │   ├── auth/                # 【权限基础设施】(与 CASL 四层权限闭环深度结合)
│   │   │   ├── AuthGuard.tsx    # 声明式权限门禁
│   │   │   ├── ActionButton.tsx # 自动感知 Subject 与动作的受控权限按钮
│   │   │   └── ui-ability-context.tsx
│   │   │
│   │   ├── form/                # 【高阶表单项与弹窗】(Zod 驱动的三态表单与交互控件)
│   │   │   ├── FormModal.tsx    # 全功能表单弹窗模板 (三态切换、Zod 强校验、内置明细表)
│   │   │   ├── Combobox.tsx     # 单属性配置的高阶下拉组合框
│   │   │   ├── DatePicker.tsx   # 工业风日期选择器
│   │   │   ├── FormDrawer.tsx   # 侧滑表单抽屉
│   │   │   └── FormLayout.tsx
│   │   │
│   │   ├── tree/                # 【树形资产】(多级层级结构与分类维护)
│   │   │   ├── HierarchyTree.tsx
│   │   │   ├── DirectoryTreeFilter.tsx
│   │   │   └── DataTree.tsx
│   │   │
│   │   ├── layout/              # 【应用骨架与导航】(Shell 与系统级布局套件)
│   │   │   ├── AppSidebar.tsx   # 业务导航侧边栏
│   │   │   ├── TabBar.tsx       # 现代 ERP 多标签页卡片导航
│   │   │   ├── TopHeader.tsx    # 顶部导航栏
│   │   │   ├── DashboardShell.tsx
│   │   │   ├── PageShell.tsx
│   │   │   └── MasterDetailShell.tsx
│   │   │
│   │   ├── feedback/            # 【交互反馈】
│   │   │   ├── ConfirmDialog.tsx # 二次破坏性确认弹窗
│   │   │   ├── EmptyState.tsx    # 统一空状态
│   │   │   └── Toast.tsx         # 统一导出 sonner
│   │   │
│   │   └── icon/                # 【图标资产】IconPicker, DynamicNavIcon
│   │
│   ├── hooks/                   # 通用 Hook (use-mobile 等)
│   ├── lib/                     # 工具库 (cn, use-data-table-state, use-safe-router 等)
│   └── index.ts                 # 统一导出入口（无同名遮蔽、无重复覆盖，干净透明）
```

---

## 核心设计与使用原则

1. **原子层可变更性与代码所有权 (Code Ownership)**：
   - 原子组件存放于 `src/components/ui/`，其源码归项目所有，由 **Git 正常跟踪版本历史**；
   - **支持就地添加 CVA 变体**：需要新增语义形态或尺寸时，直接在组件源码中的 `cva()` 扩展 `variants` 和 `sizes`，严禁为了加几个类名就在外面套一层同名伪包装壳；
   - **支持就地修补缺陷**：遇到上游/基底缺陷（如 Base UI 中文 label 回显），直接在原子源码内修正；
   - **UI 开发必须对齐官方 Skill**：在进行任何 UI 开发、页面交互实现、组件优化或重构时，**必须参考并遵循 `.agents/skills/shadcn/` 官方最佳范式 Skill**。

2. **组件定制的四层最佳实践**（由轻到重）：
   - **Level 1（全局主题）**：修改 CSS Variables（颜色、圆角、间隙）；
   - **Level 2（形态变体）**：直接在组件源码内编辑 `cva()` 添加 Variant；
   - **Level 3（单次调用微调）**：在页面调用处传 `className`，由内置的 `cn()`（`tailwind-merge`）保证生效；
   - **Level 4（高阶编排）**：仅在组装跨原子复合中台资产（如 `DataTable`, `ConfirmDialog`, `FormModal`）时才创建复合组件。

3. **视觉风格与组件逻辑完全解耦（Design Tokens 驱动）**：
   - `@base/ui` 组件内部**绝对零硬编码具体色值**，100% 使用语义 Token（如 `bg-primary`, `text-foreground`, `border-border`）；
   - 具体的视觉调色（如工业灰蓝、深色主题）完全通过外部 CSS 变量由消费端（`apps/tenant`、`apps/control` 或租户动态配置）注入，实现一套代码零成本换肤。

4. **单事实源与干净导出 (Single Source of Truth)**：
   - 全局通知统一事实源：`sonner`，彻底消灭废弃的原生 `toast.tsx` 与 `baseToast`；
   - 顶层出口 `packages/base/ui/src/index.ts` 每个组件语义明确、唯一，彻底杜绝同名覆盖与导出遮蔽。

---

## 常用核心组件与模板指南

### 1. 列表场景：`DataTable`

通过一体化卡片容器提供开箱即用的工作台能力，内置关键字搜索、分面过滤、分页器及列显示配置：

```tsx
import { DataTable, type ColumnDef } from "@base/ui";

const columns: ColumnDef<UserItem>[] = [
  { accessorKey: "name", header: "姓名" },
  { accessorKey: "email", header: "邮箱" },
];

<DataTable
  title="用户管理"
  description="维护租户成员名单与访问权限"
  columns={columns}
  data={userList}
  total={totalCount}
  keywordPlaceholder="输入姓名搜索..."
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

### 3. 高阶中台组件

- **`Combobox`**：通用搜索下拉框（基于 Base UI Combobox），支持动态过滤、快捷清空与大容量列表；
- **`DetailTable`**：统一行明细表格组件，支持可编辑模式与纯只读模式；
- **`FormFields`**：表单字段动态排版引擎，支持 text, number, date, select, combobox, radio, switch, custom 等多种形态；
- **`ConfirmDialog`**：全局破坏性操作二次确认框，替代浏览器原生 confirm；
- **`toast`**：基于 `sonner` 的全局通知，支持 `toast.success`、`toast.error` 与 `toast.promise`。
