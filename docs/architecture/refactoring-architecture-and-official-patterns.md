# Next.js App Router 现代 SaaS 官方范式与全流程最佳实践技术规格书

> **文档定位**：本项目（晨润 ERP / 现代化多租户 SaaS 基座）目标架构规格书与实施宪法。约束 **CRUD / 列表 / 表单类业务切片** 的标准实现路径，对齐 Next.js App Router 官方数据流、React 官方服务端能力、Prisma 官方事务 API；**表格与表单交互层以本仓 `DataTable` / `FormModal` 强类型契约为唯一项目标准（对标 Element UI 的声明式、省心用法）**。
>
> **范式状态**：客户中心「客户档案」标杆已落地；**CRUD 范式固化如下**（新切片照抄，差异走逃生舱）：  
> `contract(defineListSearchParams) → schema → service → queries → createResourceActions → FormModal → DataTable(useListSearch) → createResourcePage`  
> 分层：`@base/ui`（组件 + list params）/ `@base/biz-shared`（`createResource*`）/ `@base/shared`（`defineServerAction`）/ `packages/domains/*`（业务）。**不单开 `@base/crud` 包。**
>
> **性能与 React 范式 companion**：实现与 Code Review 必须同时对照仓库内 **`.agents/skills/vercel-react-best-practices/`**（Vercel Engineering React/Next 性能规则集，70+ 条）。本文负责「业务切片怎么组装」；该 skill 负责「RSC / Action / Bundle / 重渲染怎么写才正确且快」。冲突时：安全红线（P0）优先，其次本文业务契约，再次 Vercel 性能规则。
>
> **文档性质**：这是**目标态规格**，不是已上线代码的快照。实现以本文“6 阶段流水线 + 质量门禁”为准；与旧文档冲突时，按下方「事实源优先级」裁决。

---

## 〇、事实源优先级与术语约定（Vibe Coding 必读）

### 1. 事实源优先级（冲突时从上到下）

| 优先级 | 事实源 | 约束范围 |
| :--- | :--- | :--- |
| **P0** | 根目录 `AGENTS.md` 工程红线 | 模块边界、租户隔离、CASL、序列化、禁裸 DOM / 原生 confirm、脚本必须 Node `.mjs` 等硬约束 |
| **P1** | **本文档** | 业务切片 CRUD 标准流水线、选型收敛、质量门禁、标杆代码契约 |
| **P1c** | **`.agents/skills/vercel-react-best-practices/`** | React/Next 性能与运行时正确性（瀑布流、RSC 序列化、Server Action 鉴权、`cache()` 语义、重渲染）。作为本文的强制 companion；与 P1 业务结构不冲突时 **Code Review 一票否决项** |
| **P2** | `docs/ARCHITECTURE.md`、`docs/architecture/fdd-vertical-slice-architecture.md` 等专项架构 | 系统全景、分库、权限闭环、迁移引擎原理 |
| **P3** | `.harness/features/**/scope.md`、`feature_list.json` 描述字段 | 单次特性任务边界；**若与 P0/P1 冲突，以 P0/P1 为准，并回写修正任务描述** |

实现 Agent 发现 P3 仍引用已作废 API（如 `useTableUrlState`、`parseTableSearchParams`）时：**按本文执行，并在任务 progress 中登记文档债**，不得为了“对齐旧描述”继续写胶水层。

阅读 Vercel skill 时优先加载与业务切片直接相关的规则文件（不必一次读完 70 条）：

| 优先级 | 规则文件 | 与标杆切片的关系 |
| :--- | :--- | :--- |
| CRITICAL | `server-auth-actions.md` | Server Action 必须内部鉴权，视同公开 API |
| CRITICAL | `async-parallel.md` / `async-suspense-boundaries.md` | 页面 `Promise.all` + 细粒度 Suspense |
| CRITICAL | `rerender-derived-state-no-effect.md` | 禁止 Client 镜像 data state |
| HIGH | `server-cache-react.md` | `React.cache()` 请求级去重与参数形态 |
| HIGH | `server-serialization.md` / `server-dedup-props.md` | RSC→Client 只传字段、避免重复序列化 |
| HIGH | `server-no-shared-module-state.md` | **多租户红线**：禁止模块级可变请求状态 |
| HIGH | `rerender-no-inline-components.md` | 禁止在组件内定义组件 |
| MEDIUM | `server-after-nonblocking.md` | 审计/分析用 `after()`，不阻塞 Action 响应 |
| MEDIUM | `rendering-usetransition-loading.md` / `rerender-transitions.md` | 用 `useTransition.isPending`，禁手动 loading state |
| MEDIUM | `bundle-barrel-imports.md` | 第三方大桶包（lucide 等）走 `optimizePackageImports` |

### 2. 术语：官方 vs 主流 vs 项目契约

本文对选型使用严格三类标签，避免把生态库神化成“Next.js 官方 API”：

| 标签 | 含义 | 示例 |
| :--- | :--- | :--- |
| **官方 (Official)** | Next.js / React / Prisma 等框架自身文档与 API | Server Actions、`revalidatePath`、React `cache()`、`<Suspense>`、Prisma `$transaction` |
| **主流 (Mainstream)** | 生态事实标准，Vercel / shadcn / 企业栈广泛采用 | nuqs、shadcn/ui、CASL |
| **项目契约 (Platform Contract)** | 本仓库基座导出、跨切片必须复用的封装（**对标 Element UI 的“组件即契约”体验**） | `defineServerAction`、`toPlainData`、`assertEditableFields`、**`DataTable`**、**`FormModal` + `FormFieldSchema`**、`TenantDbManager` |

### 3. 最高指导原则（收敛后的反造轮子原则）

> **禁止与成熟库同质的基础设施轮子；强制复用项目平台契约；业务领域逻辑允许且必须写在切片内。**

1. **禁止重复造基础设施轮子**：URL 状态用 nuqs；**表格/表单用 `DataTable` + `FormModal` 项目契约（Element UI 式声明式）**；事务用 Prisma `$transaction`；请求去重用 React `cache()`；**不得**再自研 `parseTableSearchParams`、`useTableUrlState`、私有 search DSL、业务层第二套表单/表格引擎。
2. **强制复用项目平台契约**：Server Action 必须 `defineServerAction`；跨端返回必须 `toPlainData`；字段写权限必须 `assertEditableFields`；**CRUD UI 必须 `DataTable` + `FormModal`**。这些是「Element UI 式省心封装」，不是被禁止的私有抽象。
3. **业务代码写在切片内**：编号规则、状态机、领域校验、报表字段裁剪属于 `packages/domains/<slice>/`，不要上浮到 `@base/ui` 或下沉进 app 路由。
4. **100% 对齐代码库真实导出 API**：文档与实现不得臆造不存在的方法；若发现基座缺少必要能力，走基座演进（显式声明 `workspace:*` 依赖），禁止在业务切片内复制一份近似实现。
5. **标杆即终态（当前阶段）**：未确定业务领域（物料、订单、采购）物理归档至 `.archive/`；代码区以 **客户中心 (`customer-center`)** 为唯一 0→1 黄金标杆切片。标杆落地后，其他领域按标杆模板重写，不维护双轨兼容层。

---

## 一、 官方成熟方案与全栈选型矩阵 (Technology Stack & SSoT)

全流程选型按「官方 / 主流 / 项目契约」标注。**优先官方 API；官方无一等公民方案时，锁定主流生态事实标准；平台契约用于补齐安全与序列化硬约束。**

