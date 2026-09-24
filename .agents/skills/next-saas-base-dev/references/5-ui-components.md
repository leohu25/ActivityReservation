# 5. UI 交互基建与列表开发手册 (UI Primitives & DataTable Guide)

> **定位**：本文档专门规范 `@base/ui` 的 UI 资产模型、一体化 `DataTable` 标准列表开发、受控树形组件与全局交互反馈。  
> 关于全屏单据与表单形态开发规范，由根地图索引调度独立单据指南。

---

## 一、 设计系统资产模型 (Monorepo Design System)

全系统严格遵循 **shadcn UI 官方最佳实践**，落实“代码所有权（Code Ownership）”，消灭冗余包装：

| 层级与模块 | 目录位置 | 典型代表 | 职责与规范 |
| :--- | :--- | :--- | :--- |
| **1. 官方原子基石 (Primitives)** | `packages/base/ui/src/components/ui/` | `button`, `input`, `dialog`, `badge`, `table`, `field`, `sonner` 等 | Base UI / shadcn 官方原语基石，源码归项目所有，允许通过 CVA 扩充变体。 |
| **2. 高阶表格资产 (Data Table)** | `packages/base/ui/src/components/data-table/` | `DataTable`, `DataTableRoot`, `DataTableRowActions`, `DetailTable` 等 | 一体化业务表格工作区，负责搜索、分面过滤、分页、列配置、Action 权限接管与 CSV 导出。 |
| **3. 权限基础设施 (Auth Guards)** | `packages/base/ui/src/components/auth/` | `AuthGuard`, `AuthField`, `UiAbilityProvider` 等 | 注入 CASL 强类型权限判定、三态权限控制与单据只读穿透守卫。 |
| **4. 树形工作台 (Tree)** | `packages/base/ui/src/components/tree/` | `TreeFilter`, `DataTree` 等 | 组织架构、层级字典分类维护、左树右表过滤与同级排序。 |
| **5. 应用布局与外壳 (Layout)** | `packages/base/ui/src/components/layout/` | `DashboardShell`, `DocumentShell`, `DocumentHeader`, `TabBar` 等 | 双端系统级主框架外壳与复杂单据工作台外壳。 |
| **6. 交互反馈套件 (Feedback)** | `packages/base/ui/src/components/feedback/` | `ConfirmDialog`, `EmptyState`, `toast` 等 | 全局统一反馈事实源、破坏性操作二次确认、空状态引导。 |

---

## 二、 核心行为红线

1. **遵循 shadcn 官方规范 (No Raw Divs/Controls)**：杜绝手写裸 `div` 布局或原生非受控控件（如原生 `input type="date"`）；
2. **原子层就地修改，禁止套壳伪封装**：新增变体直接修改 `components/ui/` 源码中的 `cva`，严禁包同名套壳；
3. **写操作按钮严禁裸奔**：标准列表使用 `DataTable`（传入 `subject` 自动接管 `create`、`export` 与 `DataTableRowActions`）；自由定制页面必须由 `<AuthGuard action="..." subject="...">` 包裹，严禁渲染无守卫的裸写按钮；
4. **单次模态确认**：破坏性操作统一由 `ConfirmDialog` 提示一次，严禁使用浏览器原生 `window.confirm`；
5. **消息通知右上角 Toast 弹出**：成功、警告与错误提示统一使用右上角 `toast`（基于 `sonner`）；
6. **零全页强刷**：严禁 `window.location.reload()`；数据变更由 Server Action 内 `revalidatePath` 自愈，客户端不调用 `router.refresh()`；
7. **服务端分页（生产必选）**：`DataTable` 默认不做客户端切片，服务端分页驱动。

---

## 三、 标准 DataTable 列表开发范式

### 1. 列表状态 Hook 与一体化容器

```tsx
import { DataTable, useListSearch } from "@base/ui";
import { resourceSearchParams, ResourceSubject } from "../contract";
import { columns } from "./columns";
import type { ResourceListItem, ResourcePageOptions } from "../types";

export interface ResourceViewProps {
  readonly data: readonly ResourceListItem[];
  readonly total: number;
  readonly options: ResourcePageOptions;
}

export function ResourceView({ data, total, options }: ResourceViewProps) {
  // 1. 列表查询与分页状态全自动绑定
  const list = useListSearch(resourceSearchParams);

  return (
    <DataTable
      {...list.dataTableProps}
      data={data}
      columns={columns}
      total={total}
      subject={ResourceSubject}
      title="资源档案列表"
      description="维护系统主数据条目"
      keywordPlaceholder="搜索编码、名称..."
      onCreate={() => list.router.push("/resource/new")}
      onExport={() => handleExportCsv(data)}
      statusOptions={[
        { value: "0", label: "正常在用" },
        { value: "1", label: "已停用" },
      ]}
      statusValue={String(list.params.status ?? "")}
      onStatusChange={(v) => list.patch({ status: v || "" })}
      filterExtra={<CategoryFilterSelect options={options.categories} />}
    />
  );
}
```

### 2. 列表列配置 (`columns.tsx`) 规范

列定义必须独立抽离至同级 `columns.tsx` 文件，必须 100% 使用强类型 `ColumnDef<TData>`：

```tsx
import type { ColumnDef } from "@base/ui";
import { Badge, DataTableRowActions } from "@base/ui";
import { ResourceField } from "../contract";
import type { ResourceListItem } from "../types";

export const columns: ColumnDef<ResourceListItem>[] = [
  {
    id: "code",
    field: ResourceField.CODE,
    header: "编码",
    cell: ({ row }) => <span className="font-mono">{row.original.code}</span>,
  },
  {
    id: "name",
    field: ResourceField.NAME,
    header: "名称",
    cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
  },
  {
    id: "status",
    field: ResourceField.STATUS,
    header: "状态",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "ACTIVE" ? "success" : "secondary"}>
        {row.original.status === "ACTIVE" ? "正常" : "已停用"}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => (
      <DataTableRowActions
        row={row.original}
        onEdit={(item) => navigateToEdit(item.id)}
        onDelete={(item) => handleDelete(item.id)}
        deleteConfirmTitle="确认删除该资源记录？"
        deleteConfirmDescription="删除后数据将移入回收站，不可恢复。"
      />
    ),
  },
];
```

---

## 四、 左树右表导航组件 (`TreeFilter`)

在“左侧树形筛选 + 右侧数据列表”场景中（如部门员工、分类物料），统一使用 `@base/ui` 的 `TreeFilter`：

```tsx
import { TreeFilter, type TreeNode } from "@base/ui";

<TreeFilter
  title="部门组织架构"
  allLabel="全部部门"
  totalCount={departments.length}
  nodes={departmentTreeNodes}
  selectedId={selectedDeptId}
  onSelect={(id) => setSelectedDeptId(id)}
  cascadeToggle={{
    checked: includeChildren,
    onChange: setIncludeChildren,
    label: "包含所有下级子部门",
  }}
  searchPlaceholder="搜索部门名称或编码..."
/>
```
