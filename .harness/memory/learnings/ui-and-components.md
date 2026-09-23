# UI 工业风组件与交互避坑指南 (UI & Components Learnings)

本模块记录在 `@base/ui` (shadcn) 原子与复合组件、DataTable、TabBar 多标签页、暗色模式、响应式与交互闭环中的工程避坑经验。

---

## 1. 公共 UI 模块与 shadcn 官方组件安装规范 (Monorepo SOP)

- **痛点**：手写私有 UI 伪冒 shadcn 原生规范，不仅颜色硬编码（如 `slate-*`），且绕过了 `--muted`、`--border` 等设计令牌，导致主题与暗色模式切换失效；在 Monorepo 随意运行交互式 CLI 容易卡死终端或落入错误路径。
- **解法与固化规范**：
  - **组件源码所有权属于项目本身**：`packages/base/ui/src/components/ui/` 下的原子组件源码 100% 归本工程所有并由 Git 跟踪。**允许且推崇就地演进与功能增强**（如直接在 `select.tsx` 中增强对 `options` 开箱即用支持），杜绝生搬硬套“绝对不可修改官方代码”的教条主义，坚决消灭多余别扭的“伪包装层”；
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

---

## 7. React 状态更新器纯函数铁律与跨组件路由调度冲突 (setState-in-render 避坑)

- **痛点**：
  - 在多标签页（`TabBar`）、模态窗关闭或全局事件中处理标签关闭与跳转时，开发者容易在 `setTabs((prev) => { ... router?.push(targetRoute); })` 的状态更新回调内部直接调用 `router.push()`；
  - 在 React 19 并发模式与 Next.js Turbopack 运行时中，直接触发致命控制台红字：
    ```text
    Cannot update a component (`Router`) while rendering a different component (`TabBar`).
    To locate the bad setState() call inside `TabBar`, follow the stack trace...
    ```
- **核心根因**：
  - React 的 `setState((prev) => next)` 状态计算函数必须是**绝对纯函数 (Pure Function)**，严禁产生外部可观测的命令式副作用；
  - `router.push()` 会立即修改 Next.js `Router` 上下文内部的当前导航状态，导致在渲染一个组件的同时强行并发触发另一个组件的 `setState`，破坏了 React 调度时序。
- **解法与标准行为铁律**：
  1. **状态计算与副作用彻底解耦**：
     - `setState` 回调内部**只负责纯数据计算与持久化**（如计算过滤后的 tabs 数组），严禁放置任何 `router.push`、`toast`、API 请求等副作用；
  2. **路由跳转使用微任务 (`queueMicrotask`) 调度**：
     - 在状态计算外部通过局部变量提取目标路径，并将路由跳转推入微任务队列，等待当前组件渲染周期的微任务队列时钟到达后再执行：
       ```ts
       // 正确范式：解耦并微任务调度
       let nextRoute: string | null = null;
       setTabs((prev) => {
         const next = prev.filter(...);
         if (needNavigate) nextRoute = calcNextRoute(next);
         return next;
       });

       if (nextRoute) {
         const dest = nextRoute;
         queueMicrotask(() => {
           router?.push(dest);
         });
       }
       ```

---

## 8. ERP 全屏单据工作台 (FormPage) 交互规范与“去 AI 模板味”铁律

- **痛点与设计反模式**：
  1. **单据模态窗（Modal）承载力低下**：传统 ERP 复杂主从单据（包含数十个字段、多区块、从表 DetailTable、审批流）塞在模态弹窗中，导致严重的纵向/横向滚动条，且遮罩锁死用户上下文，无法多任务对照查阅；
  2. **操作按钮上下冗余重复**：页面顶部右侧放一套“重置/返回/保存”，底部又放一套一模一样的按钮，造成视觉疲劳与布局杂乱；
  3. **浓烈的“AI 模板味与开发自嗨”**：界面上充斥着说教式的副标题（如“登记客户企业法定名称、联系人及分类归属”、“配置财务结算周期...”），甚至在底部赫然展示“工业级标准单据 · CASL 动态权限校验受控”等开发内部术语，给企业现场操作人员带来极其业余和出戏的观感。
- **解法与工业级 ERP 交互准则**：
  1. **表单形态分级分类治理（严禁一刀切）**：
     - **多字段复杂主数据与业务单据**（客户档案、物料清单、销售订单、出入库单等）：一律采用无遮罩的右侧全屏 `FormPage` 呈现，并在顶部 `TabBar` 自动开启独立动态页签（如 `编辑: 华为技术`）；保存后默认停留在当前页继续后续流转动作；
     - **极简辅助实体与字典项**（如客户分类、标签管理、计量单位等 ≤ 4~5 个字段的极简录入）：一律采用轻快模态窗 (`FormModal`) 或抽屉 (`FormDrawer`) 就地操作，即开即填即关，避免轻量操作大动干戈开新 Tab，保持敏捷高效；
  2. **表单元数据 100% 保持无损复用**：
     - `FormPage` 与 `FormModal` 共享完全一致的元数据协议：`fields`、`sections`、`schema`（Zod）、`detailConfig`（DetailTable）与 CASL `subject`，切换展现形态时无需重写业务字段树；
  3. **操作按钮收敛于底部粘性操作栏**：
     - 顶部 Header 只保留返回按钮、单据标题与单据编号/状态 Badge，右侧仅在业务明确需要时提供特定扩展插槽；
     - 主保存、重置、取消/返回按钮统一收敛在底部粘性底栏（Sticky Footer），符合重度单据从上到下录入至底部直接提交的工业人机工学；
  4. **坚决去除 AI 味与内部术语**：
     - **杜绝说教式长说明**：各区块标题回归极简业务概念（“基础信息”、“结算与授信”、“业务归属”），删除所有废话副标题；
     - **严禁向用户暴露框架实现术语**：严禁在 UI 界面文案中出现“CASL”、“权限校验”、“动态受控”、“工业级标准”等开发者内部自嗨词汇；没有真实审计时间或操作人信息时，底栏左侧一律保持干净留白。

