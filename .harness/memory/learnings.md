# 避坑指南与工程实践库 (Learnings)

本文档记录团队在开发过程中踩过的坑与最佳实践：

## 1. 权限定义与强类型声明 (Better Auth + CASL)

- **痛点**：在引入成熟权限库后，AI 仍可能随手使用未经验证的裸字符串（如直接手写 `"procurement.order.create"` 或拼写错误），导致权限判定失效或意外越权。
- **解法**：
  - 功能权限统一在各业务切片的 `permissions.ts` 中声明 Better Auth `statement` (Resource -> Actions) 与 CASL `ProcurementPermission` / `Subject` 契约映射；
  - 严禁手写魔术字符串，统一引用切片导出的权限强类型对象（如 `ProcurementPermission.order.resource`、`ProcurementPermission.order.actions` 或 `ProcurementFields`）；
  - 服务端使用 `@RequireAbility(action, subject)` 或 CASL `ability.can()` 判定，前端通过 `<Can I={action} a={subject}>` 门禁，字段三态通过 `<PermissionField>` 控制；
  - 在 `./scripts/check-redlines.mjs` 中设置了物理红线扫描，严禁绕过授权体系或旧版裸写权限判定。

## 2. 数据库连接池与动态路由

- **痛点**：Database-per-Tenant 频繁创建 PrismaClient 会导致连接池泄露和数据库连接占满。
- **解法**：在 `TenantDbManager` 中维护有容量上限（LRU 策略）的 Client 缓存池，并合理设置连接生命周期。

## 3. Server Component 与 Data Fetching

- **痛点**：Next.js App Router 中 Server Component 内部 `fetch('/api/...')` 会产生自请求网络往返，且丢失 Cookie/Session 上下文。
- **解法**：Server Component 必须直调 Application Service，Server Action 仅作为 Web Mutation 适配器。

## 4. 统一数据库演进：新库基线与老库增量升级

- **痛点**：多租户物理隔离下若由 Next.js 服务在请求中动态调用 Prisma CLI 执行 Schema 扫描或 `prisma db push`，打包后因路径重写极易触发 `ENOENT`，且引发并发死锁；老租户库若无审计账本也无法追溯和重试。
- **解法**：建立统一演进工具包 `@base/db-migrate`：
  - **新库开通**：直接执行预生成并经过哈希校验的最新版本全量 Baseline SQL，0 秒初始化并注入基础 Seed，彻底与运行期 Prisma CLI 解耦；
  - **老库升级**：在 Control DB 维护 `TenantMigration` 集中账本；通过 `pnpm db:migrate:generate` 显式生成带风险审查元数据的增量迁移补丁；生产环境通过带 PostgreSQL Advisory Lock 的事务升级引擎受控批量执行。

## 5. 消除状态双写与沙盒单源治理 (Single Source of Truth)

- **痛点**：在根目录下频繁更新全量 `progress.md` 和 `session-handoff.md`，同时又在 `.harness/features/<id>/` 下重复更新，导致两份记录经常出现内容冲突或维护冗余。
- **解法**：
  - **彻底移除根目录下冗余的 `progress.md` 和 `session-handoff.md`**；
  - **各特性的执行进度与换手交接单**严格且唯一收敛至其自身专属沙盒目录 `.harness/features/<id>/progress.md` 与 `handoff.md`；
  - **全局特性账本**统一以 `feature_list.json` 为唯一事实源 (SSoT)；
  - **跨特性的经验总结**统一沉淀至 `.harness/memory/learnings.md`，**发现的历史遗留问题**统一登记至 `.harness/memory/technical-debt.md`。

## 6. 合理执行门禁验证，杜绝机械重复

- **痛点**：在准备执行 `git commit` 前，开发者或智能体已刚刚手动运行过 `./scripts/verify.sh` 并确认通过；由于 Git `pre-commit` 钩子本身已挂载该校验，若在无源码变更下连续手动重复执行，会导致 12 个 package 的全量类型与红线扫描被连续计算两次，造成严重的无效等待。
- **解法**：
  - 核心节点只需保证通过一次有效门禁；
  - 刚刚验证通过且代码未再修改时，直接执行提交，由 `pre-commit` 自动兜底；
  - 日常开发优先执行单 Package 测试或类型检查，避免无节制全量扫盘。

