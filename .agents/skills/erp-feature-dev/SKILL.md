---
name: erp-feature-dev
description: 辰润 ERP 业务切片全生命周期工程开发指南。涵盖数据建模、页面纯数据契约、领域服务、defineServerAction + CASL 写路径守卫、官方 CASL 客户端范式（layout AbilityProvider + useAbility）、工业风 UI、租户路由与 Manifest 对齐测试。按阶段 Schedule 推进并渐进式按需读取子文档。
color: blue
emoji: 🚀
vibe: 架构标准化、契约即事实源、底层机制防错、无感响应
agent_created: true
---

# 辰润 ERP 业务切片开发规范与生命周期指南 (ERP Feature Dev)

本项目采用 **Modular Monorepo + Feature-based Vertical Slice Architecture**。`packages/features/*` 纵向组织业务模块，认证、授权、数据库、UI 与 Shared 等 Horizontal Shared / Platform Modules 横向提供基础能力。业务分析与任务拆解采用 Feature-Driven Development（FDD）思想；复杂 Feature 内按需使用 DDD。

本规范以 `customer-center`（客户中心）为全栈工程标杆。本文件仅作为**高维索引、开发排期 (Schedule) 与绝对红线地图**，具体开发阶段的深度细节请**按需渐进式调阅 `references/` 子文档**。

---

## 六大工程红线 (Zero-Tolerance Rules)

1. **契约即唯一事实源**：每个受控 Feature/Sub-Feature 在自身 `contract.ts` 维护纯数据权限契约，严禁手写平铺的 permissions 平行世界；页面 hide/不渲染的按钮必须同步从契约 `actions` 移除；
2. **底层机制消灭序列化异常**：所有 Server Actions 必须由 `defineServerAction` 包装，严禁原始 Prisma 实体（带 Decimal/Date）直出；
3. **交互单次确认**：破坏性操作统一由 `DataTableRowActions` 的 `ConfirmDialog` 提示一次，严禁调用浏览器原生 `confirm(...)`；
4. **消息通知右上角 Toast 弹出**：严禁在页面顶部塞入静态红色大横幅挤压变形表格布局，所有操作反馈统一使用右上角 `toast`；
5. **杜绝全页强刷**：严禁调用 `window.location.reload()`，状态变更由 React 本地 State 驱动即时响应，搭配 `router?.refresh()` 静默同步；
6. **物理隔离路由**：业务数据必须由 `getTenant*Context()` 动态路由至租户独立库，严禁硬编码或跨租户穿透。
7. **一体化卡片容器**：列表页必须用 `DataTable.Root` 白卡整合标题/筛选/表格/分页，严禁零散漂浮在页面底色上（详见 `references/5-ui-components.md`）。
8. **写路径强制 CASL**：Server Action 写/删/状态变更必须 `assert*Ability(ability, action, subject)`，与页面按钮同一动作名（详见 `references/4-server-actions.md`）。
9. **BA 只管进门**：Better Auth 仅负责登录/会话/组织成员；业务权限只认 CASL（ADR-007），禁止用 BA `hasPermission` 查业务资源。
10. **客户端权限 = 官方 AbilityProvider（教科书）**：RSC layout 拉快照 → `TenantAbilityProvider` 注入 → View 只 `useAbility()`/积木；**禁止** View 自建 plain ability、禁止把 `permissions` 传进 View/Workspace（详见 `references/7-casl-ability-provider.md`，标杆 `customer-center`）。
11. **列表优先 shadcn**：简单列表/表单直接用 `Table`/`Form`/`Dialog`；需要统一工具栏时再用 `DataTable.Workspace`（可选加速，非强制）。
12. **表单优先 shadcn Form**：短表单直接 `Form`+`Field`；长表单/AI 批量字段可用 `FormFields` Schema（可选）。
13. **导出走契约**：CSV 导出用 `exportContractCsv(rows, contract.configurableFields, ...)`，禁止手写 fieldKeys。
14. **原子层 = shadcn 目录**：`packages/ui/.../shadcn/` 仅允许 `npx shadcn@latest add` 引入；禁止手写；业务不得裸写控件样式。
15. **单一 Zod 强类型驱动与 Table 列派生**：表单增改查弹窗统一使用 `CrudFormModal`，强制传入 `schema: z.ZodType` 执行 safeParse 运行时红字校验拦截，消灭无校验双分支；列表优先使用 `DataTable.createColumnsFromSchema(schema)` 派生标准表格列定义。
16. **测试同级就近共存 (Colocation)**：遵循 Next.js 官方最佳实践，单元测试文件必须与被测试的目标组件/服务处于同一目录下（如 `CustomerView.tsx` 与 `CustomerView.test.tsx` 同级，`CrudFormModal.tsx` 与 `CrudFormModal.test.tsx` 同级），严禁在模块根目录平铺孤儿测试文件。

---

## 标准目录拓扑

