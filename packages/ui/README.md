# @chenrun/ui

辰润 ERP 的工业风 UI 体系。分三层：

| 层 | 目录 | 职责 |
| ---- | ------ | ------ |
| **shadcn** | `src/components/shadcn/` | 仅 `npx shadcn@latest add` 引入（含复杂组件）；禁止手写 |
| **组件层** | `composite/`、`layout/`、`feedback/` | 业务无关组合（DataTable 零件、Auth、TagMultiSelect…） |
| **模板层** | `templates/` | 可选加速：Workspace / PageShell / DashboardShell |

## 使用约定（优先简单）

1. **能直接用 shadcn 就直接用**（Form / Table / Dialog / Select / Checkbox / Label / Card…）
2. 列表需要统一工具栏时，再用 `DataTable.Workspace`
3. 长表单 / AI 批量字段可用 `FormFields` Schema
4. 非列表页（设置 / 字典 / 树）页头 + 反馈条统一用 `PageShell`，禁止各 View 手写 h1 与 emerald/rose 横幅
5. 权限：契约 action + `ActionButton` + Server `assertAbility`（逻辑不变）

## 常用入口

```ts
import {
  // shadcn 原子
  Button, Input, Select, Checkbox, Label, Table, Dialog, Card,
  // 组件层
  DataTable, FeedbackBanner, TagMultiSelect, AuthorizedField,
  // 模板层（可选加速）
  PageShell, DashboardShell, DataTable.Workspace,
  // hooks / utils
  useSafeRouter, useListUrlNav, toast,
} from "@chenrun/ui";
```

### 分层选用指引

| 场景 | 推荐 |
| ------ | ------ |
| 简单表单 / 设置面板 | `PageShell` + shadcn `Form` 零件（Input/Select/Checkbox/Label/Card） |
| 字典 / 分类卡片 | `DictionarySectionCard`（已封装搜索过滤）或 `PageShell` + Card |
| 列表页（工具栏+筛选+分页） | `DataTable.Workspace` |
| 列表列定义派生 | `createColumnsFromSchema(schema, options)` |
| 新建/编辑/查看三态弹窗 (Schema) | `CrudFormModal`（传入 `schema={z.object(...)}` 执行 Zod 运行时拦截） |
| 权限字段三态 | `AuthorizedField` / `DataTable.AuthorizedField`（勿绕过） |
| 权限按钮 | `DataTable.ActionButton`（勿手写 can 判断散落各处） |

### Schema 驱动实战 (Zod + CrudFormModal + Table Columns)

```tsx
import { z, CrudFormModal, createColumnsFromSchema } from "@chenrun/ui";

// 1. 定义实体 Zod Schema（SSoT 唯一事实源：校验 + 字段名推导）
const customerSchema = z.object({
  customerName: z.string().min(2, "客户全称至少2个字符").describe("客户全称"),
  contactPhone: z.string().regex(/^1\d{10}$/, "手机号格式不正确").describe("联系电话"),
  creditLimit: z.number().min(0).describe("授信额度"),
});

// 2. 自动派生 Table ColumnDef（数值列自动对齐右侧，自动继承 describe 描述）
const columns = createColumnsFromSchema(customerSchema, {
  overrides: {
    creditLimit: { format: (val) => `¥${Number(val).toLocaleString()}` },
  },
  extraColumns: [{ id: "actions", header: "操作", cell: () => <Actions /> }],
});

// 3. 表单弹窗三态复用（传入 schema 自动启用 safeParse 运行时校验与原生红字拦截）
<CrudFormModal
  open={isOpen}
  mode="create" // "create" | "edit" | "view" (view 模式下自动置灰只读且隐藏提交按钮)
  schema={customerSchema}
  fields={fields}
  initialValues={record}
  onClose={() => setIsOpen(false)}
  onSubmit={async (values) => {
    await saveCustomer(values);
  }}
/>
```

## 新增 shadcn 组件

```bash
cd packages/ui
npx shadcn@latest add <component> --yes
# 如生成 @/ 别名 import，改为相对路径 ../../shadcn/xxx
# 新组件记得在 src/components/shadcn/index.ts 挂导出
```
