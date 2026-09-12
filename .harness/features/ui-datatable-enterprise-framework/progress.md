# ui-datatable-enterprise-framework 进度追踪

## 多智能体拆分与推进状态

- [x] **Lane 1 (UI Framework 一体化积木研发)**: 扩展 `@chenrun/ui` 复合积木零件与标准 shadcn 驱动样式
  - [x] `DataTable.Root`: 支持 `integratedCard` 模式（默认一体化白卡容器 `bg-card border shadow-xs rounded-xl p-5`；按用户要求不引入顶部色带）
  - [x] `DataTable.Header`: 工作台标题栏积木（小标分类、标题竖条、说明文案、actions 插槽）
  - [x] `DataTableContext`: 注入 `visibleColumnIds` 与列切换/重置方法
  - [x] `DataTable.ColumnSettings`: 基于 shadcn `DropdownMenu` + `Checkbox` 动态列显隐面板（lockVisible 锁定 + CASL HIDDEN 剔除）
  - [x] `DataTable.FilterBar` + `DataTable.InputGroup`: 组合筛选栏（查询/重置/高级筛选 + `[标签|控件]` 输入组）
  - [x] `DataTable.Content`: 紧凑排版 + `showIndex` 跨页自增序号列 + 列设置联动过滤
  - [x] `DataTable.Pagination`: `共 N 条 显示第 X-Y 条` + 紧凑数字页码器 + `条/页`
  - [x] `DataTable.ActionButton` / `DataTableRowActions`: Fail-Closed 权限、hidden/disabled-tooltip、行内平铺详情/编辑 + 折叠菜单
  - [x] `DataTable.FormModal` / `DataTable.DetailDrawer`: 对齐参考高保真居中弹窗（品牌徽标 + 审计提示底栏；按用户要求不引入步骤条）
  - [x] `DataTable.FormSection` / `FormFieldGrid` / `FormBanner`: 编辑弹窗分组与字段网格
- [x] **Lane 2 (Testing & Quality Guard 质量守卫)**: 测试用例覆盖与门禁自检
  - [x] 覆盖 Root/Header/FilterBar/showIndex/Pagination/ColumnSettings 解析/权限按钮/行操作/详情与编辑弹窗
  - [x] `@chenrun/ui` 类型检查 0 错误、单测 27/27 通过
  - [x] 全工作区 `pnpm -r check` 13/13 包通过
- [x] **Lane 3 (Skill Documentation 经验沉淀)**: 沉淀开发手册至 `.agents/skills/erp-feature-dev/`
  - [x] 一体化卡片容器原则与标准装配范式
  - [x] 自定义操作按钮权限（action/subject/Fail-Closed/未授权策略）
  - [x] 字段三态在列表列与表单控件中的生效机理
  - [x] 详情居中弹窗 + 编辑弹窗可复制模板

## 追加：服务端分页闭环（用户明确要求）

- [x] `DataTable.Root` 默认禁止客户端切片；`clientSidePagination` 仅演示用
- [x] `CustomerService.listCustomers` 改为 `count + skip/take` 返回 `{ items, total, page, pageSize }`
- [x] `listCustomersAction` / `customers/page.tsx` 接入 searchParams 受控分页
- [x] `CustomerView` 翻页与筛选经 URL 同步，RSC 重新拉取当前页

## 追加：shadcn 外壳与范式收敛（本会话）

- [x] 安装官方 `sidebar` + `use-mobile`；补齐 tenant/control 双端 `--sidebar-*` CSS token
- [x] 业务 `Sidebar` 基于官方 Sidebar/Collapsible/HoverCard 重写：展开态 Collapsible，折叠态 HoverCard 悬浮子菜单（普通 Link，规避 icon 态 `hidden`）
- [x] 折叠态摊平为单条连续菜单，消除多 `SidebarGroup` padding 叠距
- [x] `TopHeader` 改 Avatar+Badge+SidebarTrigger，色 token 对齐 `bg-sidebar`
- [x] `ThemeToggle` 改 ToggleGroup；`DashboardShell` 改 SidebarProvider+SidebarInset
- [x] DataTable 白卡/表格外框改 Card；Select 包 SelectGroup；Dropdown 包 DropdownMenuGroup
- [x] DictionarySectionCard 搜索改 InputGroup、空态改 Empty；CustomerView 表单改 FieldGroup/Field
- [x] Button 图标统一 `data-icon`；`space-y-*` 收敛为 `flex gap-*`

## 追加：架构与权限全链路文档体系重构（本会话）

- [x] 基于子智能体并发调研权限全链路（前端门禁/字段三态/后端四层模型/SQL下推/字段剥离）与整体架构规划
- [x] 架构总纲白皮书重构：`docs/ARCHITECTURE.md` 定位为高维概述与全局索引中枢
- [x] 单独建立 4 篇专项深度技术文档：
  - `docs/permissions/permission-architecture-deep-dive.md` (权限全链路)
  - `docs/architecture/saas-multitenant-architecture.md` (多租户SaaS架构)
  - `docs/architecture/database-migration-engine.md` (数据库演进引擎)
  - `docs/architecture/fdd-vertical-slice-architecture.md` (垂直切片架构)
- [x] `docs/` 目录结构化分类与治理：划分 `permissions/`、`architecture/`、`deployment/`、`collaboration/`、`archive/`
- [x] 清理过时草案（删除 3 篇临时草案），归档 4 篇早期 PRD 需求规格至 `docs/archive/`
- [x] 同步更新 `AGENTS.md` 索引地图与全量 Markdown 跳转链接，保持 Harness 协同 100% 确定性

## 追加：Tenant-Admin 数据契约补齐与 CASL 细粒度权限闭环（本会话）

- [x] **数据契约补齐 (`src/contracts/`)**：
  - 新增 department, position, employee, role, company-settings, general-settings, security-settings, audit 契约文件与 index 聚合；
  - 彻底对齐 README 目录树，manifest 切换为从 contracts 契约派生，消除手写重复定义与魔法字符串；
  - 导出契约常量至包主入口。
- [x] **后端接口细粒度权限校验 (`actions.ts` & `server/session.ts`)**：
  - session 中通过 CaslAbilityFactory 注入当前租户用户的 CASL `ability`，建立 `assertTenantAdminAbility` 严格守卫；
  - 全量 Server Actions 接入 `defineServerAction`，所有写操作注入 `(action, subject)` 细粒度授权校验；
  - `listEmployeesAction` 接入 `pickReadableFields` 服务端敏感字段物理剥离。
- [x] **前端视图与 CASL 权限联动 (`RolePermissionManager.tsx`)**：
  - 接入官方客户端范式 `useSubjectCan(RoleManagementSubject)`；
  - 无 `update` 权限时自动隐藏新建角色、保存权限、载入模板、删除角色按钮，并将矩阵表单交互设为只读置灰，解决“界面显示但保存拦截报错”的脱节现象。

## 验证证据

- `packages/ui`: `tsc --noEmit` PASS，`tsx --test` 34/34 PASS
- `packages/features/customer-center`: check PASS
- `packages/features/tenant-admin`: check PASS，`tsx --test` 16/16 PASS
- 全仓 `pnpm -r check`: 13 个包 0 错误
- 全仓 `pnpm -r test`: 全部 PASS
- `node scripts/check-boundary.mjs`: 边界 100% 合规