| 业务环节与痛点 | 选型与标签 | 选用依据与权威事实源 | 核心实现模式 |
| :--- | :--- | :--- | :--- |
| **URL 参数解析与状态同步** | **nuqs**（主流） | [nuqs](https://nuqs.dev/)；App Router 社区与 Vercel 生态广泛采用；与 Next 15+ `searchParams: Promise<>` 兼容 | • 根布局：`apps/tenant/src/app/layout.tsx` 包裹 `<NuqsAdapter>`<br>• 服务端：`createSearchParamsCache` + 强类型 Parsers<br>• 客户端：`useQueryStates` 原子批量更新<br>• RSC 联动：`shallow: false` + `startTransition`（官方 Server Action / Transition 模型）<br>• 输入节流：`limitUrlUpdates: throttle(300)`，业务层不手写 debounce 工具库 |
| **数据表格与分页展示** | **分级策略**：<br>简单列表 → `@base/ui/data-table`（项目契约）<br>复杂表格 → **TanStack Table**（主流，shadcn data-table 官方路线底层引擎） | shadcn 官方 data-table 模式基于 TanStack Table；本项目 `@base/ui` 提供受控工业风复合层 | • **URL-as-State**：分页/筛选/关键词状态一律 nuqs，禁止 Client 镜像 `useState(data)`<br>• **简单列表**：纯受控 DataTable，仅接收服务端当前页 DTO<br>• **复杂表格**（多列排序/列显隐/列宽/批量选择/虚拟滚动）：允许在 `@base/ui` 或切片内基于 TanStack Table 组合，状态仍从 nuqs 映射<br>• **禁止**：自研 `useListUrlState` 类 hook 与 nuqs 双轨 |
| **CRUD 表格（项目契约，对标 el-table）** | **`@base/ui` `DataTable`** + 列配置 | 项目契约；`.agents/skills/next-saas-base-dev` | • **只传配置与数据**：`columns` + `data/total/page/pageSize` + 筛选回调<br>• URL 状态仍由 nuqs 驱动，DataTable 纯受控<br>• 禁止业务层手写 `<table>` 或自研表格壳 |
| **CRUD 弹窗表单（项目契约，对标 el-form）** | **`@base/ui` `FormModal` + `FormFieldSchema`/`FormModalSection` + Zod** | 项目契约；`packages/base/ui` README；skill 规则 16/17 | • **只传契约不传控件树**：`schema` + `fields`/`sections` + `initialValues` + `onSubmit`<br>• FormModal 内部 `safeParse` 运行时校验，三态 `create/edit/view` 合一<br>• `subject` + Ability 自动 CASL 字段三态（HIDDEN 剥离 / READONLY 禁用）<br>• **禁止**在切片内手写 Dialog+Input+Select 拼装胶水<br>• 复杂单据可 `detailConfig` 内置明细表；极端复杂表单才允许逃生舱自定义 JSX |
| **表单底层引擎（可选演进）** | React Hook Form（主流，**封装在 FormModal 内部**） | skill 规则 17(d) | 业务代码 **不直接** `useForm`；若超大动态表单需要 RHF，只允许替换 FormModal 内部引擎，**对外 API 仍是 schema+fields** |
| **自愈变更与安全防护** | **Next.js Server Actions**（官方）+ **CASL**（主流） | [Server Actions 官方文档](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)；[CASL](https://casl.js.org/v6/en/package/casl-prisma)；Vercel `server-auth-actions` | • Action **视同公开 API**，鉴权/授权必须在 Action **内部**完成，禁止只靠 middleware/layout 守卫<br>• `defineServerAction`（项目契约）包装<br>• 权限：动作级 `assert*Ability` + 字段级 `assertEditableFields(ability, Subject, payload)`<br>• 自愈：服务端 `revalidatePath`（见下文默认策略与例外）<br>• 客户端：`useTransition` 获得 `isPending`；**默认不写** `router.refresh()` |
| **服务端请求去重** | **React `cache()`**（官方） | [React Request Memoization](https://react.dev/reference/react/cache)；Vercel `server-cache-react` | 在切片 `assembly/context.ts` 用 **无参** `cache(async () => ...)` 包装租户上下文与 Ability；同一请求内多次调用零重复 DB。**禁止**给 `cache()` 传每次新建的内联对象参数（浅比较永远 miss） |
| **RSC 序列化与包体** | **DTO 投影 + 子路径导出**（官方/项目） | Vercel `server-serialization`、`server-dedup-props`、`bundle-barrel-imports` | • RSC→Client **只传 UI 用到的字段**，禁止整实体下推<br>• 禁止同一 RSC 同时传 `users` 与 `users.filter/map/toSorted` 派生副本<br>• 第三方图标等大桶包依赖 Next `optimizePackageImports`；切片 server 代码走 `.../server` 子路径，避免把 `queries` 打进 Client |
| **跨请求状态红线** | **禁止模块级可变请求状态**（官方/Vercel） | Vercel `server-no-shared-module-state`；本仓多租户分库 | 请求态（tenant、ability、client）只允许在 `React.cache()` 请求闭包或显式 props 中流转；**严禁** `let currentTenant` 类模块全局变量。跨请求 LRU 若使用，**cache key 必须含 `organizationId`**，否则构成跨租户泄露（P0） |
| **非阻塞旁路** | **`after()`**（Next 官方） | [after()](https://nextjs.org/docs/app/api-reference/functions/after)；Vercel `server-after-nonblocking.md` | 操作日志、分析埋点、通知等**不得**阻塞 Action 主返回；在 Service/事务成功后 `revalidatePath` + 返回，旁路副作用放入 `after()` |
| **事务并发与编号** | **Prisma `$transaction`**（官方） | [Prisma 事务与错误参考](https://www.prisma.io/docs/orm/overview/databases) | • 显式 `{ maxWait, timeout, isolationLevel }`<br>• 唯一键冲突捕获 `P2002`；编号生成**禁止** `count()+1`，使用 DB sequence / advisory lock / 稳定可排序 ID（见阶段 1） |

### revalidatePath 默认策略与允许例外

| 场景 | 默认做法 | 说明 |
| :--- | :--- | :--- |
| 标准列表 CRUD | Action 成功后服务端 `revalidatePath(<列表路由>)`；客户端只 `toast` + 关闭弹窗 | 官方自愈范式；客户端零编排刷新 |
| 列表 + 详情双入口 | Action 内 revalidate 列表与详情路径（或 layout 级 path） | 避免详情页陈旧 |
| 跨模块只读聚合（如工作台） | 由装配层页面单独 revalidate，或接受短期陈旧并在 UI 标注 | 不要求每个 Action revalidate 全站 |
| **例外** | 某些客户端富编辑器本地缓存、iframe 嵌入、需要保留的 client-only UI 状态，经评审后可显式 `router.refresh()` 或局部状态复位 | 例外必须在切片代码注释或 PR 说明中写明原因；**不是默认路径** |

### Vercel React Best Practices 强制映射（业务切片相关子集）

实现标杆切片时，下列规则视为 **P1c 门禁**（Review 可直接打回）。完整条文以 skill 目录为准：

| 阶段 | 必须遵守的 Vercel 规则 | 落地要点 |
| :--- | :--- | :--- |
| 阶段 2 Queries / Context | `server-cache-react`、`server-no-shared-module-state`、`server-parallel-fetching`、`async-parallel`、`server-serialization` | 无参 `cache()`；无模块级请求态；独立 IO 一律 `Promise.all` / 组件组合并行；DTO 字段投影 |
| 阶段 3 Actions | `server-auth-actions`、`async-defer-await`、`async-cheap-condition-before-await`、`server-after-nonblocking` | Action 内完整鉴权；廉价同步条件优先于昂贵 await；审计旁路 `after()` |
| 阶段 4 View | `rerender-derived-state-no-effect`、`rendering-usetransition-loading`、`rerender-no-inline-components`、`rerender-functional-setstate` | 禁止 data 镜像；`isPending` 来自 `useTransition`；列定义/子组件提升到模块级；`setModal` 用函数式更新 |
| 阶段 5 FormModal | `rerender-no-inline-components`、`rendering-conditional-render` | 错误分支用显式三元/早退；禁止组件内再定义组件 |
| 阶段 6 Page | `async-suspense-boundaries`、`server-parallel-fetching`、`server-dedup-props` | Suspense 只包数据区；Container 内 `Promise.all`；向 Client 只传列表/options 必要字段 |
| Bundle / 构建 | `bundle-barrel-imports`、`bundle-analyzable-paths` | 切片 `package.json` `exports` 显式子路径；图标等第三方依赖 Next `optimizePackageImports` |

**多租户特化（叠加在 Vercel 规则之上，属 P0）**：

1. 任何进程内缓存（模块 Map、LRU、`globalThis` 单例）的 key **必须**包含租户标识（`organizationId` / DB 名），或明确设计为「与租户无关的只读字典」。
2. `TenantDbManager` 连接池挂 `globalThis` 是**有意的**平台契约（对抗 HMR），但池内**不得**缓存某个租户的 Ability/Session 到模块全局。
3. 禁止用「上一次请求的 tenantCtx」填充全局变量——这是 `server-no-shared-module-state` 在本仓最危险的失败模式。

---

## 二、 现状纠偏与工作区纯净拓扑

### 1. 现状纠偏事实清单

- **原子层已解锁**：`@base/ui` 为标准语义化目录（`ui/`、`data-table/`、`form/`、`auth/`、`layout/` 等），无哈希不可变锁。
- **物理归档**：未确定业务领域（物料、订单、采购）及对应租户路由归档至 `.archive/`，不占用活跃开发上下文。
- **驱动与迁移**：租户 Schema 聚合引擎仍扫描 `.archive/domains/` 模型以对齐历史迁移基线；归档 ≠ 可删除 Schema。
- **包命名契约**：物理目录与 npm 包名不强制同名，以 `package.json` 的 `name` 为导入真理源：

| 物理目录 | npm 包名（导入用） |
| :--- | :--- |
| `packages/domains/customer-center` | `@base/feature-customer-center` |
| `packages/platform/control-admin` | `@base/feature-control-admin` |
| `packages/platform/tenant-admin` | `@base/feature-tenant-admin` |
| `packages/base/ui` 等 | `@base/ui`、`@base/auth`、`@base/authorization`、`@base/db-tenant`、`@base/shared` |

### 2. 纯净项目工作区拓扑（目标态）

```text
chenrun-erp-nextjs/
├── .archive/                                # 物理归档区（Schema 仍被迁移引擎扫描）
│   ├── domains/                             # material / order / procurement ...
│   └── routes/                              # 对应 App Router 页面归档
│
├── apps/
│   ├── control/                             # 平台管控平面
│   └── tenant/                              # 租户数据平面
│       └── src/
│           ├── app/
│           │   ├── layout.tsx               # 注入 <NuqsAdapter>
│           │   └── (dashboard)/
│           │       ├── customer/            # 【唯一活跃黄金标杆业务域】
│           │       │   ├── customers/       # 客户档案（规范演示）
│           │       │   ├── stores/          # 门店档案
│           │       │   ├── categories-tags/ # 客户分类与标签
│           │       │   └── quotes/          # 报价单
│           │       ├── settings/
│           │       ├── organization/
│           │       └── workbench/
│           └── kernel/
│               └── registry.generated.ts    # 构建期自发现注册活跃切片
│
├── packages/
│   ├── base/
│   │   ├── auth/                            # Better Auth
│   │   ├── authorization/                   # CASL（assertEditableFields 等）
│   │   ├── db-tenant/                       # TenantDbManager 分库路由
│   │   ├── db-control/                      # 总控库客户端
│   │   ├── shared/                          # defineServerAction / toPlainData
│   │   ├── biz-shared/                      # 跨切片业务中台资产
│   │   └── ui/                              # shadcn 原语 + 受控 DataTable
│   │
│   ├── platform/
│   │   ├── control-admin/                   # @base/feature-control-admin
│   │   └── tenant-admin/                    # @base/feature-tenant-admin
│   │
│   └── domains/
│       └── customer-center/                 # @base/feature-customer-center
│           ├── prisma/schema.prisma
│           ├── src/
│           │   ├── assembly/                # 租户上下文（React cache 记忆化）
│           │   │   └── context.ts
│           │   ├── features/
│           │   │   └── customer-management/
│           │   │       ├── contract.ts      # 【契约 SSoT】权限 + 列表 URL（customerSearchParams）
│           │   │       ├── contract.ts      # CASL 权限契约 SSoT
│           │   │       ├── schema.ts        # 共享 Zod Schema
│           │   │       ├── types.ts         # z.infer 纯数据 DTO
│           │   │       ├── service.ts       # Prisma 事务 / 编号 / 业务写
│           │   │       ├── queries.ts       # server-only 查询（DTO 投影）
│           │   │       ├── actions.ts       # defineServerAction + CASL + revalidate
│           │   │       ├── __tests__/       # 与实现就近共存（Colocation）
│           │   │       └── ui/              # 受控列表视图 + FormModal
│           │   ├── manifest.ts
│           │   ├── catalog.ts
│           │   └── index.ts                 # Client-safe 导出
│           └── package.json                 # "name": "@base/feature-customer-center"
│
└── tooling/db-migrate/                      # 12-Factor 无状态迁移引擎
```

**切片对外导出约定**：

- `index.ts`：Client-safe 组件与类型（如 `CustomerView`、schema 类型）；
- 子路径 `.../server`（或 `public.server.ts`）：`queries.ts` 等 server-only 入口，禁止被 Client 组件直接引用；
- 页面（RSC）可同时 import 两者；Client 组件只 import Client-safe 入口。

---

## 三、 基于真实 API 的全流程 6 阶段实现范式

CRUD 业务流固定为 6 阶段。Agent 按阶段顺序实现，**禁止跳过权限与服务端校验**。

```text
阶段 0  search-params.ts     nuqs 强类型 URL 契约（RSC/Client 共享）
阶段 1  service.ts           Prisma 事务 + 稳定发号 + 业务不变量
阶段 2  context.ts/queries   React cache 记忆化 + Promise.all + DTO 投影
阶段 3  actions.ts           defineServerAction + Zod + CASL + revalidatePath
阶段 4  ui/*View.tsx         nuqs 驱动纯受控列表（零 data 镜像 state）
阶段 5  ui/*FormModal.tsx    FormModal + Zod + FormFieldSchema 声明式契约表单
阶段 6  apps page.tsx        强类型 parse searchParams + Suspense 流式装配
```

---

## 四、 核心阶段真实对齐生产级代码（标杆契约）

> 包导入以 `package.json` 的 `name` 为准：`@base/feature-customer-center`。  
> 下列代码为**目标态标杆**；实现时以基座真实导出签名为准，发现签名不一致则先改调用对齐基座，禁止复制一份平行 API。

### 阶段 0：列表 URL 契约并入 `contract.ts`（约定大于配置）

```typescript
// packages/domains/customer-center/src/features/customer-management/contract.ts
import { defineListSearchParams } from "@base/ui";

/** page/pageSize/keyword 基座默认自带；业务只写默认值，无需 import nuqs parser */
export const customerSearchParams = defineListSearchParams({
  category: "",
  status: "",
});
```

**Next.js 对齐要点**：

| 点 | 范式 |
| :--- | :--- |
| `page` 为 async，`searchParams: Promise<>` | App Router 官方 |
| RSC 取数 → Client 只收纯 DTO | 官方序列化边界 |
| `defineListSearchParams` 放在 **server-safe** 模块 | RSC contract 可引用，禁止从 `use client` 文件导出契约 |
| URL 状态 nuqs + `startTransition` | 主流；官方无一等公民 URL state |
| Server Action + `revalidatePath` | 官方 mutation 自愈 |

**门禁**：

- **禁止**再单独建 `search-params.ts`；列表 URL 与权限字段同属 `contract.ts` 契约；
- 业务扩展只写默认值：`defineListSearchParams({ category: "", status: "" })`；
- 禁止业务页手写 page/keyword parser；禁止从 `@base/ui` 桶再导出 nuqs parser 给业务用；
- Client：`useListSearch(customerSearchParams)` + `DataTable {...list.dataTableProps}`；
- RSC → Client 禁止 Promise props。

---

### 阶段 1：Prisma 事务与稳定发号 (`service.ts`)

**禁止**使用 `count() + 1` 生成业务编码。并发创建会高频撞号，且软删除会导致序列回退。标杆采用 **PostgreSQL sequence** 或 **advisory lock + 日序列**。

```typescript
// packages/domains/customer-center/src/features/customer-management/service.ts
import { PrismaClientKnownRequestError } from "@base/db-tenant";
import type { Prisma, TenantPrismaClient } from "@base/db-tenant";
import type { CreateCustomerInput } from "./types";

type Tx = Prisma.TransactionClient;

export class CustomerService {
  /**
   * 创建客户：事务包裹 + 稳定发号 + P2002 退避重试（最多 3 次）。
   * 发号唯一性依赖 DB sequence/唯一索引，不依赖 count。
   */
  static async createCustomer(
    prisma: TenantPrismaClient,
    input: CreateCustomerInput,
    context: { userId: string; deptId: string | null },
  ) {
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await prisma.$transaction(
          async (tx: Tx) => {
            const customerCode = await this.generateCustomerCode(tx);

            const customer = await tx.customer.create({
              data: {
                customerCode,
                customerName: input.customerName,
                customerCategoryId: input.categoryId,
                settlementType: input.settlementType,
                contactPerson: input.contactPerson,
                contactPhone: input.contactPhone,
                status: "ACTIVE",
                createdById: context.userId,
                updatedById: context.userId,
                departmentId: context.deptId,
              },
            });

            if (input.tagIds?.length) {
              await tx.customerTagAssignment.createMany({
                data: input.tagIds.map((tagId) => ({
                  customerCode: customer.customerCode,
                  tagId,
                  createdById: context.userId,
                })),
              });
            }

            return customer;
          },
          {
            maxWait: 5000,
            timeout: 10000,
            // 编号依赖 sequence 时，默认 ReadCommitted 足够；
            // 若业务不变量要求更高，可升为 Serializable 并在注释中说明原因。
            isolationLevel: "ReadCommitted",
          },
        );
      } catch (error) {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          attempt < maxRetries
        ) {
          // 指数退避：仅用于唯一键冲突（如并发撞号）
          await new Promise((resolve) => setTimeout(resolve, attempt * 50));
          continue;
        }
        throw error;
      }
    }

    throw new Error("createCustomer: retries exhausted");
  }

  /**
   * 稳定发号：CUST-YYYYMMDD-####
   * 优先：DB sequence（迁移中创建）。
   * 备选：pg_advisory_xact_lock + 按日计数表（计数表有唯一约束）。
   * 禁止：SELECT count(*) FROM customer。
   */
  private static async generateCustomerCode(tx: Tx): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    // 标杆实现：使用租户库 sequence（迁移引擎已创建）nextval
    // 若基座尚未暴露 sequence 包装，使用 $queryRaw 调用 nextval，禁止改回 count。
    const rows = await tx.$queryRaw<{ nextval: bigint }[]>`
      SELECT nextval('customer_code_seq') AS nextval
    `;
    const seq = rows[0]?.nextval ?? 0n;

    return `CUST-${today}-${String(seq).padStart(6, "0")}`;
  }
}
```

**发号选型门禁**：

| 允许 | 禁止 |
| :--- | :--- |
| DB `SEQUENCE` / `IDENTITY` | `count(*) + 1` |
| advisory lock + 唯一计数表 | 无锁读 max(code) 再 +1 |
| ULID/UUID + 业务前缀（不要求可读连续号时） | 客户端生成编码后直接落库 |

迁移中创建 sequence 属于切片 Schema 职责（`tooling/db-migrate` 聚合），不得在运行期动态 `CREATE SEQUENCE`。

---

### 阶段 2：请求记忆化与消除瀑布流 (`context.ts` / `queries.ts`)

```typescript
// packages/domains/customer-center/src/assembly/context.ts
import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { getCurrentTenantContext, getServerAuthRuntime } from "@base/auth";
import { CaslAbilityFactory } from "@base/authorization";
import { getTenantDbManager, resolveEmployeeTopology } from "@base/db-tenant";
import { customerCatalog } from "../catalog";

/**
 * Vercel server-cache-react：请求级去重。
 * 必须无参调用——cache() 按 Object.is 比较参数；内联对象参数会导致永远 miss。
 * Vercel server-no-shared-module-state：结果只存在于本请求闭包，禁止写入模块级变量。
 */
export const getTenantCustomerContext = cache(async () => {
  const reqHeaders = await headers();
  const tenantCtx = await getCurrentTenantContext(reqHeaders);
  const authRuntime = getServerAuthRuntime();
  const manager = getTenantDbManager({
    repository: authRuntime.tenantContextRepository,
  });
  const client = await manager.getClient(tenantCtx.organizationId);

  const topology = await resolveEmployeeTopology(
    {
      findEmployeeProfile: (memberId) =>
        client.employeeProfile.findUnique({
          where: { memberId },
          select: {
            id: true,
            memberId: true,
            departmentId: true,
            employeeNo: true,
            jobTitle: true,
            status: true,
          },
        }),
      findAllDepartments: () =>
        client.department.findMany({ select: { id: true, parentId: true } }),
    },
    { userId: tenantCtx.user.id, memberId: tenantCtx.member.id },
  );

  const factory = new CaslAbilityFactory(
    authRuntime.tenantContextRepository,
    customerCatalog,
  );
  const ability = await factory.createPrismaAbilityForTenant(
    tenantCtx,
    topology,
  );

  return {
    tenantCtx,
    client,
    ability,
    userId: tenantCtx.user.id,
    memberId: tenantCtx.member.id,
    employeeProfile: topology,
  };
});
```

```typescript
// packages/domains/customer-center/src/features/customer-management/queries.ts
import "server-only";
import { getTenantCustomerContext } from "../../assembly/context";
import type { CustomerListItem } from "./types";

/** 列表查询：必选 DTO 投影（Vercel server-serialization），Decimal→number，Date→ISO string */
export async function listCustomersQuery(input: {
  page: number;
  pageSize: number;
  keyword: string;
  categoryCode: string;
  status: string;
}): Promise<{ items: CustomerListItem[]; total: number }> {
  const { client } = await getTenantCustomerContext();
  const { page, pageSize, keyword, categoryCode, status } = input;

  const where = {
    AND: [
      keyword
        ? {
            OR: [
              { customerCode: { contains: keyword, mode: "insensitive" as const } },
              { customerName: { contains: keyword, mode: "insensitive" as const } },
            ],
          }
        : {},
      categoryCode ? { customerCategory: { categoryCode } } : {},
      status ? { status } : {},
    ],
  };

  // Vercel async-parallel：count 与 findMany 无相互依赖，必须并行
  const [rows, total] = await Promise.all([
    client.customer.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: "desc" },
      select: {
        customerCode: true,
        customerName: true,
        status: true,
        settlementType: true,
        contactPerson: true,
        contactPhone: true,
        updatedAt: true,
        customerCategory: { select: { categoryCode: true, categoryName: true } },
      },
    }),
    client.customer.count({ where }),
  ]);

  return {
    total,
    items: rows.map((row) => ({
      customerCode: row.customerCode,
      customerName: row.customerName,
      status: row.status,
      settlementType: row.settlementType,
      contactPerson: row.contactPerson,
      contactPhone: row.contactPhone,
      categoryName: row.customerCategory?.categoryName ?? "",
      updatedAt: row.updatedAt.toISOString(),
    })),
  };
}

export async function getCustomerPageOptionsQuery() {
  const { client } = await getTenantCustomerContext();
  // options 与列表查询在页面层 Promise.all 并行；此处仅示例内部并行
  const [categories, tags] = await Promise.all([
    client.customerCategory.findMany({
      select: { categoryCode: true, categoryName: true },
      orderBy: { categoryName: "asc" },
    }),
    // 若标签模型尚未就绪可返回 []；就绪后替换为真实查询
    Promise.resolve([] as Array<{ tagCode: string; tagName: string }>),
  ]);
  return { categoryOptions: categories, tagOptions: tags };
}
```

**门禁（含 Vercel P1c）**：

- `queries.ts` 顶部必须 `import "server-only"`；
- 禁止返回 Prisma 实体 / Decimal / Date 直通 Client（`server-serialization`）；
- 页面层对列表与 options 使用 `Promise.all`；Query 内部独立 IO 也必须并行（`async-parallel`）；
- **禁止**把 Ability/tenant 写入模块级变量（`server-no-shared-module-state`）；
- `cache()` 包装的函数优先无参；若必须传参，使用稳定原语或固定引用。

---

### 阶段 3：自愈型原子 Server Action (`actions.ts`)

```typescript
// packages/domains/customer-center/src/features/customer-management/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { defineServerAction, toPlainData } from "@base/shared";
import { assertEditableFields, StandardAction } from "@base/authorization";
import { getTenantCustomerContext } from "../../assembly/context";
import { assertCustomerAbility } from "../../assembly/context";
import { CustomerField, CustomerSubject } from "./contract";
import { customerInputSchema } from "./schema";
import { CustomerService } from "./service";

const CONTROLLED_FIELDS = new Set<string>(Object.values(CustomerField));

function extractControlledPayload(
  input: Record<string: unknown>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined && CONTROLLED_FIELDS.has(k)) payload[k] = v;
  }
  return payload;
}

export const createCustomerAction = defineServerAction(
  async (rawInput: unknown) => {
    // Vercel server-auth-actions：Action 视同公开 API，鉴权必须在函数体内。
    // defineServerAction 会取上下文并包装错误，但 Ability/字段断言不可省略。
    const { client, ability, userId } = await getTenantCustomerContext();

    // 1. 动作权限（签名以基座真实导出为准）
    assertCustomerAbility(ability, StandardAction.CREATE, CustomerSubject);

    // 2. 服务端 Zod（客户端 RHF 不能替代）
    const input = customerInputSchema.parse(rawInput);

    // 3. 字段级防篡改（项目契约，禁止省略）
    assertEditableFields(
      ability,
      CustomerSubject,
      extractControlledPayload(input),
    );

    // 4. 业务写入（service 内事务 + 发号）
    const created = await CustomerService.createCustomer(client, input, {
      userId,
      deptId: null,
    });

    // 5. 官方自愈：服务端刷新列表路由；客户端默认零 refresh()
    revalidatePath("/customer/customers");

    // 6. Vercel server-after-nonblocking：审计/分析不得阻塞主返回
    after(async () => {
      // 示例：写操作审计（基座若已有 AOP 审计可删除本段，禁止双写）
      // await writeAuditLog({ action: "customer.create", userId, entityId: created.customerCode });
    });

    return toPlainData(created);
  },
  "创建客户失败",
);
```

**门禁（含 Vercel P1c）**：

- Action 必须 `defineServerAction` + 成功路径 `toPlainData`；
- **禁止**仅依赖 middleware/layout 守卫——每个 Action 内部必须完成 authn+authz（`server-auth-actions`）；
- 读路径不走 Action（RSC 直调 query）；
- 校验顺序固定：获取上下文 → Ability → Zod → 字段 CASL → Service → revalidate →（可选）`after` 旁路；
- 廉价同步校验（如 `mode === "view"`、payload 是否含受控字段）放在昂贵 IO **之前**（`async-cheap-condition-before-await`）；
- `revalidatePath` 使用真实路由字面量或由切片导出的路由常量，禁止 magic string 复制粘贴多处不一致；
- 模块顶层不得缓存「当前租户 client/ability」。

---

### 阶段 4：nuqs 驱动纯受控列表视图 (`ui/CustomerView.tsx`)

```tsx
// packages/domains/customer-center/src/features/customer-management/ui/CustomerView.tsx
"use client";

import React, { useState, useTransition } from "react";
import { useQueryStates, throttle } from "nuqs";
import {
  DataTable,
  DataTableRowActions,
  DataTableInputGroup,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  ConfirmDialog,
  toast,
} from "@base/ui";
import { customerSearchParams } from "../search-params";
import { CustomerSubject, MasterDataStatus } from "../contract";
import { deleteCustomerAction } from "../actions";
import { CustomerFormModal } from "./CustomerFormModal";
import type { CustomerListItem, CustomerPageOptions } from "../types";

export function CustomerView({
  data,
  total,
  categoryOptions,
}: {
  data: CustomerListItem[];
  total: number;
} & CustomerPageOptions) {
  const [isPending, startTransition] = useTransition();

  // URL-as-State：官方 Transition 模型拿 isPending；禁止 data 镜像 useState
  const [params, setParams] = useQueryStates(customerSearchParams, {
    shallow: false,
    startTransition,
    limitUrlUpdates: throttle(300),
  });

  // 搜索草稿：仅输入框本地；Enter/查询按钮才写入 URL
  const [keywordDraft, setKeywordDraft] = useState(params.keyword);

  const [modal, setModal] = useState<{
    open: boolean;
    mode: "create" | "edit" | "view";
    record?: CustomerListItem;
  }>({ open: false, mode: "create" });

  const [deleteTarget, setDeleteTarget] = useState<CustomerListItem | null>(
    null,
  );

  const columns = [
    {
      id: "customerCode",
      header: "客户编码",
      cell: (c: CustomerListItem) => c.customerCode,
    },
    {
      id: "customerName",
      header: "客户名称",
      cell: (c: CustomerListItem) => c.customerName,
    },
    {
      id: "status",
      header: "状态",
      cell: (c: CustomerListItem) => (
        <Badge
          variant={c.status === MasterDataStatus.ACTIVE ? "success" : "muted"}
        >
          {c.status === MasterDataStatus.ACTIVE ? "正常" : "已停用"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "操作",
      cell: (c: CustomerListItem) => (
        <DataTableRowActions
          record={c}
          subject={CustomerSubject}
          onView={() => setModal({ open: true, mode: "view", record: c })}
          onEdit={() => setModal({ open: true, mode: "edit", record: c })}
          onDelete={() => setDeleteTarget(c)}
        />
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="客户档案"
        description="维护企业客户主数据、结算方式与分类标签。"
        data={data}
        total={total}
        page={params.page}
        pageSize={params.pageSize}
        columns={columns}
        rowKey={(c: CustomerListItem) => c.customerCode}
        onPageChange={(nextPage, nextPageSize) =>
          setParams({ page: nextPage, pageSize: nextPageSize })
        }
        isLoading={isPending}
        keywordPlaceholder="搜索客户编码、名称..."
        keywordValue={keywordDraft}
        onKeywordChange={setKeywordDraft}
        onSearch={() => setParams({ keyword: keywordDraft, page: 1 })}
        onReset={() => {
          setKeywordDraft("");
          setParams({ keyword: "", category: "", status: "", page: 1 });
        }}
        statusOptions={[
          { value: MasterDataStatus.ACTIVE, label: "正常" },
          { value: MasterDataStatus.DISABLED, label: "已停用" },
        ]}
        statusValue={params.status}
        onStatusChange={(status) => setParams({ status, page: 1 })}
        filterExtra={
          <DataTableInputGroup label="客户分类" className="w-48">
            <Select
              value={params.category || "ALL"}
              onValueChange={(val) =>
                setParams({ category: val === "ALL" ? "" : val, page: 1 })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部</SelectItem>
                {categoryOptions.map((c) => (
                  <SelectItem key={c.categoryCode} value={c.categoryCode}>
                    {c.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DataTableInputGroup>
        }
        onCreate={() => setModal({ open: true, mode: "create" })}
      />

      {modal.open && (
        <CustomerFormModal
          open={modal.open}
          mode={modal.mode}
          record={modal.record}
          categoryOptions={categoryOptions}
          onClose={() => setModal((prev) => ({ ...prev, open: false }))}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="删除客户"
        description={
          deleteTarget
            ? `确认删除客户「${deleteTarget.customerName}」？此操作不可恢复。`
            : ""
        }
        onConfirm={() => {
          const target = deleteTarget;
          if (!target) return;
          startTransition(async () => {
            const res = await deleteCustomerAction(target.customerCode);
            if (res.success) {
              toast.success("客户已删除");
              setDeleteTarget(null);
            }
          });
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
```

**门禁（含 Vercel P1c）**：

- 禁止 `useState(props.data)` / `useEffect` 里 `setData(props)`（`rerender-derived-state-no-effect`）；
- 加载态使用 `useTransition` 的 `isPending`，禁止再手写 `const [isLoading, setIsLoading] = useState(false)`（`rendering-usetransition-loading`）；
- **禁止在 `CustomerView` 函数体内再定义组件**（如 `const Row = () => ...`）；列 `cell` 若需子组件，提取到模块级并传 props（`rerender-no-inline-components`）；
- `setModal` / `setDeleteTarget` 使用函数式更新，避免闭包过期（`rerender-functional-setstate`）；
- 破坏性操作必须 `ConfirmDialog`（AGENTS 红线），禁止 `window.confirm`；
- DataTableProps 字段名以 `@base/ui` 真实导出为准，不得臆造 `onKeywordChange` 等；若真实 prop 名不同，改调用而不是改文档发明新 API。

---

### 阶段 5：契约驱动三态表单 (`ui/CustomerFormModal.tsx`)

> **UX 目标（对标 Element UI）**：业务侧只写「强类型字段契约 + Zod + 提交」，**不写** Dialog/Input/Select 控件树。  
> 仓库真实标杆：`packages/domains/customer-center/.../CustomerFormModal.tsx` 已使用 `FormModal`。

**Element UI 心智映射：**

| Element UI | 本仓项目契约 |
| :--- | :--- |
| `el-table` + `el-table-column` | `DataTable` + `columns` 配置（阶段 4） |
| `el-form` + `el-form-item` | `FormModal` + `FormFieldSchema[]` / `FormModalSection[]` |
| `el-form` rules | 切片 Zod `schema`，FormModal 内部 `safeParse` |
| `el-dialog` 多态 | `FormModal mode="create" \| "edit" \| "view"` |
| 字段权限 | `subject={XxxSubject}` → CASL HIDDEN/READONLY 自动闭环 |

```tsx
// packages/domains/customer-center/src/features/customer-management/ui/CustomerFormModal.tsx
"use client";

import React, { useMemo } from "react";
import {
  z,
  FormModal,
  type FormModalMode,
  type FormModalSection,
  type FormFieldSchema,
  toast,
} from "@base/ui";
import { CustomerSubject } from "../contract";
import { createCustomerAction, updateCustomerAction } from "../actions";
import type { CustomerListItem } from "../types";

export const customerInputSchema = z.object({
  customerName: z.string().min(1, "客户名称为必填项"),
  categoryCode: z.string().min(1, "请选择客户分类"),
  contactPerson: z.string().min(1, "联系人为必填项"),
  contactPhone: z
    .string()
    .min(1, "联系电话为必填项")
    .regex(/^1[3-9]\d{9}$/, "请输入合法的11位手机号码"),
  settlementType: z.enum(["MONTHLY", "CASH", "PREPAID"]),
});

export type CustomerInput = z.infer<typeof customerInputSchema>;

export function CustomerFormModal({
  open,
  mode,
  record,
  categoryOptions,
  onClose,
}: {
  open: boolean;
  mode: FormModalMode;
  record?: CustomerListItem | null;
  categoryOptions: ReadonlyArray<{
    categoryCode: string;
    categoryName: string;
  }>;
  onClose: () => void;
}) {
  const isCreate = mode === "create";

  const initialValues = useMemo<CustomerInput>(
    () =>
      isCreate
        ? {
            customerName: "",
            categoryCode: categoryOptions[0]?.categoryCode ?? "",
            contactPerson: "",
            contactPhone: "",
            settlementType: "MONTHLY",
          }
        : {
            customerName: record?.customerName ?? "",
            categoryCode: record?.categoryCode ?? "",
            contactPerson: record?.contactPerson ?? "",
            contactPhone: record?.contactPhone ?? "",
            settlementType:
              (record?.settlementType as CustomerInput["settlementType"]) ??
              "MONTHLY",
          },
    [isCreate, record, categoryOptions],
  );

  // 强类型字段契约：像 el-form-item 一样声明，不写控件 JSX
  const sections = useMemo<FormModalSection[]>(
    () => [
      {
        title: "基础信息",
        columns: 2,
        fields: [
          ...(!isCreate && record?.customerCode
            ? [
                {
                  name: "customerCode",
                  label: "客户编码",
                  type: "text" as const,
                  disabled: true,
                  hint: "系统自动生成，不可人工修改",
                } satisfies FormFieldSchema,
              ]
            : []),
          {
            name: "customerName",
            label: "客户名称",
            type: "text",
            required: true,
            placeholder: "如：绿叶餐饮管理有限公司",
          },
          {
            name: "categoryCode",
            label: "客户分类",
            type: "select",
            required: true,
            options: categoryOptions.map((c) => ({
              value: c.categoryCode,
              label: c.categoryName,
            })),
          },
          {
            name: "contactPerson",
            label: "联系人",
            type: "text",
            required: true,
          },
          {
            name: "contactPhone",
            label: "联系电话",
            type: "text",
            required: true,
            placeholder: "11 位手机号",
          },
          {
            name: "settlementType",
            label: "结算方式",
            type: "select",
            required: true,
            options: [
              { value: "MONTHLY", label: "月结" },
              { value: "CASH", label: "现结" },
              { value: "PREPAID", label: "预付款" },
            ],
          },
        ],
      },
    ],
    [isCreate, record?.customerCode, categoryOptions],
  );

  return (
    <FormModal<CustomerInput>
      open={open}
      mode={mode}
      subject={CustomerSubject}
      title={
        isCreate
          ? "新建客户档案"
          : mode === "edit"
            ? "编辑客户档案"
            : "客户档案详情"
      }
      schema={customerInputSchema}
      sections={sections}
      initialValues={initialValues}
      onClose={onClose}
      onSubmit={async (values) => {
        const res = isCreate
          ? await createCustomerAction(values)
          : await updateCustomerAction(record?.customerCode ?? "", values);
        if (!res.success) {
          toast.error(res.error || "保存失败");
          throw new Error(res.error || "保存失败");
        }
        toast.success(isCreate ? "客户创建成功" : "客户更新成功");
        onClose();
      }}
    />
  );
}
```

**门禁（Element-UI 式契约）**：

- **业务切片禁止**手写 `Dialog`/`Input`/`Select`/`FieldGroup` 表单树实现 CRUD 弹窗；
- **必须** `FormModal` + `schema` + `fields`/`sections`；`subject` 必传以便字段权限闭环；
- 字段类型仅使用 `FormFieldSchema` 已支持的：`text|number|date|password|select|combobox|textarea|checkbox|switch|radio|custom`；
- 多选标签等复杂控件用 `type: "custom"` + `render` 挂 `TagMultiSelect` 等 `@base/ui` 组件，**仍由 FormModal 托管布局/校验/权限**；
- 单据明细行用 `detailConfig` + `DetailTable`，禁止业务层自拼明细表格；
- FormModal/DataTable 缺能力 → **增强 `@base/ui` 契约**，禁止业务侧第二套表单引擎；
- RHF 仅允许演进为 FormModal **内部实现**，业务代码不得直接 `useForm`。

---

### 阶段 4/6：DataTable 封装布局 + RSC 装配（禁止手绘壳）

> **UI 契约（Element UI 式）**：列表 chrome 100% 由 `@base/ui` `DataTable` 渲染，业务切片**禁止**手绘标题栏/筛选条/工具栏，也**禁止**业务侧再建 ListShell/TableRegion。

#### 默认能力（每个列表默认自带，业务无需手写）

| 能力 | 入口 | 说明 |
| :--- | :--- | :--- |
| 关键字搜索 | 筛选栏 `keywordValue` / `onSearch` | Enter 或「查询」触发 |
| 新增 | 工具栏 `onCreate` / `createText` | 受 CASL `create` 控制 |
| 刷新 | 工具栏 `onRefresh` | 默认展示 |
| 导出 | 工具栏 `onExport` | 受 CASL `export` 控制 |
| 列设置 | 工具栏内置 | 默认展示 |
| 分页 | `page` / `pageSize` / `total` / `onPageChange` | 服务端分页受控 |

标准布局：

```text
┌ Header: 标题 + 描述 ─────────────────────────────┐
│ 工具栏（右）：刷新 | 导出 | 列设置 | 新增         │
├ 筛选栏 ─────────────────────────────────────────┤
│ [关键字] [查询] [重置]  + 扩展插槽(状态/分类…)   │
├ 表体 ───────────────────────────────────────────┤
│ 分页                                             │
└─────────────────────────────────────────────────┘
```

#### 扩展插槽 + URL 契约（少即是多 / 约定大于配置）

「扩展」= 在默认能力**之上叠加**筛选/动作，**不得**把搜索/新增/刷新/导出/列设置收进抽屉。

| 契约 | 位置 | 说明 |
| :--- | :--- | :--- |
| `defineListSearchParams` | `@base/ui` | 默认自带 page/pageSize/keyword；业务只写扩展字段 |
| `useListSearch` | `@base/ui` | nuqs + transition + throttle + `dataTableProps` |
| `DataTable` | `@base/ui` | 默认 chrome + `filterExtra`/`statusOptions`/`toolbarExtra` 叠加 |

业务侧标准写法：

```ts
// contract.ts — 只写扩展默认值
export const customerSearchParams = defineListSearchParams({
  category: "",
  status: "",
});
```

```tsx
// CustomerView.tsx
const list = useListSearch(customerSearchParams);
<DataTable
  data={data}
  columns={columns}
  total={total}
  {...list.dataTableProps}
  statusValue={String(list.params.status ?? "")}
  onStatusChange={(v) => list.patch({ status: v || "" })}
  filterExtra={<客户分类 Select />}
  onCreate={...}
  onExport={...}
/>
```

**门禁**：

- 通用列表逻辑只沉淀在 `@base/ui`（`DataTable` + `defineListSearchParams` / `useListSearch`）；
- 禁止业务侧 ListShell/TableRegion/手绘 chrome；禁止每页手写 page/keyword parser 与 nuqs 样板；
- 默认能力必须始终可见；扩展=叠加插槽；
- 禁止 RSC → Client 透传 Promise props；表单 FormModal + schema + fields。

### 资源化 CRUD 约定层（`@base/biz-shared`，不单开包）

> **版式**：不新建 `@base/crud` 独立包。列表 URL 状态在 `@base/ui`；Action/List/Page 工厂在 `@base/biz-shared`（依赖 ui/authorization/shared）。这更贴合本仓 `packages/base/*` 分层，也符合主流 monorepo「不按业务功能碎片化建包」的做法。

```text
@base/ui          DataTable / FormModal / defineListSearchParams / useListSearch
                  （别名 defineListParams / useListParams）
@base/biz-shared  createResourceActions / createResourceList / createResourcePage
@base/shared      defineServerAction / toPlainData
业务切片           contract + schema + service/query + 平铺 re-export actions
```

| API | 包 | 职责 |
| :--- | :--- | :--- |
| `defineListSearchParams` / `useListSearch` | `@base/ui` | 列表 URL 约定 + `dataTableProps` |
| `createResourceActions` | `@base/biz-shared` | 服务端 CRUD 管道 |
| `createResourceList` / `createResourcePage` | `@base/biz-shared` | 列表页装配；`List` 可传入业务定制组件 |

```ts
// actions.ts
const actions = createResourceActions({ getContext, subject, schemas, service, ... });
export const createCustomerAction = actions.create!;

// page.tsx
export default createResourcePage({
  search: customerSearchParams,
  List: ({ data, total, options }) => <CustomerView ... />,
  query: { list, options },
});
```

旧名 `createCrudActions` / `createCrudPage` 仍以 `@deprecated` 别名导出，便于过渡。

**门禁**：

- 禁止为 CRUD 单独新建 `@base/crud` 一类包；缺能力增强 `@base/ui` 或 `@base/biz-shared`；
- 工厂只组合管道，业务 service/query/columns/form 仍在切片；
- `use server` 必须平铺导出 async function。

---

## 五、 质量门禁与验收标准（Zero-Tolerance Checklist）

> **本节取代「单切片 ~300 行」行数 KPI。** 行数不是验收标准；**安全、契约与可运行性**才是。允许为权限、审计、校验、确认框增加代码。

### A. 选型与分层（P1）

1. URL 状态 **100% nuqs**；禁止自研 search DSL / `useTableUrlState` / `parseTableSearchParams`。  
2. **CRUD 弹窗表单 100% `FormModal` + Zod + `FormFieldSchema`/`sections`**（对标 el-form）；列表 **100% `DataTable` 列配置**（对标 el-table）；禁止业务层手写 Dialog/Input/Select 字段树或 `<table>`；**禁止业务侧再建 ListShell/TableRegion 一类平行壳组件**；服务端 Action 内再次 `schema.parse`。  
3. 禁止 Client 数据双写：无 `useState(props.data)`、无 `useEffect` 同步 props。  
4. 读：RSC → server-only Query → DTO；写：Client → Server Action → Service。  
5. UI **100% `@base/ui`**；禁止裸 `<table>`、原生 `confirm`、`window.location.reload()`。

### B. 安全与租户（P0，一票否决）

6. 写操作按钮受 CASL 控制（DataTable `subject` 或 `AuthGuard` / `useAbility`）。  
7. 每个写 Action：`defineServerAction` + Ability + Zod + `assertEditableFields`。  
8. 业务数据访问必须经 `TenantDbManager`，禁止拼连接串、禁止跨租户穿透。  
9. RSC → Client 仅纯数据；禁止传递未 `"use server"` 的函数。  
10. 业务实体具备审计基线与软删除（ADR-009）；服务层写入 `createdById` / `updatedById`。

### C. 平台契约复用（P1）

11. Server Action 必须 `defineServerAction` + `toPlainData`。  
12. 破坏性操作 `ConfirmDialog` 单次确认。  
13. 发号禁止 `count()+1`；sequence / advisory lock / ULID 三选一。  
14. `queries.ts` 标 `server-only`；禁止 Prisma 实体直出。  
15. 共享 schema、contract、search-params、types 同目录 Colocation；单测就近共存。

### D. 体验与流式（P1）

16. 列表页 Suspense + Skeleton，禁止整页白屏等待。  
17. Action 成功后服务端 `revalidatePath`；客户端默认不写 `router.refresh()`（例外须注释）。  
18. 搜索框草稿机制：Enter / 查询按钮触发写 URL。  
19. 表单校验与错误展示由 **`FormModal` + Zod schema** 内部 `safeParse` 统一处理；业务侧不手写 `data-invalid`/红字通道。

### E. 文档与任务同步（协同）

20. 实现与本文冲突时：先对齐真实基座 API，再回写 progress / 文档债；禁止静默发明伪 API。

### F. Vercel React Best Practices（P1c，Code Review 可直接打回）

对照 `.agents/skills/vercel-react-best-practices/rules/`：

21. 每个 `"use server"` Action 内部完成 authn+authz，不依赖 middleware 单独兜底（`server-auth-actions`）。  
22. 独立 IO 一律并行：页面/Query 使用 `Promise.all` 或组件组合并行，禁止可避免的串行 await（`async-parallel`、`server-parallel-fetching`）。  
23. Suspense 只包数据区，布局壳不阻塞（`async-suspense-boundaries`）。  
24. `React.cache()` 用于租户上下文/认证/DB；无参或稳定原语参数；结果不写入模块全局（`server-cache-react`、`server-no-shared-module-state`）。  
25. RSC→Client 最小字段投影；禁止整实体与重复派生 props（`server-serialization`、`server-dedup-props`）。  
26. Client 无 data 镜像 state / effect 同步 props；派生值在 render 计算（`rerender-derived-state-no-effect`）。  
27. Loading 用 `useTransition.isPending`，禁止手动 `setIsLoading` 双轨（`rendering-usetransition-loading`）。  
28. 禁止在组件内定义组件（`rerender-no-inline-components`）。  
29. 审计/通知等旁路不阻塞 Action 返回，使用 `after()`（`server-after-nonblocking`）。  
30. 任何进程内缓存 key 含租户标识，或证明与租户无关（多租户 P0 叠加）。  
31. 第三方大桶包（lucide 等）依赖 Next `optimizePackageImports`；切片 `exports` 子路径显式、可静态分析（`bundle-barrel-imports`、`bundle-analyzable-paths`）。  

**Vibe Coding 快速否决清单（看到即改）**：

```text
□ Action 只在 page/layout 查权限，函数体无 assert
□ let currentTenant / module-level ability/client
□ cache(async ({ obj: new object every call }) => ...)
□ await list(); await options();   // 串行瀑布
□ <Suspense> 包住整个含 Header 的 Page
□ return <Profile user={entirePrismaEntity} />
□ <C users={users} active={users.filter(...)} />
□ useState(data) + useEffect(() => setData(props.data), [props.data])
□ const [loading, setLoading] = useState(false)  // 该用 isPending
□ function View() { const Cell = () => ... }     // 组件内定义组件
□ await writeHeavyAuditLog() 之后才 return       // 应用 after()
□ 业务切片手写 Dialog/Input/Select 表单树（应用 FormModal + fields）
□ 业务切片手写 <table>（应用 DataTable 列配置）
□ generateCode: count(*) + 1
□ localStorage / Map 缓存租户数据且 key 无 organizationId
```

---

## 六、 Vibe Coding 执行手册（Agent 决策规则）

### 1. 允许写 / 禁止写

| 场景 | Agent 动作 |
| :--- | :--- |
| 新列表筛选字段 | 改 `search-params.ts` + query `where` + View 绑定；不新写解析工具 |
| 新写操作 | **FormModal(fields+schema)** + Action 全链 → ConfirmDialog/按钮 CASL；不手写字段 JSX |
| 业务切片想手写 Dialog/Input 表单 | **禁止**。改传 `FormFieldSchema[]`/`sections` 给 `FormModal` |
| 业务切片想手写 `<table>` | **禁止**。改用 `DataTable` 列配置 + nuqs |
| FormModal/DataTable 缺某字段类型或能力 | 在 `@base/ui` **增强 FormFieldSchema/DataTable**（保持对外契约稳定）；**禁止**业务侧平行封装第二套表单 |
| 需要复杂表格能力 | 优先确认 `@base/ui/data-table` 是否已覆盖；未覆盖再引入 TanStack Table，状态仍 nuqs |
| 需要跨切片复用业务组件 | 放入 `@base/biz-shared` 或装配层，**禁止** domains 互相 import |
| feature_list / scope 与本文冲突 | 按本文 + AGENTS 执行，progress 登记文档债 |

### 2. 单切片实现顺序（不可乱序）

```text
1) contract.ts + schema.ts + types.ts
2) search-params.ts
3) service.ts（含迁移：模型 / sequence / 唯一索引）
4) assembly/context.ts + queries.ts + 测试
5) actions.ts + 权限测试
6) ui View / FormModal
7) apps page.tsx 装配 + manifest/catalog 注册
8) 运行级验证：列表筛选、创建、编辑、删除、无权限按钮隐藏、刷新 URL 复原
```

### 3. 验收自检（提交前）

- [ ] 新增/修改单测通过（至少覆盖 service 发号与 Action 权限拒绝路径）  
- [ ] 类型检查通过（目标切片与直接依赖包）  
- [ ] 页面手测：URL 分享/刷新后筛选仍在；无权限用户无写入口  
- [ ] 无 `count()+1` 发号、无裸 DOM、无 `router.refresh` 默认路径  
- [ ] **Vercel P1c 快速否决清单**（见质量门禁 §F）全部为否  
- [ ] Action 内鉴权完整；无模块级租户状态；独立 IO 已并行  
- [ ] `feature_list.json` / 特性 `progress.md` 已记录真实证据  

### 4. 挂起升级（禁止猜测）

- 基座真实导出与本文示例签名不一致且影响架构选择  
- 多租户隔离 / 鉴权协议 / 迁移基线冲突  
- 同一问题连续排查 2 轮仍无法定位的框架兼容问题  

### 5. Review 时如何使用 Vercel skill

1. 先按本文「6 阶段」检查结构与业务契约是否完整；  
2. 再按质量门禁 §F 与 skill 目录中 `server-*` / `async-*` / `rerender-*` 规则做性能与运行时审查；  
3. 安全（P0）> 业务契约（P1）> 性能规则（P1c）；  
4. 不要求一次读完全部 70 条——业务切片 Review 优先读本文 §〇 表格列出的文件。

---

## 七、 与其他架构文档的同步义务

本文生效后，以下文档若仍描述旧范式，**以本文 P1 为准**，并应在最近一次架构维护中回写：

| 文档 | 需对齐点 |
| :--- | :--- |
| `docs/ARCHITECTURE.md` | 活跃切片范围（当前阶段 customer-center 标杆）、UI/URL 状态选型表述 |
| `docs/architecture/fdd-vertical-slice-architecture.md` | 目录：`packages/domains/*` 为当前业务切片物理位置；包名 `@base/feature-*` |
| `feature_list.json` 中 customer-center 描述 | 移除 `useTableUrlState` / `parseTableSearchParams` 等作废 API 表述 |
| `.agents/skills/next-saas-base-dev/` | 8 阶段流水线与本文 6 阶段的映射：URL 对齐 nuqs；表单对齐 **FormModal + FormFieldSchema**（非业务层 RHF）；Action 自愈对齐 revalidatePath |
| `AGENTS.md` | 无需为本文改红线；若补充范式说明，仅增加指向本文的引用 |

---

## 八、 文档修订记录

| 版本 | 变更要点 |
| :--- | :--- |
| **v2.1（本版）** | **UI 契约纠偏（Element-UI 式 DX）**：CRUD 表单标准从「业务层 RHF 手写 Field」改回 **`FormModal` + Zod + `FormFieldSchema`/`sections`**；列表标准 **`DataTable` 列配置**。RHF 仅允许作为 FormModal **内部引擎演进**，业务代码禁止直接 `useForm`。同步修正选型矩阵、阶段 5 标杆代码、质量门禁 §A.2 与 Vibe 手册。 |
| v2 | 1) 反造轮子原则改为「禁同质基础设施轮子 / 强制平台契约 / 业务逻辑写切片」；2) 增加事实源优先级 P0–P3（含 Vercel skill P1c）；3) 选型区分官方/主流/项目契约；4) DataTable 分级，复杂表允许 TanStack Table；5) 标杆发号禁止 `count()+1`；6) `revalidatePath` 默认策略 + 例外；7) 用质量门禁替换行数 KPI；8) Vibe Coding 执行手册与文档同步义务。 |
| v1 | 初版：6 阶段流水线与 customer-center 标杆示例（含绝对化反抽象表述与行数 KPI）。 |