## 6.1. 跨平台脚本全量采用 Node.js (_.mjs)，严禁新增 Shell 脚本 (_.sh)

- **痛点**：团队成员跨 Windows、macOS 与 Linux 协同开发，历史上使用 Bash (`*.sh`) 编写的 `init.sh`、`verify.sh`、`status.sh` 在 Windows（PowerShell / CMD / VS Code 默认终端）下无法直接运行或路径解析错乱，导致流程中断，甚至因 CRLF 换行符引发门禁误报。
- **解法与铁律**：
  - **100% 纯 Node.js 实现**：全仓所有环境探测、质量门禁、清理与日常辅助工具全面使用 `*.mjs` 编写（如 `scripts/init.mjs`、`scripts/verify.mjs`、`scripts/clean.mjs`）；
  - **双重硬拦截机制**：
    1. **启动时拦截**：`pnpm init`（`scripts/init.mjs`）在启动自检的第 2 步专门扫描工作区，发现任何 `*.sh` / `*.bash` 立即硬退出；
    2. **提交时拦截**：`scripts/check/check-redlines.mjs` 作为提交红线，发现 Shell 脚本立即阻止 `git commit`；
  - **换行符防御**：通过根目录 `.gitattributes` 强制 `eol=lf`，彻底消除跨操作系统文本行尾符差异。

## 7. 公共 UI 模块与 shadcn 官方组件安装规范 (Monorepo SOP)

- **痛点**：
  - 手写私有 UI 伪冒 shadcn 原生规范，不仅颜色硬编码（如 `slate-*`、`blue-*`），且绕过了 `--muted`、`--border` 等设计令牌，导致主题、品牌色和 Dark Mode 切换失效；
  - 在 Monorepo 环境中随意运行交互式 CLI 容易卡死终端，或因缺少子包别名导致文件落入错误路径。
- **解法与固化规范**：
  - **基础原子组件标准**：`packages/ui` 基础原子组件必须 100% 遵循 `shadcn/ui (new-york)` 原生实现，使用 React 19 标准签名、`data-slot` 体系与 CSS 变量设计令牌；
  - **安装新组件必须走统一命令**：

    ```bash
    pnpm ui:add <component_name>
    # 等价于：npx shadcn@latest add <component_name> -y --overwrite -c packages/ui
    ```

  - **组件添加后的标准化流程 (SOP)**：
    1. **命令下发**：根目录执行 `pnpm ui:add <组件名>`；
    2. **依赖闭环**：检查 `packages/ui/package.json`，确保 CLI 下载引入的新依赖（如 `@radix-ui/*`）声明完整，避免幽灵依赖；
    3. **统一导出**：在 `packages/ui/src/index.ts` 中显式追加 `export * from "./components/<组件名>";`，使全仓业务应用直接从 `@base/ui` 导入；
    4. **质量验证**：执行 `pnpm --filter @base/ui check && pnpm --filter @base/ui test`；
    5. **门禁自检**：运行 `./scripts/verify.sh` 确保类型零错误、无幽灵依赖。

## 8. 严禁主观猜测与私造轮子，遇到疑难强制检索官方规范 (Official Docs First)

- **痛点**：
  - 在遇到框架或库的复杂底层报错时（例如 Next.js App Router 报错 `Only plain objects can be passed. Decimal objects are not supported`），容易凭借主观经验猜测，盲目手写脆弱的递归清洗或 ad-hoc 拼接逻辑；
  - 甚至在引入三方库时（如 SuperJSON）未查阅其真实规范，误以为默认支持任意非原生 Class，漏掉了官方 README 明确要求的 `registerCustom` 配方，导致重复踩坑与代码架构漂移。
- **解法与行为契约 (Learning & Invariant)**：
  - **首查官方文档 (Official Recipes First)**：遇到涉及三方库行为、版本破坏性改动或边缘报错时，**严禁闭门造车或主观猜测**，必须第一时间通过联网搜索或文档检索工具查阅官方 GitHub 仓库、官方 README 与标准配方（Recipes）；
  - **对齐成熟生态规范**：如 SuperJSON 官方明确提供了对 `Decimal.js` / `Prisma.Decimal` 的标准拓展配方（`SuperJSON.registerCustom<Decimal, string>(...)`），严格遵循官方实现既优雅又稳健；
  - **坚持工业级标准**：能用业界经过数亿次生产验证的成熟库（如 `radash`、`dayjs`、`superjson`、`Intl`）解决的问题，严禁手写脆弱轮子；同时必须对齐强类型（彻底消灭 `any`）与完备的中文业务注释。