```bash
packages/features/<business-area>/
├── prisma/schema.prisma
└── src/
    ├── features/
    │   └── <feature>/
    │       ├── <sub-feature>/          # 仅存在稳定子能力时增加
    │       ├── contract.ts             # 权限与页面纯数据契约
    │       ├── types.ts                # 输入、查询参数与 ViewModel
    │       ├── service.ts              # 数据访问、事务与当前规模业务规则
    │       ├── queries.ts              # RSC server-only 读取
    │       ├── actions.ts              # Client mutation Server Actions
    │       ├── ui/                     # Feature 私有 UI 与 colocated tests
    │       ├── public.ts               # Client-safe API
    │       └── public.server.ts        # Server-only API
    ├── shared/                         # Business Area 内多个 Feature 的真实复用
    ├── catalog.ts
    └── manifest.ts
```

### 业务层级规范（中英对照）

- **`Business Area / Feature Group`（业务领域 / 特性集群）**：例如 Customer Center（客户中心），是一个完整的大业务板块，通常作为一个 npm 工作区包。
- **`Feature`（核心业务特性 / 独立业务功能）**：例如 Customer Management（客户管理）、Store Management（门店管理），具备完整业务闭环。
- **`Sub-Feature`（子特性 / 附属业务能力）**：例如 Classification（分类与标签管理），依附于主特性。
- **`Vertical Slice / Use Case`（垂直切片 / 业务用例）**：例如“创建分类”、“停用门店”、“生效报价”，贯穿 UI → Server Query/Action → Service → DB 的最小端到端业务操作。当前规模下不要求一用例一目录，避免过度设计。

### 包暴露规范 (Package Subpath Exports)

严格遵循 Turborepo 与 Next.js 官方最佳实践：

1. **语义化子路径**：通过 `package.json#exports` 暴露 `./customer-management`、`./quotation-management` 等业务入口，彻底消灭根目录大杂烩 Barrel File。
2. **环境物理隔离**：区分 Client-Safe 入口（`public.ts`）与纯服务端入口（`./<feature>/server` 映射至 `public.server.ts`，首行标注 `import "server-only"`），防止服务端逻辑或 Node 原生模块泄露至浏览器。
3. **禁止内部穿透**：外部调用方严禁直接穿透访问包内 `/src/` 内部文件。
4. **DDD 按需引入**：仅在业务规则复杂（如复杂状态机、报价优先级算法、严格一致性边界）时引入战术 DDD 模式，严禁简单 CRUD 机械堆叠抽象。

---

## Feature 开发流水线 (Standard Schedule)

开工开发或重构一个业务 Feature 时，严格按以下 **7 个阶段** 循序渐进：

```
Phase 1: 数据建模与物理隔离
         ↓
Phase 2: 纯数据契约 (SSoT)
         ↓
Phase 3: 领域服务层实现
         ↓
Phase 4: 安全 Actions 与序列化
         ↓
Phase 5: 工业风页面交互
         ↓
Phase 6: 租户端路由与 Manifest
         ↓
Phase 7: 契约对齐单测与全栈验证
```

### 阶段排期总表与渐进式调阅索引

| 阶段 | 核心任务 | 交付物与验证指标 | 深入阅读文档 |
| :--- | :--- | :--- | :--- |
| **Phase 1<br>数据建模** | 切片内定义模型，统一由 db-tenant 聚合生成 Client，运行基线迁移。 | • `prisma/schema.prisma`<br>• `pnpm migrate:tenant:gen` | `references/2-schema-migrate.md` |
| **Phase 2<br>纯数据契约** | 编写无 JSX、无 DOM 的纯数据契约，定义受控字段枚举与操作权限。 | • Feature/Sub-Feature `contract.ts`<br>• 字段与动作自包含 | `references/1-contracts.md` |
| **Phase 3<br>服务与 Query** | 封装核心业务并建立 RSC server-only 读取入口。 | • Feature `service.ts` / `queries.ts`<br>• 业务单测通过 | `references/3-services.md` |
| **Phase 4<br>安全 Actions** | mutation 使用 `defineServerAction`，执行认证、CASL 守卫、校验与序列化。 | • Feature `actions.ts`<br>• 读取不绕 Server Action | `references/4-server-actions.md` |
| **Phase 5<br>工业风交互** | 基于 `@chenrun/ui` 构建；官方 CASL Provider（layout 注入）+ `useAbility`/积木；单次确认、Toast、零白屏。 | • Feature `ui/<Page>View.tsx`（无 permissions props）<br>• 零 `window.location.reload` | `references/5-ui-components.md`<br>`references/7-casl-ability-provider.md` |
| **Phase 6<br>路由与清单** | 租户端 `layout.tsx` 挂 `*AbilityBoundary`；page 只取业务数据；`manifest.ts` 暴露导航。 | • `apps/tenant/.../<slice>/layout.tsx`<br>• `src/manifest.ts` | `references/6-tenant-routing.md`<br>`references/7-casl-ability-provider.md` |
| **Phase 7<br>对齐单测** | 编写页面与契约 100% 对齐自动化单测，执行全栈门禁验证。 | • `<Page>View.test.tsx`<br>• `pnpm check` & `pnpm test` 全绿 | `references/6-tenant-routing.md` |
