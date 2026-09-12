# ui-datatable-enterprise-framework 上下文

## 目标（一句话）

`@base/ui` 复合 DataTable 积木：一体化白卡工作台（Header/FilterBar/Content/Pagination），shadcn 驱动、与业务解耦、Fail-Closed 权限贯通。

## 状态

`completed`（见 `feature_list.json`）。实现与 API 以代码为准：`packages/ui/src/components/composite/data-table/index.ts`。

## 锁定决策（禁止回退）

1. **服务端分页默认**：`clientSidePagination` 默认 `false`；`data` 只放当前页，`total` 来自 API `count`。生产列表禁止客户端切片。
2. **`integratedCard` 默认开**：工作区裹 `bg-card border shadow-xs` 白卡；内嵌场景才关。
3. **纯 shadcn 原子**：不引入第三方表格库；样式走 design token。
4. **权限 Fail-Closed**：`ActionButton`/`RowActions`/`AuthField` 无权即隐藏或置灰；字段 `HIDDEN` 物理剥离。
5. **二次确认只在 Dialog 一次**；通知用右上角 Toast；禁 `window.location.reload()`。

## 实际零件面（以 `DataTable.*` 命名空间为准）

`Workspace`（整页模板，默认全开）、`Root` / `Header` / `Toolbar` / `FilterBar` / `InputGroup` / `ColumnSettings` / `Content`（`showIndex`/`selectable`）/ `Pagination` / `RowActions` / `BatchBar` / `FormModal` / `DetailDrawer` / `Actions` / `AuthField`。

新列表页**优先 `DataTable.Workspace`**，特殊布局再原子拼装。

## 外壳附带交付（同特性 spillover）

- 官方 `sidebar` + `use-mobile`；业务侧栏：展开 Collapsible、折叠 HoverCard 摊平菜单
- `TopHeader` Avatar/Badge/SidebarTrigger，背景 `bg-sidebar`；双端 `--sidebar-*` token
- `ThemeToggle`→ToggleGroup；`DashboardShell`→SidebarProvider+Inset

## 完整文档指针（勿在此重复）

| 内容 | 位置 |
| ------ | ------ |
| 装配范式 / 红线 / 服务端分页示例 | `.agents/skills/erp-feature-dev/references/5-ui-components.md` |
| 权限与字段三态 | `references/7-casl-ability-provider.md` |
| UI 工业风 token | `.harness/context/design-system.md` |
| 源码与命名空间 | `packages/ui/src/components/composite/data-table/` |