## 9. 严禁 UI 组件与 Next.js 假解耦！对齐 App Router 嵌套布局与局部渲染官方范式 (Partial Rendering Invariant)

- **痛点复盘**：
  - 租户端点击左侧侧边栏时整页白屏刷新，展开的手风琴全部收缩重置（体验极其怪异）；
  - 核心根因：`packages/ui` 里的 `Sidebar.tsx` 为了所谓的“跨框架通用”，自欺欺人地搞了假解耦，默认退化为原生 `<a>`（`DefaultLink`）和 `window.location.pathname`。而在上层消费时又没有处理好路由注入，导致菜单点击退化成浏览器的**硬导航 (Hard Navigation)**，整篇 HTML 和 JS 内存堆全部被销毁重建；
  - 初始误区：甚至试图在应用层再包一层 `app-sidebar.tsx` 去打补丁，制造了无意义的冗余胶水层。
- **Next.js 官方正统 Mental Model (思维模型)**：
  - **Hard Navigation vs Soft Navigation**：原生 `<a>` 必然导致硬导航（销毁整页与状态）；只有 `next/link` 才能触发 App Router 的软导航与路由缓存（Router Cache）；
  - **Layout State Preservation**：官方原语承诺 _“A layout is UI that is shared between multiple routes. On navigation, layouts preserve state, remain interactive, and do not re-render.”_；
  - **组件边界原则**：在针对 Next.js 生态的专用应用与 UI 库中，**严禁用冗余的 `LinkComponent` 抽象层把原本两行代码的原生 `next/link` 和 `usePathname` 搞得支离破碎**；直接遵循官方标准，组件自身原生接入 `next/link`。
- **全栈固化工程规范 (Iron Rules)**：
  1. **零冗余胶水层**：禁止在路由组目录制造类似于 `app-sidebar.tsx` 这种仅仅为了桥接 `Link` 的空壳组件，`layout.tsx` 直接消费 UI 库导出的标准组件；
  2. **官方正统依赖**：由于本项目核心架构即为 Next.js 16 App Router，`@base/ui` 显式依赖 `next`，直接 `import Link from "next/link"` 与 `import { usePathname } from "next/navigation"`；
  3. **兼顾单测受控能力**：为纯 Node 环境的 `renderToString` 单测保留可选的 `currentPath` 覆盖入参（`const currentPath = propCurrentPath ?? routerPath ?? ""`），保证既有官方正统体验，又兼顾 100% 纯函数式测试能力；
  4. **局部骨架标配**：所有路由组必须在同级配置 `loading.tsx`，在 RSC 增量取数期间提供即时骨架屏（Instant Loading States），杜绝页面跳转卡顿错觉。

## 10. 企业级数据列表积木体系 (Compound DataTable Pattern) 与原子组件引入规约

- **痛点复盘**：
  - 传统中后台常写出一个几千行的单体“大黑盒”表格组件（如 `<SuperTable ...props />`），将搜索、筛选、分页、权限、CRUD 弹窗死板地绑在一起；
  - 这种单体组件 props 膨胀、内部 if-else 爆炸，且业务页面想要微调布局（如将搜索框移到侧边栏、定制行级动作）时完全无法插拔与扩展；
  - 基础原子组件平铺在 `components/` 根目录下，混杂了业务逻辑，且容易随意手写样式，破坏了 shadcn 的纯正血统与设计令牌。
