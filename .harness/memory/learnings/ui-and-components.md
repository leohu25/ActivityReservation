# UI 工业风组件与交互避坑指南 (UI & Components Learnings)

本模块记录在 `@base/ui` (shadcn) 原子与复合组件、DataTable、TabBar 多标签页、暗色模式、响应式与交互闭环中的工程避坑经验。

---

## 1. 公共 UI 模块与 shadcn 官方组件安装规范 (Monorepo SOP)

- **痛点**：手写私有 UI 伪冒 shadcn 原生规范，不仅颜色硬编码（如 `slate-*`），且绕过了 `--muted`、`--border` 等设计令牌，导致主题与暗色模式切换失效；在 Monorepo 随意运行交互式 CLI 容易卡死终端或落入错误路径。
- **解法与固化规范**：
  - **基础原子组件标准**：`packages/base/ui` 原子组件必须 100% 遵循 `shadcn/ui (new-york)` 原生实现，使用 React 19 标准签名与 CSS 变量设计令牌；
  - **安装新组件走统一命令**：
    ```bash
    pnpm ui:add <component_name>
    ```
  - **标准化导出闭环**：CLI 添加后在 `packages/base/ui/src/index.ts` 中显式追加导出，使全仓业务应用直接从 `@base/ui` 导入；检查 `package.json` 消除幽灵依赖。

---

## 2. 严禁 UI 组件与 Next.js 假解耦！对齐 App Router 嵌套布局与局部渲染官方范式

- **痛点**：点击侧边栏或 TabBar 时整页白屏刷新，展开手风琴全部收缩重置；根因是组件为了假解耦默认退化为原生 `<a>`，导致硬导航 (Hard Navigation)，整篇 HTML 和 JS 内存堆被销毁重建。
- **Next.js 官方思维模型与解法**：
  - **Hard Navigation vs Soft Navigation**：原生 `<a>` 必然导致硬导航；只有 `next/link` 才能触发 App Router 软导航与路由缓存；
  - **零冗余胶水层**：禁止在业务层制造空壳桥接组件；`@base/ui` 显式依赖 `next`，直接 `import Link from "next/link"` 与 `import { usePathname } from "next/navigation"`；
  - **单测纯函数支持**：为 Node 环境 `renderToString` 单测保留可选 `currentPath` 覆盖入参，兼顾官方体验与纯函数式测试；
  - **局部骨架标配**：路由组配置 `loading.tsx`，在 RSC 增量取数期间提供即时骨架屏，杜绝页面跳转卡顿感。

---

## 3. 企业级数据列表积木体系 (Compound DataTable Pattern)

- **痛点**：传统几千行“大黑盒”表格组件 props 膨胀、内部 if-else 爆炸，无法插拔；基础原子组件平铺混杂业务逻辑，破坏了设计令牌。
- **解法与架构规范**：
  1. **原子层与复合层严格分层**：
     - `components/ui/`：100% 官方 shadcn 原子基石；
     - `components/feedback/`：通用二次确认（`ConfirmDialog`）、空状态（`EmptyState`）；
     - `components/data-table/`：基于原子组件拼装的企业级复合数据表格体系；
  2. **自由插拔与全功能 CRUD 预置（Compound API）**：
     - 像搭积木一样组合：`<DataTable.Root>`、`<DataTable.Toolbar>`、`<DataTable.Search>`、`<DataTable.FilterDrawer>`、`<DataTable.Actions>`、`<DataTable.Content>`、`<DataTable.Pagination>`；
     - **详情与编辑弹窗插槽**：预置高灵活度的 `<DataTable.DetailDrawer>` 与 `<DataTable.FormModal>`，支持预置渲染与自定义插槽；
     - **行级与顶部操作扩展插槽**：`<DataTableRowActions>` 内置查看、编辑、删除（带二次防误删确认），支持 `extraActions`。

---

## 4. 业务流程与拓扑界面的“交互闭环”原则 (UI/UX Functional Completeness)

- **痛点**：后端数据库表与计算引擎支持完整工序与物料流转，但前端只做了一个空壳子弹窗，没有提供录入工序和物料损耗率的入口；导致漂亮的 DAG 流程图永远只能展示“暂未配置工序流程”，形成严重业务断层。
- **解法与铁律**：
  1. **拒绝假大空 UI**：设计了状态机、指标卡或拓扑图，必须保证系统有对应的交互编排载体（如 `BomFlowEditorModal`）供用户完整维护底层数据；
  2. **时序图严格 DAG 有向无环**：流转图必须清晰表达时序流转：投入物料 $\to$ 加工工序 $\to$ 产出中间品 $\to$ 最终成品；
  3. **数据幂等与容错自愈**：编排器支持快速选择预设模板时，Action 具备防击穿逻辑：若数据库无历史主数据则自动建档补充，防止外键约束崩溃。

---

## 5. 暗色模式 (Dark Mode) 语义设计令牌与权限门禁防错规范

- **痛点**：
  1. 暗色模式下由于手写了 `bg-slate-50`、`border-slate-200`，泛出突兀刺眼的白块，文字对比度严重失衡；
  2. 页面按钮脱离 DataTable 且未包裹 `<AuthGuard>`，普通成员能看到新建按钮，点击后被后端拦截报 403，体验极其粗糙。
- **解法与铁律**：
  1. **100% 杜绝硬编码浅色/灰色**：严禁写 `bg-slate-50`，统一使用 `bg-muted/30`、`border-border`、`bg-card`、`bg-background`；状态小块使用语义透明度阶梯（如 `bg-emerald-500/10 text-emerald-700 dark:text-emerald-400`）；
  2. **双轨权限消费法则**：
     - 标准列表：必须传入 `subject={XxxSubject}`，工具栏和行操作自动继承并安全隐藏无权动作；
     - 表格外自定义按钮/表单：必须强制使用 `<AuthGuard subject={XxxSubject} action={...}>` 进行包裹；
     - 自动化单测断言：每个受控页面编写测试，分别注入“只读快照”与“全权快照”，断言无权入口 100% 物理剥离。

---

## 6. 标准列表 CRUD、DataTableRowActions 详情避坑与多实体页面布局铁律

- **痛点**：
  1. 行操作「详情」置灰 Disabled 显示“未配置操作回调”，给用户带来“系统坏了”的困惑；
  2. 脱离 `useListSearch` 和 `DataTable` 手写查询按钮，破坏回车即搜与 URL 状态契约；
  3. 列表缺少分页；多实体聚合页采用 `grid-cols-2` 左右并排，导致表格换行挤压恶劣。
- **解法与行为铁律**：
  1. **按钮由模板组件托管**：视图一律调用 `const list = useListSearch(params)`，并展开传给 `DataTable`；查询、重置、刷新、导出、新增由组件自动生成并受控于 CASL；
  2. **`DataTableRowActions` 详情显隐铁律**：
     - 需要详情时：传入 `onView` 且配套 `FormModal` 支持 `mode: "view"`；
     - 不需要详情时：必须显式传入 `hideView={true}`，严禁漏传导致灰色不可用按钮暴露；
  3. **标准分页绝不可缺失**：所有列表由 `DataTablePagination` 接管，必须传入有效 `total`；
  4. **多实体页面布局标准**：多实体/多字典页面**严禁左右并排**，必须在顶部横向平铺 Tab 导航，切换 Tab 时独占 100% 全宽标准视图。
