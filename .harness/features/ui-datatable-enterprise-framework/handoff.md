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

## 3. 本会话追加交付（shadcn 外壳收敛、架构文档治理与 AI Slop 清理）

1. **官方 sidebar 接入**：`packages/ui/src/components/shadcn/sidebar.tsx` + `hooks/use-mobile.ts`
2. **业务 Sidebar**（`layout/Sidebar.tsx`）：
   - 展开态：官方 `Collapsible` + `SidebarMenuSub`
   - 折叠态：官方 `HoverCard` 悬浮子菜单（普通 `Link`，不用 `SidebarMenuSubButton` 以免 icon 态被 hidden）
   - 折叠时摊平为单条 `SidebarMenu`，间距均匀
3. **TopHeader**：`Avatar`/`Badge`/`SidebarTrigger`，背景 `bg-sidebar` 与侧栏同色
4. **ThemeToggle** → `ToggleGroup`；**DashboardShell** → `SidebarProvider` + `SidebarInset`
5. **shadcn skill 范式修复**：InputGroup 搜索、Empty 空态、FieldGroup 表单、SelectGroup、DropdownMenuGroup、`data-icon`、`gap-*`
6. **CSS**：tenant/control `globals.css` 补齐 `--sidebar-*` 变量
7. **架构与权限文档体系全面梳理**：
   - `docs/ARCHITECTURE.md` 重构为高维概述与全局全景索引
   - 4 篇专项技术解析文档建档（`permissions/permission-architecture-deep-dive.md`、`architecture/saas-multitenant-architecture.md`、`architecture/database-migration-engine.md`、`architecture/fdd-vertical-slice-architecture.md`）
   - `docs/` 分门别类治理（`permissions/`、`architecture/`、`deployment/`、`collaboration/`、`archive/`）并清理过时草案、归档早期 PRD
   - 对齐 `AGENTS.md` 地图索引，Harness 协同 100% 绿色自洽
8. **UI/页面 AI Slop 清理**：
   - 表单弹窗 `auditHint` 默认置 `null`，移除无意义的机械审计文案；
   - 角色权限管理页移除“RBAC 矩阵树驱动”等技术宣传徽标，改写非业务化的架构口号；
   - 采购订单中心、工作台及员工调动弹窗移除底层下推调试面板及“自驱动重算/最高宪法”等生硬描述。

## 4. 下一会话启动指引

1. 业务页面按 `references/5-ui-components.md` §2 范式装配 DataTable。
2. 架构设计与权限机制统一查阅 `docs/ARCHITECTURE.md` 及各子目录专项文档。
3. 顶栏/侧栏统一 `sidebar-*` token；内容区保持 `bg-background`。
4. 验证：`cd packages/ui && pnpm check && pnpm test`（34/34）；`./scripts/status.sh`。