- **解法与架构规范 (Compound Architecture Invariant)**：
  1. **原子层与复合层严格分层 (primitives vs composite)**：
     - `packages/ui/src/components/primitives/`：必须 100% 通过官方 shadcn CLI 命令（`pnpm ui:add <name>`）安装，严禁手写私有原子；
     - `packages/ui/src/components/feedback/`：通用二次确认（`ConfirmDialog`）、空状态（`EmptyState`）；
     - `packages/ui/src/components/composite/data-table/`：基于纯正原子组件拼装的企业级复合数据表格体系；
  2. **自由插拔与全功能 CRUD 预置（Compound API）**：
     - 开发者可像搭积木一样自由组合：`<DataTable.Root>`、`<DataTable.Toolbar>`、`<DataTable.Search>`、`<DataTable.FacetedFilter>`、`<DataTable.FilterDrawer>`、`<DataTable.Actions>`、`<DataTable.BatchBar>`、`<DataTable.Content>`、`<DataTable.Pagination>`；
     - **详情与编辑弹窗插槽**：预置高灵活度的 `<DataTable.DetailDrawer>` 与 `<DataTable.FormModal>`，支持预置渲染、也支持自定义子节点 `children` 及自定义操作栏 `footer` 插槽；
     - **行级与顶部操作扩展插槽**：`<DataTableRowActions>` 内置查看、编辑、删除（带二次防误删确认），并支持 `extraActions` 扩展项；顶部 `<DataTable.Actions>` 暴露当前表格上下文（`can(action, field)`、`selectedKeys`、`isAnySelected` 等）；
  3. **现代化权限深度继承**：
     - 彻底清理过时的旧字段权限兼容层（`PermissionField`）；
     - 字段权限升级为与新积木套件深度结合的 `<AuthorizedField>`（可作为 `<DataTable.AuthorizedField>` 消费）；
     - 在 `DataTable` 内部使用时，表格列根据 CASL ability 自动过滤隐藏、按钮动作根据 ability 自动判断、表单字段自动继承 `subject` 与 `ability` 实现三态控制（HIDDEN / READONLY / EDITABLE），无需重复传参。

## 11. 页面级纯数据契约 (SSoT Contract) 与权限前后台对齐规范

- **痛点复盘**：
  - 传统开发容易手写两套平行世界：`manifest.ts` 声明一套权限（actions/configurableFields），前台业务页面组件（`*View.tsx`）又手写一套列定义与按钮；
  - 导致严重脱节：后台配置树上勾选了“导出数据”，前台页面代码根本没写这个按钮（幽灵权限）；或者后台把某字段设为 `HIDDEN`，前台表格列因遗漏挂载 `field` 属性而依然把数据完整泄露出来。
- **解法与铁律 (Contract SSoT Invariant)**：
  1. **页面契约单一事实源 (SSoT)**：
     - 彻底废除平铺的 `permissions.ts`；
     - 各业务页面在 `src/contracts/<page>.contract.ts` 中自包含维护自己的实体名（Subject）、资源名（Resource）、字段枚举（Field）、受控元数据与页面契约对象（`FeaturePagePermissionDescriptor`）；
  2. **双端无损消费**：
     - **切片清单 (`manifest.ts`)**：只负责组装各页面的契约对象，严禁手写重复的大对象字面量；
     - **业务组件 (`*View.tsx`)**：表格列必须挂载契约声明的 `field: MyField.XXX`，受控按钮必须通过 `(!ability || ability.can("action", Subject))` 条件渲染；纯 UI 交互按钮无需进契约，自由书写；
  3. **自动化对齐门禁**：
     - 每个页面组件配套编写 `<Page>View.test.tsx`，断言契约动作与页面按钮 100% 呼应，断言 `HIDDEN` 字段列物理级剥离。
  4. **专项 Skill 指南**：
     - 详细操作步骤与代码样板已沉淀至项目专属 Skill：`.agents/skills/erp-feature-permissions/SKILL.md`。

## 12. 全仓清除 TypeScript 原生 enum 语法包袱，坚守 as const 现代范式 (No TS Enum Invariant)

- **痛点复盘**：
  - 传统 TypeScript 原生 `enum` 会被转译为 IIFE 立即执行函数与双向映射对象，不仅污染产物体积，而且对现代 bundler（esbuild, SWC, Turbopack）的隔离编译极不友好；
  - 字符串枚举在 TypeScript 中属于“封闭类型”，外部传入一个内容相同的普通字符串字面量会被类型检查报错拒绝，逼迫开发者到处写 `as MyEnum` 强转，滋生坏味道；
  - 甚至在底层基础包中（如 `packages/shared` 与 `packages/biz-shared`）残留了 `enum FieldPolicy` 与 `enum BizApprovalStatus`，违背了现代 SaaS 前端纯粹性。
