# 会话交接清单 (Handoff)

## 1. 特性元数据

- **Feature ID**: `ui-datatable-enterprise-framework`
- **Feature 名称**: 【UI组件体系】工业级通用列表积木框架升级与开发规范沉淀
- **状态**: 已完成 (completed)
- **前置依赖**: `foundation-day0-db-self-healing` (已达成)

## 2. 历史会话交付摘要

1. **一体化列表积木**（`packages/ui/src/components/composite/data-table/`）：
   - `DataTable.Root` 默认 `integratedCard` 白卡；列显隐状态（`visibleColumnIds/toggle/reset`）
   - `Header` / `FilterBar` / `InputGroup` / `ColumnSettings` / `FormSection` / `FormFieldGrid` / `FormBanner`
   - `Content` 支持 `showIndex` 跨页序号与列设置联动
   - `Pagination` 支持范围文案与数字页码
   - `RowActions` 默认平铺「详情/编辑」+ 折叠菜单
   - `FormModal` / `DetailDrawer` 对齐参考高保真居中弹窗
2. **技能沉淀**：`.agents/skills/erp-feature-dev/references/5-ui-components.md` DataTable 手册
3. **服务端分页闭环**：Customer 列表 RSC + URL 受控分页

## 3. 本会话追加交付（shadcn 外壳收敛）

1. **官方 sidebar 接入**：`packages/ui/src/components/shadcn/sidebar.tsx` + `hooks/use-mobile.ts`
2. **业务 Sidebar**（`layout/Sidebar.tsx`）：
   - 展开态：官方 `Collapsible` + `SidebarMenuSub`
   - 折叠态：官方 `HoverCard` 悬浮子菜单（普通 `Link`，不用 `SidebarMenuSubButton` 以免 icon 态被 hidden）
   - 折叠时摊平为单条 `SidebarMenu`，间距均匀
3. **TopHeader**：`Avatar`/`Badge`/`SidebarTrigger`，背景 `bg-sidebar` 与侧栏同色
4. **ThemeToggle** → `ToggleGroup`；**DashboardShell** → `SidebarProvider` + `SidebarInset`
5. **shadcn skill 范式修复**：InputGroup 搜索、Empty 空态、FieldGroup 表单、SelectGroup、DropdownMenuGroup、`data-icon`、`gap-*`
6. **CSS**：tenant/control `globals.css` 补齐 `--sidebar-*` 变量

## 4. 下一会话启动指引

1. 业务页面按 `references/5-ui-components.md` §2 范式装配 DataTable。
2. 侧栏折叠悬浮层是官方 HoverCard 组合，非 Sidebar 内置 API；若要完全贴官方可退回纯 Tooltip 或 `collapsible="offcanvas"`。
3. 顶栏/侧栏统一 `sidebar-*` token；内容区保持 `bg-background`。
4. 验证：`cd packages/ui && pnpm check && pnpm test`（34/34）。