---

## 9. 下拉控件 Base UI 迁移踩坑与 Label 丢失防线 (Select vs Combobox)

- **痛点与核心根因**：
  - 开发者习惯了 Radix UI 时代 `<SelectTrigger><SelectValue /></SelectTrigger>` 自动反查 DOM 提取子项文本的旧机制；
  - 迁移至 **Base UI (`@base-ui/react`)** 后，组件解除了侵入式 DOM 反查，当 `<SelectValue />` 未显式传入 children 时，**默认直接把原始 `value` 打印为文本**，导致输入框直接渲染为英文枚举 Key（如 `MAIN`）或长串 UUID 主键（如 `0195e...`），严重破坏用户体验。
- **解法与全仓固化标准**：
  1. **实体主数据与外键关联：一律使用 `Combobox`**：
     - 包括商品、单位、产线、客户、供应商、仓库等；
     - 统一传入 `options: [{ value: id, label: name }]`，组件内部内置双向 Label 映射，确保永远对外展示业务名称，对内提交稳定主键；并自带拼音/文字搜索与触底分页；
  2. **官方原生 `Select` 正确写法：必须显式给 `<SelectValue>` 注入 Label**：
     - 不改动任何官方底层源码，保持 `@base/ui` 的 Base UI 原生纯净；
     - 在业务端使用原生 `Select` 时，必须给 `<SelectValue>` 标签体内显式传入映射好的中文文本：
       ```tsx
       const ROLE_LABELS: Record<string, string> = {
         MAIN: "主料",
         AUXILIARY: "辅料",
         PACKAGING: "包材",
       };

       // 官方规范写法：
       <Select value={role} onValueChange={(val) => setRole(val || "MAIN")}>
         <SelectTrigger className="h-9 text-xs">
           <SelectValue placeholder="选择角色">
             {ROLE_LABELS[role] || role}
           </SelectValue>
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="MAIN">主料</SelectItem>
           <SelectItem value="AUXILIARY">辅料</SelectItem>
         </SelectContent>
       </Select>
       ```
  3. **海量与外键数据首选 `Combobox`**（带搜索/分页/清空），彻底消除手写字典映射。

---

## 10. 普通 CRUD 场景 vs 复杂自定义场景实现分流范式 (有意为之的分流设计)

- **核心场景分流黄金准则**：
  1. **普通标准场景 (Standard CRUD)**：
     - **适用范围**：字段明确、单表或标准主从表（如客户档案、客户分类、供应商、数据字典等）；
     - **实现方式**：直接使用封装好的标准化大组件（`DataTable` 列表 + `FormModal` 弹窗 / `FormPage` 全屏单据工作台）；
     - **权限心智**：列表传入 `subject={XxxSubject}` 并为受控列声明 `field: XxxField.YYY`；表单只需在容器外层传入 `subject={XxxSubject}`，内部控件依据 DTO 属性 `name` 全自动完成读写权限匹配，无需在每个输入框上手写重复配置。
  2. **复杂自定义场景 (Complex Assembly & Non-Standard Views)**：
     - **适用范围**：制造 BOM、工艺路线、多级配方、批次装配、交互图谱、动态增删行等非标高度定制界面；
     - **实现方式**：**严禁将复杂业务强行削足适履塞入通用 FormPage**！采用**积木化物理拆解架构**（按功能拆分 `form/`、`graph/`、`detail/`、`list/` 独立子目录，单文件控制在 50~180 行）；
     - **权限心智（结合使用封装好的原子权限控件）**：
       - **操作/动作按钮**：必须使用封装好的 **`<AuthGuard action={...} subject={...}>`** 声明式包裹动作按钮，严禁在页面侧手写 `can("create", ...) && <Button>` 或层层透传 `canCreate/canUpdate` 布尔值 props；
       - **受控字段输入**：必须使用封装好的 **`<AuthField field={XxxField.YYY} subject={...}>`** 声明式包裹输入控件，底层自动处理 `HIDDEN`（彻底不入 DOM）与 `READONLY`（自动禁用并挂载只读徽章）；
       - **表单状态 Hook**：抽取 `useXxxFormState.ts` 纯逻辑 Hook，内部践行“动态可见性与必填协同原则”，被 `HIDDEN` 隐藏的字段自动豁免必填校验，避免提交死锁；
       - **服务端写防线**：在对应的 `createXxxAction` 与 `updateXxxAction` 中首行调用 `assertEditableFields(ability, Subject, extractControlledPayload(input))`，阻断网络层越权篡改。