- **解法与铁律 (No Enum & as const Standard)**：
  1. **全仓禁止 `export enum`**：
     - 所有常量状态、类型、字典必须 100% 使用 `as const` 常量对象声明；
     - 借助 `typeof + keyof` 语法一行自动推导开放的字面量联合类型：

       ```ts
       export const FieldPolicy = {
         HIDDEN: "HIDDEN",
         READONLY: "READONLY",
         EDITABLE: "EDITABLE",
       } as const;
       export type FieldPolicy = (typeof FieldPolicy)[keyof typeof FieldPolicy];
       ```

  2. **开放联合类型的优势**：
     - 运行时是纯粹干净的 JavaScript 对象（可直接调用 `Object.values()` 供给下拉框或循环）；
     - 编译后无多余 IIFE 胶水，零运行时包袱；
     - 字符串字面量无缝匹配，杜绝一切恶心的 `as ...` 强转。

## 13. 严禁接收端函数将 as const 精确类型降解为 string (反“假强类型”防线)

- **痛点复盘**：
  - 许多模块在契约端费尽心机构造了 `as const` 精确字面量，但在最终的函数接收端（如 `assertMaterialAbility`、`assertCustomerAbility`）却将参数写成 `action: string, subject: string`；
  - 这属于典型的“假强类型”：因为入参是宽泛的 `string`，调用者手写拼错单词或传入跨领域的无效字符串时，TypeScript 编译器完全失声，强类型保护在最后一厘米被彻底击穿，导致隐蔽的运行期 `ForbiddenError`。
- **解法与铁律 (Type-Safe Guards Invariant)**：
  1. **各切片聚合领域联合类型 (`contract-types.ts`)**：
     - 在业务切片共享层集中导出由各契约推导出的精准 Subject 与 Action 联合类型（如 `MaterialSubject`、`MaterialAction`）；
  2. **守卫函数入参强制绑定**：
     - 鉴权守卫函数入参严禁写 `string`，必须直接使用领域联合类型：

       ```ts
       export function assertMaterialAbility(
         ability: AppAbility<string, string>,
         action: MaterialAction,
         subject: MaterialSubject,
       ): void {
         ForbiddenError.from(ability).throwUnlessCan(action, subject);
       }
       ```

  3. **静态门禁机械化兜底**：
     - `scripts/check/check-permission-contracts.mjs` 中内置 AST/正则静态拦截，一旦检测到任何 `assert*Ability` 守卫函数将 `action` 或 `subject` 声明为 `string`，提交门禁直接报错阻断！

## 14. 业务流程与拓扑界面的“交互闭环”原则 (UI/UX Functional Completeness)

- **痛点复盘**：
  - 在工艺 BOM 开发中，后端数据库表（`bom_process`、`bom_input_item`、`bom_output_item`）、计算引擎（`BomCalculatorEngine`）与 Server Actions 均已支持工序与物料流转；
  - 但前端页面只做了一个“空壳子”弹窗（只填名称和产出物料），没有给用户提供添加工序、录入投入物料、配置损耗率的交互入口；
  - 导致用户创建出来的 BOM 永远是空的，上方漂亮的 DAG 流程图永远只能无可奈何地展示“暂未配置工序流程”，形成严重的业务断层和半吊子体验。
- **解法与铁律 (UI Completeness Invariant)**：
  1. **拒绝“巧妇难为无米之炊”的假大空 UI**：
     - 如果页面上设计了状态机、指标卡或拓扑图（如 DAG），必须保证系统有对应的交互编排载体（如 `BomFlowEditorModal`）供用户完整录入与维护底层数据；
  2. **业务流程图必须是有向无环图 (DAG)**：
     - 食品加工、中央厨房与离散制造的加工路线具有严格的时序与不可逆性，流转图必须清晰表达：投入物料 $\to$ 加工工序（含出成率/损耗） $\to$ 产出中间品 $\to$ 最终成品；
  3. **数据幂等与容错自愈**：
     - 在编排器支持快速选择预设工序模板时，服务端 Action 必须具备防击穿逻辑：若数据库无历史主数据则自动建档补充，防止因外键约束崩溃导致用户无法保存业务数据。

## 15. 数据库基线演化与本地缓存诊断自愈规范 (Database Baseline & Turbopack Cache SOP)

- **痛点复盘**：
  - 代码提交将数据库基线版本重命名/收敛（如从 `20260910141042` 改为 `20260913144500`），但本地已初始化的开发库中 `platform_migration` 账本仍记录旧版本号；
  - 本地启动 `pnpm run dev:control` 时触发 `@base/db-migrate ensure-platform` 报 `Platform database is non-empty but incomplete; missing tables: baseline ledger`；
  - 修复数据库基线版本后，Next.js Turbopack（`.next/dev/cache`）残留旧代码缓存（如已废弃的旧 `instrumentation.ts`），导致启动时依然报旧的校验错误。
