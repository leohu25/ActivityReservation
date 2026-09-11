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

## 验证证据

- `packages/ui`: `tsc --noEmit` PASS，`tsx --test` 34/34 PASS
- `packages/features/customer-center`: check PASS
- `apps/tenant`: check PASS
