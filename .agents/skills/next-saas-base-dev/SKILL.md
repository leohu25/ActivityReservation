---
name: next-saas-base-dev
description: 现代多租户 SaaS 架构全栈工程开发与基建演进标准指南。本规范从企业级真实生产工程中严格提炼派生，是本模板项目及所有基于本基座衍生项目的核心开发宪法与权威事实源。在进行任何代码编写、功能开发、模块扩展、架构重构、组件封装或缺陷修复时必须优先加载并严格遵循本指南。涵盖两大核心领域：1. 业务特性垂直切片开发（packages/features/*，严格遵循 8 阶段标准流水线：架构拓扑与语义子路径、Prisma 数据建模与多租户分库迁移基线、纯数据权限契约 SSoT、领域服务与 RSC server-only Queries、defineServerAction 安全 Action 与 CASL 写路径守卫、工业风高密度 DataTable 与 CrudFormModal UI 交互、双端路由装配与 Manifest 动态自发现、契约对齐单测）；2. 平台基座与基础设施框架演进（@base/auth 双端认证会话、@base/authorization 四层权限闭环与 AbilityProvider、@base/db-tenant 动态连接池 TenantDbManager 治理、@base/db-control 总控库、@base/ui 工业风与 shadcn 原子套件、@base/biz-shared 跨切片中台资产、@base/shared 序列化与工具、tooling/db-migrate 12-Factor 无状态迁移引擎）。触发场景：开发/修改任何业务功能或特性切片（Feature/Sub-Feature/Use Case）、新增/修改页面与视图组件、实现 CRUD 增删改查、编写 Server Action/Query、定义/修改 Prisma Schema 与数据库迁移、配置 CASL 权限与契约、设计/调整 DataTable 与表单、迭代底层 base 基础设施/连接池/中间件/认证授权、修改 apps/tenant 或 apps/control 装配层、编写自动化单测或修复 Bug。
color: blue
emoji: 🚀
vibe: 架构标准化、契约即事实源、底层机制防错、无感响应
agent_created: true
---

# 现代多租户 SaaS 架构开发规范与生命周期指南 (Next SaaS Base Dev)

> **基座血统与规范效力声明**：
> 本开发规范与技能体系是**由当前工程实践深度实战沉淀派生而来**。
> 本项目本身既是具备生产级验证的完整系统，也是面向各类垂直行业现代化 SaaS 系统的标准基础底座（Starter Kit / Template）。后续无论是针对当前系统进行迭代演进，还是剥离具体业务切片（`packages/features/*`）后作为种子模板快速孵化全新的 SaaS 项目，**团队与智能体在进行代码开发、功能实现与架构改造时，均必须强制参考、使用并严格遵循本技能规范**。

本项目采用 **Modular Monorepo + Feature-based Vertical Slice Architecture（基于特性的垂直切片架构）**：

- **纵向业务切片层**：`packages/features/*` 独立内聚组织具体业务切片；
- **横向平台基础设施层**：`@base/*` 提供认证、细粒度授权、动态多租户物理分库、高密度 UI 与通用中台资产支持；
- **双端应用装配层**：`apps/control`（平台管控平面）与 `apps/tenant`（租户数据平面）负责运行时装配与路由暴露。

本文件作为**高维索引、开发流水线排期 (Schedule) 与绝对工程红线地图**。具体实施细节请**按需渐进式调阅 `references/` 子文档与架构深度解析**。

---

## 核心工程红线 (Zero-Tolerance Rules)

1. **权限四维契约即唯一事实源**：每个受控 Feature/Sub-Feature 在自身 `contract.ts` 显式绑定 Resource、Subject、Action、Field；Resource 统一 `<domain>.<singular_resource>`，Subject 对齐 Prisma PascalCase 模型（非实体能力仅允许有界例外），Action 只引用共享/领域 `as const` 动作对象，Field 只引用对齐 Prisma camelCase 字段字典；严禁权限魔法字符串。`node scripts/check/check-permission-contracts.mjs` 与 `pnpm verify`（或 `node scripts/verify.mjs`）对全仓违规硬阻断（详见 `references/1-contracts.md`）；
2. **底层机制消灭序列化异常**：所有 Server Actions 必须由 `defineServerAction` 包装，返回数据经 `toPlainData` 序列化，严禁原始 Prisma 实体（带 Decimal/Date）直出；
3. **交互单次确认**：破坏性操作统一由 `DataTableRowActions` 的 `ConfirmDialog` 提示一次，严禁调用浏览器原生 `confirm(...)`；
4. **消息通知右上角 Toast 弹出**：严禁在页面顶部塞入静态红色大横幅挤压变形表格布局，所有操作反馈统一使用右上角 `toast`；
5. **杜绝全页强刷**：严禁调用 `window.location.reload()`，状态变更由 React 本地 State 驱动即时响应，搭配 `router?.refresh()` 静默同步；
6. **物理隔离路由**：业务数据必须由 `getTenant*Context()` 动态路由至租户独立物理数据库，严禁硬编码连接串或跨租户穿透；
7. **一体化卡片容器**：列表页必须用 `DataTable.Root` 白卡整合标题/筛选/表格/分页，严禁零散漂浮在页面底色上（详见 `references/5-ui-components.md`）；
8. **写路径强制 CASL 守卫**：Server Action 写/删/状态变更必须 `assert*Ability(ability, action, subject)`，与页面按钮同一动作名（详见 `references/4-server-actions.md`）；
9. **认证只管进门，授权只认 CASL**：Better Auth 仅负责登录、会话与租户成员身份；业务权限统一由 CASL 强类型判定，禁止用 Better Auth 权限函数查询业务资源；
10. **客户端权限 = 官方 AbilityProvider + 声明式门禁**：RSC layout 拉快照 → `TenantAbilityProvider` 注入 → View 只声明 `subject` 或用门禁积木：
    - **标准模板 `DataTable` / `DataTable.Workspace`**：必须显式传递 `subject={XxxSubject}` 上下文（内部工具栏新增、导出、批量操作及列/行权限自动受控联动）；
    - **非模板 / 自定义外部按钮与操作入口**：凡是脱离了 DataTable 自动上下文的页面自定义按钮（如独立的“新建”、“编排”、“批量操作”等）、独立快捷表单或卡片，**必须强制使用 `<AuthGuard subject={XxxSubject} action={StandardAction.CREATE}>` 进行包裹**。严禁裸渲染未经权限门禁保护的破坏性/写入型 UI 入口，杜绝“后端拦截了但前端按钮依然可见”的体验缺陷（详见 `references/7-casl-ability-provider.md`）；
    - 禁止 View 自建 plain ability、禁止把 `permissions` 传进 View/Workspace；
11. **列表优先 shadcn**：简单列表/表单直接用 `Table`/`Form`/`Dialog`；需要统一工具栏时再用 `DataTable.Workspace`（可选加速，非强制）；
12. **表单优先 shadcn Form**：短表单直接 `Form`+`Field`；长表单/批量字段可用 `FormFields` Schema（可选）；
13. **导出走契约**：CSV 导出用 `exportContractCsv(rows, contract.configurableFields, ...)`，禁止手写 fieldKeys；
14. **原子层与排版 100% 遵循 shadcn 官方原语**：`packages/ui/.../shadcn/` 由官方 CLI 引入并保持纯净。杜绝手写裸 `div` 布局或裸浏览器原生控件，所有布局排版与交互控件必须基于框架已有的原子与复合组件开发（`Table`、`Card`、`Input`、`DatePicker`、`Select`、`Dialog` 等）；
15. **平台 UI 基建沉淀主动提问准则**：在垂直切片实施过程中，一旦识别到交互模式、子表单、明细表格、看板或展示卡片具备通用性，严禁在业务切片内部闭门造车，必须主动向用户发起提问，评估并沉淀至公共 `@base/ui` 库；
16. **单一 Zod 强类型驱动与 Table 列派生**：增改查与单据弹窗统一使用 `FormModal`（或其增强版），强制传入 `schema: z.ZodType` 执行 safeParse 运行时校验拦截，消灭无校验双分支；列表优先使用 `DataTable`（或 `DataTable.Workspace`）渲染；
17. **UI 组件库基建演进四法则 (UI Infrastructure Evolution)**：

- **(a) 复杂场景统一用模板 (Templates for Complex UX)**：列表统一使用 `DataTable`，单据与增改查弹窗统一使用 `FormModal`，内置可选明细表 `DetailTable`，严禁业务层自行手写弹窗与表格拼装胶水；
- **(b) 原子组件保持纯粹不变 (Pure Atomic Invariant)**：`shadcn/` 原子组件仅由官方 CLI 维护，严禁在原子层侵入业务状态与胶水代码，能复用就 100% 复用；
- **(c) 组件组装零冗余 (Zero Glue, Zero Redundancy)**：同一类交互形态在系统内有且仅有一套标准实现与统一导出，彻底废除多余别名与历史胶水包装，保持命名清晰、直观、主流；
- **(d) 复杂超大表单演进标准 (Complex Form Standard)**：当前轻量表单采用受控 React 状态与 Zod 校验；后续若出现超大、深层嵌套联动或频繁动态字段的复杂单据表单，底层驱动引擎统一切换为业界标准 **React Hook Form (`react-hook-form` + `@hookform/resolvers/zod`)**，保持对外暴露的 `FormModal` 声明式 API 完全不变，以获得非受控高性能与脏检查能力。

 1. **测试同级就近共存 (Colocation)**：遵循 Next.js 官方最佳实践，单元测试文件必须与被测试的目标组件/服务处于同一目录下（如 `CustomerView.tsx` 与 `CustomerView.test.tsx` 同级），严禁在模块根目录平铺孤儿测试文件；
 2. **业务实体必须包含基础审计与软删除字段**：所有业务主数据和单据表必须强制具备 `createdById`、`deptId`、`updatedById`、`isDeleted`、`deletedAt`、`deletedById`、`createdAt`、`updatedAt` 8 个基准字段，静态门禁脚本 `scripts/check/check-entity-baseline.mjs` 在 `pnpm verify` 与 `git commit` 时硬拦截违规模型（详见 `references/2-schema-migrate.md`）；
 3. **提交前必须审阅确认 (Human Review Before Commit)**：在执行 `git commit` 前，智能体必须主动向用户呈现本次修改清单与核心变更说明，**获得用户明确确认审阅通过后方可执行提交**，严禁擅自静默提交；
 4. **提交信息必须强制使用中文 (Chinese Commit Message)**：Git 提交信息必须严格遵循 Conventional Commits 规范，且 Header 描述与 Body 详细要点**必须强制使用中文书写**（如 `feat(material): 实现物料与工艺BOM中心及全仓权限四维契约标准化`），严禁使用全英文提交信息；
 5. **严禁手写裸 DOM 与原生非受控控件**：界面必须 100% 使用 `@base/ui` (shadcn) 原子与复合套件搭建（如 `Table`, `DatePicker`, `Select`, `Dialog`, `Button`, `DataTable.Workspace`, `FormModal` 等），严禁在业务切片内手写原生 `<table>`、原生 `<input type="date">` 或手写零散裸 `div` 布局；
 6. **严禁破坏运行时与序列化防线（严禁 RSC 跨端透传函数）**：RSC 通过 server-only Query 读取，禁止内部 HTTP 伪接口绕调；RSC 向 Client 组件仅允许传递经序列化的纯数据，**严禁将未标 `"use server"` 的 query 函数或普通服务端函数作为 prop 直接传递给 Client 组件**；Server Action 必须使用 `defineServerAction` 包装并通过 `toPlainData` 彻底消除 Date/Decimal 跨端序列化异常。

---

## 赛道一：业务特性垂直切片开发流水线 (8 阶段标准排期)

在业务集群（`packages/features/<business-area>/`）中开发或重构业务功能时，严格按以下 **8 个阶段** 循序渐进推进：

```text
Phase 0: 架构拓扑与目录骨架
         ↓
Phase 1: 数据建模与物理隔离
         ↓
Phase 2: 纯数据契约 (SSoT)
         ↓
Phase 3: 领域服务层与 RSC Queries
         ↓
Phase 4: 安全 Actions 与序列化防错
         ↓
Phase 5: 工业风高密度 UI 交互
         ↓
Phase 6: 路由装配与 Manifest 动态自发现
         ↓
Phase 7: 契约对齐单测与全栈门禁验证
```

### 业务切片阶段排期表与调阅索引

| 阶段 | 核心任务 | 交付物与验证指标 | 深入阅读文档 |
| :--- | :--- | :--- | :--- |
| **Phase 0<br>架构拓扑** | 建立 `src/features/<feature>/` 垂直切片骨架，配置 `package.json#exports` 语义子路径，杜绝根平铺。 | • 标准 7~8 件套目录骨架<br>• Client/Server 双语义出口 | `references/0-architecture-topology.md` |
| **Phase 1<br>数据建模** | 切片内定义模型（强制包含审计与软删除 8 基线字段），由 `@base/db-tenant` 聚合生成 Client，运行基线迁移。 | • `prisma/schema.prisma`<br>• `pnpm run db:migrate:generate` | `references/2-schema-migrate.md` |
| **Phase 2<br>纯数据契约** | 编写无 JSX、无 DOM 的纯数据契约，定义实体标识、受控字段枚举与页面操作契约。 | • Feature `contract.ts`<br>• 字段与动作单一事实源 (SSoT) | `references/1-contracts.md` |
| **Phase 3<br>服务与 Query** | 封装领域业务逻辑、软删除安全校验；建立 RSC server-only 读取与数据范围 SQL 物理下推入口。 | • Feature `service.ts` / `queries.ts`<br>• 业务单元测试同级通过 | `references/3-services.md` |
| **Phase 4<br>安全 Actions** | mutation 使用 `defineServerAction`，执行认证、CASL 守卫、操作人审计落库与跨端序列化防错。 | • Feature `actions.ts`<br>• 读取不绕 Server Action | `references/4-server-actions.md` |
| **Phase 5<br>高密度 UI** | 基于 `@base/ui` 构建；官方 CASL Provider（layout 注入）+ `useAbility`/积木；单次确认、Toast、零白屏。 | • Feature `ui/<Page>View.tsx`<br>• 无 permissions props，零全页刷新 | `references/5-ui-components.md`<br>`references/7-casl-ability-provider.md` |
| **Phase 6<br>路由与清单** | 租户端 `layout.tsx` 挂 `*AbilityBoundary`；page 纯只读拉取；`manifest.ts` 暴露受控页面与导航。 | • `apps/tenant/.../layout.tsx`<br>• `src/manifest.ts` + 静态清单更新 | `references/6-tenant-routing.md`<br>`references/7-casl-ability-provider.md` |
| **Phase 7<br>对齐单测** | 编写页面视图与契约 100% 对齐自动化单测，执行全栈门禁验证。 | • `<Page>View.test.tsx`<br>• `pnpm check` & `pnpm test` 全绿 | `references/6-tenant-routing.md` |

---

## 赛道二：平台基座与基础设施框架迭代指南 (Base & Platform Evolution)

当对底座基础设施包、数据演进引擎或应用装配内核进行升级改造时，必须遵循以下核心规范（详见 `references/8-base-infrastructure.md`）：

### 1. 基础设施核心模块职责拓扑

- **`@base/auth` (双端身份认证)**：基于 Better Auth + Organization 插件，负责登录凭据、Cookie 会话管理与租户组织成员资格维护；
- **`@base/authorization` (四层权限闭环)**：CASL 驱动准入门禁 (Gate)、功能操作 (Statement)、数据范围 SQL 物理下推 (Data Scope) 与字段三态策略 (Field Policy)，通过纯 JSON `AbilitySnapshot` 安全跨端并在客户端使用官方 `TenantAbilityProvider` 重建；
- **`@base/db-tenant` (动态多租户物理分库连接池)**：PostgreSQL Database-per-tenant 治理，`globalThis` 全局单例杜绝 HMR 句柄泄漏，`initializing` 互斥锁防止高并发初次连接击穿，`secretRef` 环境变量安全凭据解耦；
- **`@base/db-control` (总控库客户端)**：管理平台集中控制库 `saas_control`，服务于租户开辟、状态机管控与全局审计；
- **`tooling/db-migrate` (12-Factor 无状态预编译迁移引擎)**：构建期静态化预编译 `runtime-catalog.ts`，运行期 0 CLI 子进程；`@db-migrate-extension` 切片 Schema 动态聚合；Day 0 状态机自愈与 `pg_advisory_xact_lock` 事务咨询锁保障；
- **`@base/ui` (技术中立设计系统与组件库)**：技术基础设施保持完全中立，不硬编码具体视觉风格。原子层严格由 `npx shadcn@latest add` 维护，组合层沉淀 `DataTable` 企业级积木套件、`CrudFormModal` 三态表单、`EditableDetailTable` 明细表与声明式 `AuthGuard`；项目的具体视觉语言（如 Chenrun Digital ERP 风格）作为外部 Theme 资产在 `design-system/` 与 CSS 语义变量中配置注入；
- **`@base/biz-shared` (跨切片中台公共资产库)**：沉淀经 2 个以上业务切片验证的公共业务模式（如单据流水号系统、通用审批流契约、明细行业务表格模板）；
- **`@base/shared` (纯技术工具库)**：`Result<T, E>` 模式、`toPlainData` 跨端序列化防错与纯技术工具函数。

### 2. 基础设施演进四大铁律

1. **单向依赖红线**：基础设施包（`@base/*`）**绝对严禁**反向依赖任何业务切片（`packages/features/*`），依赖拓扑必须保持严格的自底向上单向流；
2. **抽象防腐原则**：基础设施层不承载特定业务字段（如 `quoteAmount`, `customerCode` 等）；通用业务抽象需经 2 个以上切片验证后方可提取至 `@base/biz-shared`；
3. **运行期轻量无状态**：杜绝运行期动态执行外部 CLI 工具，清单提取与 Schema 预编译必须收敛至构建期；
4. **三级共享递进体系**：
   - Level 1：`packages/shared` 与 `packages/ui`，纯技术无业务基础能力；
   - Level 2：`packages/biz-shared`，经真实场景验证的跨切片业务中台资产；
   - Level 3：业务集群内部 `src/shared/`，仅供本业务包内部多 Feature 复用。

---

## 渐进式深度阅读导航索引 (Progressive Disclosure Map)

| 阶段/领域 | 核心内容与适用场景 | 指南文档路径 |
| :--- | :--- | :--- |
| **切片架构骨架** | FDD 垂直切片规范、7~8 件套目录拓扑、exports 声明与平铺改造 SOP | `references/0-architecture-topology.md` |
| **纯数据契约** | 契约单一事实源、受控字段枚举、操作动作声明与 AbilityProvider 对接 | `references/1-contracts.md` |
| **数据建模与迁移** | 多租户物理分库、8 大审计与软删除基线字段 (ADR-009)、db-migrate 演进 | `references/2-schema-migrate.md` |
| **领域服务与 Query** | 领域业务封装、软删除过滤、RSC server-only Queries 读取与 SQL 范围下推 | `references/3-services.md` |
| **安全 Actions** | defineServerAction 包装、CASL 写路径守卫、落库操作人审计与序列化防错 | `references/4-server-actions.md` |
| **高密度工业风 UI** | DataTable 组合套件、CrudFormModal 三态表单、单次确认对话框、Toast 反馈 | `references/5-ui-components.md` |
| **路由与 Manifest** | 租户端/管控端路由、AbilityBoundary 注入、特性清单自发现与对齐单测 | `references/6-tenant-routing.md` |
| **官方 CASL 范式** | AbilitySnapshot 服务端生成、TenantAbilityProvider 注入与 useAbility 消费 | `references/7-casl-ability-provider.md` |
| **平台基座与基建** | @base/* 核心基础设施包迭代、TenantDbManager 治理、db-migrate 引擎演进 | `references/8-base-infrastructure.md` |
| **整体架构白皮书** | 系统全景设计、双平面运行模型、四大架构支柱与 ADR 权威总索引 | `docs/ARCHITECTURE.md` |
| **多租户分库深度解析** | Database-per-tenant 物理隔离、凭据解耦、并发防击穿与租户全生命周期 | `docs/architecture/saas-multitenant-architecture.md` |
| **权限系统全链路** | 四层权限闭环编译、SQL 自动下推、字段物理剥离与端到端交互时序 | `docs/permissions/permission-architecture-deep-dive.md` |
| **迁移引擎深度解析** | 12-Factor 原则、预编译 Catalog、Schema 聚合器与咨询锁机制 | `docs/architecture/database-migration-engine.md` |