- **解法与自动化处置 SOP (Invariant)**：
  1. **基线版本漂移识别**：
     - 当报 `missing tables: baseline ledger` 时，先比对代码中 `baseline.version` 与本地数据库 `platform_migration` 账本中的 `version`；
     - 若 SQL 内容与 SHA256 Checksum 一致，仅版本标识不同，可安全执行 `UPDATE platform_migration SET version = '<new_version>' WHERE migration_name = 'baseline';` 对齐。
  2. **Turbopack 编译脏缓存清理**：
     - Next.js 16 (Turbopack) 会持久化缓存 server runtime bundle；在修改底层 DB 协议、移除全局 instrumentation 或重构依赖后，需清理 `.next` 缓存目录（`rm -rf apps/<app>/.next`）。
  3. **智能体操作铁律（必须事先跟用户确认）**：
     - **严禁静默修改数据库或静默清理缓存**；
     - 当诊断出该类问题时，智能体必须**明确向用户展示诊断依据（当前版本 vs 目标版本）、即将执行的 SQL/命令及影响范围，待用户明确确认后方可执行**。

## 16. 暗色模式 (Dark Mode) 语义设计令牌与权限门禁防错规范 (Dark Mode & AuthGuard Invariant)

- **痛点复盘**：
  1. **暗色模式“白块”突兀**：部分卡片与表格手写了 `bg-slate-50`、`border-slate-200`、`text-slate-700` 等绝对浅色/灰色类名，绕过了 `--muted`、`--border`、`--foreground` 等设计令牌，在深色底色（Dark Mode）下泛出突兀刺眼的白底白边，文字对比度严重失衡；
  2. **“后端拦截了但前端按钮可见”的脱节现象**：页面组件顶部的“添加/新建/编排”按钮脱离了 `DataTable` 容器，直接手写裸 `<form>` 或 `<Button>` 渲染在页面上，既未传入 DataTable 的 `subject`，又未包裹 `<AuthGuard>`。当没有写权限的普通成员登录时，前端依然渲染了新建按钮，用户点击后被后端的 CASL Server Action 硬拦截并报错 `Cannot execute "create" on ...`，用户体验极其粗糙割裂。
- **解法与铁律 (Tokens & AuthGuard Standard)**：
  1. **100% 杜绝硬编码浅灰色**：
     - 严禁在页面卡片、弹窗或容器上写 `bg-slate-50`、`border-slate-100`，统一使用 `bg-muted/30`、`border-border`、`bg-card`、`bg-background`；
     - 状态徽章与带色彩小块必须具备透明度阶梯与暗色适配，如 `bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20`；
  2. **双轨权限消费法则 (DataTable vs AuthGuard)**：
     - **规则 A（使用标准模板 DataTable）**：必须显式传入对应实体的 `subject={XxxSubject}`。DataTable 内部的工具栏（新建、导出、批量动作）及数据列会自动继承该上下文，无权限时自动 Fail-Closed 隐藏对应动作；
     - **规则 B（脱离 DataTable 的自定义按钮/表单）**：凡是在表格之外自定义渲染的写入/破坏性 UI 入口（如页面右上角“新建”、看板“编排 BOM”、快捷新增输入表单等），**必须强制使用 `<AuthGuard subject={XxxSubject} action={StandardAction.CREATE}>` 进行包裹**；
     - **规则 C（对齐自动化单测）**：每个包含受控入口的页面必须编写 `<Page>View.test.tsx`，分别注入“只读权限快照”与“完整权限快照”，机械化断言无权限时入口 100% 自动隐藏、有权限时正常呈现。

## 17. 外键字典与下拉选项解耦规范 (BFF Contextual Options Pattern 与防级联瘫痪)

- **痛点复盘**：
  - 在租户角色管理中取消勾选某个角色的“客户分类”权限（期望该角色不能去维护客户分类字典）；
  - 该角色登录后访问“客户档案”列表页面，页面直接报 `Runtime ForbiddenError: Cannot execute "read" on "CustomerCategory"` 崩溃中断；
  - 核心根因：客户档案列表页（`CustomersPage`）为了渲染表格顶部的“分类筛选下拉框”和新建弹窗里的“选择分类”，直接调用了分类管理后台专用的 `getCategoryTreeQuery`。该查询内部硬编码了对 `CustomerCategorySubject` 的强校验，导致**子字典的后台维护权限反向击穿了宿主业务页面的可用性**。
- **工业级正统解法 (BFF Contextual Options Pattern)**：
  1. **宿主业务聚合元数据模式**：
     - 参考主流 ERP（ERPNext、销售订单已跑通范式）规范，业务页面所需的下拉选项，统一由**宿主 Feature 自身暴露的聚合接口**（如 `getCustomerPageOptionsQuery`）提供；
     - **鉴权只认宿主**：由于用户正在访问的是客户档案页面，该接口理直气壮只校验宿主自身的读取权限（`assertCustomerAbility(ability, StandardAction.READ, CustomerSubject)`）；
     - **内部安全查询**：宿主服务在底层调用分类/标签服务，自动过滤 `status: "ACTIVE"` 的启用字典项，返回纯净的选项列表；
  2. **管理端查询坚守独立底线**：
     - 分类/标签管理后台专用的 `getCategoryTreeQuery`、`listTagsQuery` 保持纯粹严格的独立权限校验（`CustomerCategorySubject`），坚守管理后台安全防线；
  3. **底层数据库查询方法 100% 复用 (DRY 原则)**：
     - 底层 Service 统一收敛为同一个 `listCategories(client, { status })` 和 `listTags(client, { status, tagType })`；
     - 管理端不传 status（查全量并组装树），下拉端传 `status: "ACTIVE"`（只查启用项），彻底杜绝重复代码与排序/软删除维护不一致的隐患；
  4. **全链路统一 Option 命名规范 (Ubiquitous Language)**：
     - 无论是服务端 Query（`getCustomerPageOptionsQuery`）、页面与组件 Props（`categoryOptions`、`tagOptions`），还是本地静态枚举（`settlementMethodOptions`），全链路统一收敛以 **`*Options`** 命名；
     - 严禁使用模糊的 `categories`、`tags`、`data`，一眼识别其“只读下拉数据源”的职责属性；
  5. **门禁脚本机械化硬拦截**：
     - 在 `scripts/check/check-permission-contracts.mjs` 中内置静态扫描：业务列表页面严禁直接跨域调用管理端专属的 `getCategoryTreeQuery`，强制要求消费宿主聚合的 `*OptionsQuery`。

## 18. 字段级权限 (Field-Level Security) 全栈闭环与表单模板沉淀规范 (FLS Zero-Trust Invariant)

- **痛点复盘**：
  1. **弹窗脱节，权限穿透**：在 UI 模板重构中，通用模态框（如 `CustomerFormModal`）内静态写死业务字段数组，未接入 CASL 字段三态判定，导致在后台配置了字段隐藏/只读后，详情与编辑弹窗依然全量无损呈现；
  2. **必填与隐藏死锁矛盾**：若某字段在 Zod Schema 中声明为必填（如 `contactPhone`），但管理员对某角色配置了 `HIDDEN` 隐藏。由于用户在前端看不到该字段输入框，提交时 Zod 强校验空值失败，导致表单“永远无法提交且看不到报错”；
  3. **UI 隐藏伪安全**：前端表单虽然隐藏了字段，但后端写路径 Server Action 仅有动作级粗粒度门禁（`assertCustomerAbility`），未调用 `assertEditableFields` 对 Payload 字段白名单进行防篡改断言，攻击者绕过前端伪造 RPC 仍能非法篡改受限字段；
  4. **列表复合列绑定错位**：列表将联系人姓名与手机号合并在单列渲染，但列配置仅绑定了 `field: CustomerField.CONTACT_PHONE`。当管理员关闭“联系人姓名”权限时，DataTable 因手机号有权而放行整列，姓名依然在单元格中暴露。
- **工业级正统解法与全栈防御铁律 (Zero-Trust Standard)**：
  1. **基座 UI 模板统一沉淀，消除私有胶水 (FormModal 字段三态闭环)**：
     - 严禁在每个业务页面的 FormModal 中重复手写私有字段过滤代码；
     - `@base/ui` 的场景模板 `FormModal` 自动消费全局 `useOptionalAbility()`，业务侧**只需声明 `subject={XxxSubject}`**；
     - 内部对 `fields` 与 `sections` 全自动执行三态治理：
       - `HIDDEN`：彻底剥离不入 DOM 树，且整组字段均隐藏的 Section 自动收敛剔除；
       - `READONLY`：新增/编辑模式下自动追加 `disabled: true` 并展示权限只读提示；
     - 字段支持 `FormFieldSchema.field?: string` 别名映射，防止表单名称与权限契约字段漂移；
  2. **动态可见性与必填协同原则 (“不显示即可不填，显示且必填才必须填”)**：
     - 在 `FormModal` 内部执行 Zod Schema 校验时，动态提取当前用户真正可见的字段集合（`visibleFieldNames`）；
     - **自动豁免校验**：若校验错误发生在被权限 `HIDDEN` 隐藏的字段上，系统自动忽略该错误并放行提交；仅当可见字段校验未通过时才进行红字拦截，彻底解决必填死锁；
  3. **后端写路径强防篡改硬门禁 (assertEditableFields)**：
     - 前端 UI 隐藏绝不等于物理安全。所有实体的 `createXxxAction` 与 `updateXxxAction` 在调用业务 Service 之前，**必须强制执行 `assertEditableFields` 校验**；
     - 过滤掉未传的 `undefined` 键，提取实际提交的显式受控键，一旦检测到包含不可编辑或隐藏字段，立即抛出 CASL `ForbiddenError` 物理阻断事务；
  4. **列表列配置细粒度契约对齐**：
     - 列表复合列若包含多个不同受控维度的敏感字段，应拆分为独立列，或在单元格内部针对各子字段进行 `ability.can("read", subject, field)` 细粒度判断，杜绝因宿主字段放行而导致敏感子文本越权泄露。

## 19. 标准列表 CRUD、DataTableRowActions 详情避坑与多实体页面布局铁律 (Standard CRUD & Actions Invariant)

- **痛点复盘**：
  1. **行操作「详情」置灰不可点**：`DataTableRowActions` 默认开启了 `hideView = false`。如果业务页面未传递 `onView` 回调，组件会将其判定为“未实现查看功能”，从而在界面上把「详情」按钮以置灰 Disabled（`未配置操作回调`）展示，给用户带来严重的“系统坏了”的困惑；
  2. **筛选/查询按钮私自手写**：部分视图脱离 `useListSearch` 和 `DataTable`，在页面上手写裸 `<Button>` 查询或重置，破坏了回车即搜、防抖同步、URL 状态契约及工业风视觉一致性；
  3. **列表无分页**：在字典或分类列表中显式配置 `showPagination={false}`，或者缺少分页状态管理，导致列表数据无法翻页，违背了标杆列表分页底线；
  4. **多实体聚合页左右并排挤压**：在同一个页面包含多个实体/字典（如分类与标签）时，采用 `grid-cols-2` 左右并排，导致两个表格字段换行严重、列宽挤压、右侧操作列溢出，布局极其恶劣。
- **工业级正统解法与行为铁律**：
  1. **按钮 100% 由模板组件托管，严禁私自手写**：
     - 视图一律调用 `const list = useListSearch(xxxSearchParams)`，并将 `{...list.dataTableProps}` 完整展开传递给 `DataTable`；
     - 筛选栏右侧的「查询」与「重置」按钮由 `DataTable` 自动渲染；
     - 工具栏右上角的「刷新」、「导出」、「列设置」、「新增」按钮由 `DataTable` 自动生成，新增与导出受控于 CASL；
  2. **`DataTableRowActions` 详情显隐两则铁律**：
     - **需要详情时**：必须传入 `onView={() => setModal({ open: true, mode: "view", record })}`，且配套的 `FormModal` 必须支持 `mode: "view"`（全字段只读展示）；
     - **不需要详情时**：必须显式传入 `hideView={true}`，**严禁漏传 `onView` 导致灰色的「详情」按钮暴露在界面上**；
  3. **标准分页绝不可缺失**：
     - 所有实体与字典列表均由 `DataTablePagination` 接管，必须传入有效的数据总量 `total`，驱动标准翻页与每页条数（10/20/50条）切换；严禁 `showPagination={false}`；
  4. **多实体聚合页面布局标准**：
     - 多实体/多字典页面**严禁左右并排**；
     - 必须在顶部横向平铺 Tab 导航，切换 Tab 时每个实体均独占 100% 全宽标准 DataTable 视图。
