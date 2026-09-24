# Phase 0：垂直切片全景架构与包骨架范式 (Vertical Slice Architecture Topology)

> 消费预算：~4,000 Tokens。涉及新建 Feature、架构重构或检查包拓扑时的全局指导。

本项目采用 **Feature-based Vertical Slice Architecture（基于特性的垂直切片架构）**，彻底告别按技术分层的横向大杂烩（如所有 Controller 放在一起、所有 Service 放在一起）。

---

## 一、 核心分层概念（中英对照）

1. **`Business Area / Feature Group`（业务领域 / 特性集群）**：
   - 业务切片：`packages/domains/<business-area>/`（如 `<sales-domain>`、`<inventory-domain>` 等）。
   - 平台业务：`packages/platform/<area>/`（如 `tenant-admin`、`control-admin`）。
2. **`Feature`（核心业务特性 / 独立业务功能）**：
   - 对应 `src/features/<feature>/`（如 `<resource>-management`）。
   - 具备完整的业务闭环与垂直切片，内部自包含契约、类型、服务、Query、Action 与 UI。
3. **`Sub-Feature`（子特性 / 附属业务能力）**：
   - 对应 `src/features/<feature>/<sub-feature>/`（如某主特性下的分类、标签或明细配置）。
   - 仅在主特性存在稳定独立的子实体且用例复杂时嵌套。
4. **`Vertical Slice / Use Case`（垂直切片 / 业务用例）**：
   - 贯穿 UI → Server Query/Action → Service → DB 的最小端到端业务闭环。

---

## 二、 Business Area 工作区包标准完整骨架 (Package-Level Topology)

一个标准的业务集群包（如 `packages/domains/<business-area>/`）由 **业务切片 (features/)**、**横向共享 (shared/)**、**运行时装配 (assembly/)** 与 **元数据注册 (manifest/catalog)** 4 大支柱完整构成：

```bash
packages/domains/<business-area>/
├── prisma/schema.prisma                # 业务切片专属数据模型 (多 Feature 共享或独立)
├── package.json                        # 语义化子路径声明 (严格 exports，无根 barrel)
└── src/
    ├── features/                       # 纵向业务特性切片集群 (各 Feature 物理独立)
    │   └── <feature>/                  # 【主切片】：业务特性聚合根
    │       │
    │       ├── <sub-feature>/          # 【Level 3 终极形态：从属子切片】(如工艺规格 specification, 分类 category, 标签 tag)
    │       │   ├── contract.ts         # 子切片独立契约 (Subject, Field, ConfigurableFields)
    │       │   ├── schema.ts           # 子切片独立 Zod 校验
    │       │   ├── types.ts            # 子切片独立 ViewModel 与 DTO
    │       │   ├── service.ts          # 子切片独立领域逻辑 (增量同步比对、防重、运算)
    │       │   ├── queries.ts          # [可选] 子切片独立服务端读取
    │       │   ├── actions.ts          # [可选] 子切片独立 Server Actions (独立维护时)
    │       │   ├── ui/                 # 子切片积木化 UI 组件 (如 SpecificationTable, CategoryFormModal)
    │       │   ├── public.ts           # 子切片 Client-Safe 统一出口
    │       │   └── index.ts            # 子切片内部导出桶 (供主切片引用)
    │       │
    │       ├── contract.ts             # [Phase 2] 主切片权限契约 + defineListSearchParams 列表参数
    │       ├── types.ts                # [Phase 2] 入参、筛选条件与 ViewModel 强类型
    │       ├── schema.ts               # 共享 Zod（create/update 主表单校验）
    │       ├── service.ts              # [Phase 3] 领域业务逻辑 (事务内协调并单向调用子切片 Service)
    │       ├── service.test.ts         # [Phase 3/7] 同级单测 (Colocation 测试就近共存)
    │       ├── queries.ts              # [Phase 3] RSC 纯服务端读取 (供 page.tsx 直调)
    │       ├── actions.ts              # [Phase 4] Server Actions (defineServerAction 包装并平铺 export)
    │       ├── public.ts               # [Package Entry] Client-Safe 导出入口 (View/FormPage/Types)
    │       ├── public.server.ts        # [Package Entry] Server-Only 导出入口 (import "server-only")
    │       │
    │       └── ui/                     # [Phase 5] 【Level 2 积木化防巨石防线】：严格拆分单一职责切片组件
    │           ├── columns.tsx         # [必备] DataTable 独立受控列定义与操作列
    │           ├── <Feature>ListView.tsx # 外层列表视图 (useListSearch + DataTable 默认 chrome)
    │           ├── <Feature>FormModal.tsx # [Level 1] 轻量弹窗 (仅用于 ≤ 5 字段的辅助配置)
    │           └── form/               # [Level 2] 复杂单据/主从表单积木子目录 (单文件 50~150 行，彻底消除巨石)
    │               ├── <Feature>FormPage.tsx         # 表单主骨架 (Header、面包屑、保存按钮、布局拼装)
    │               ├── use<Feature>FormState.ts      # 纯状态与提交逻辑 Hook (状态、联动校验与 Action 彻底解耦)
    │               ├── <Feature>BasicSection.tsx     # 积木A：基础主档信息
    │               ├── <Feature>TechnicalSection.tsx # 积木B：技术参数与工艺指标
    │               └── <Feature>SubSliceSection.tsx  # 积木C：下半部分明细装配 (挂载子切片的 Table 组件)
    │
    ├── shared/                         # Business Area 内多个 Feature 的真实复用
    │   ├── server/tenant-context.ts    # 底层租户数据库上下文与员工门禁 (平台端为 control-guard/session)
    │   ├── ui/*AbilityBoundary.tsx     # CASL 权限快照提供器
    │   └── public.ts                   # 共享模块导出入口
    │
    ├── assembly/context.ts             # 业务区域级拓扑编译、数据范围注入与运行时 Ability 装配
    ├── catalog.ts                      # 由 manifest 自动编译/派生的权限目录与角色矩阵事实源
    └── manifest.ts                     # 导航拓扑、受控页面契约注册与菜单元数据
```

---

## 三、 数据流向与模块边界禁忌 (Data Flow & Invariants)

```text
                               【包外部消费方 (apps/*: App Router)】
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
        subpath: ./<feature>                                          subpath: ./<feature>/server
                 │                                                             │
       ┌─────────▼─────────┐                                         ┌─────────▼─────────┐
       │     public.ts     │                                         │  public.server.ts │
       │  (Client-Safe)    │                                         │ (import "server-only")
       └─────────┬─────────┘                                         └─────────┬─────────┘
                 │                                                             │
    ┌────────────┴────────────┐                                     ┌──────────┴──────────┐
    ▼                         ▼                                     ▼                     ▼
contract.ts (契约)       ui/ (组件)                            queries.ts (只读)     actions.ts (写操作)
                              │                                     │                     │
                              │ (Server Action / createResourceActions) │                     │
                              └──────────────────────────┬──────────┴─────────────────────┘
                                                         ▼
                                                    service.ts (领域业务逻辑)
                                                         │
                                                         ▼
                                                    Prisma / Database
```

### 绝对红线禁忌

1. **外部禁止穿透内部路径**：外部应用（`apps/control`, `apps/tenant` 等）**严禁**直接 `import ... from "@domain/xxx/src/..."` 或 `@platform/xxx/src/...`，只能通过 `package.json#exports` 暴露的语义子路径引用。
2. **读写分离与服务端物理隔离**：
   - **读（Read）**：RSC `page.tsx` 直接通过 `./<feature>/server` 调用 `queries.ts` 读取数据，严禁通过 Server Action 绕读。
   - **写（Write）**：Client 组件通过 `actions.ts` 提交变更，必须被 `defineServerAction` 包装。
   - `public.server.ts` 首行必须声明 `import "server-only"`，彻底切断 Node/数据库依赖泄露至浏览器的风险。
3. **消除平铺历史废弃条目 (`RETIRED_FLAT_ENTRIES`)**：
   - 严禁在工作区包的 `src/` 根目录平铺 `actions.ts`、`types.ts`、`components/`、`services/`、`index.ts`。
   - 所有业务逻辑必须下沉至 `src/features/<feature>/`。

---

## 四、 工作区包暴露契约 (`package.json#exports`)

在 `package.json` 中，必须为每个 Feature 明确声明 Client-Safe 与 `/server` 纯服务端双入口：

```json
{
  "name": "@domain/example",
  "exports": {
    "./feature-a": "./src/features/feature-a/public.ts",
    "./feature-a/server": "./src/features/feature-a/public.server.ts",
    "./feature-b": "./src/features/feature-b/public.ts",
    "./feature-b/server": "./src/features/feature-b/public.server.ts"
  }
}
```

---

## 五、 平铺架构改造重构标准流程 (Refactoring SOP)

将历史遗留平铺包（如 `control-admin`）重构为标准垂直切片时的标准 4 步：

1. **业务域识别与切片拆分**：根据业务用例划分为 1~3 个独立 Feature 目录（例如 `tenant-management`、`migration-management`、`overview`）。
2. **职责归位与代码下沉**：
   - 将老 `services/` 拆分并放入对应 Feature 的 `service.ts`；
   - 将老 `actions.ts` 拆分并放入对应 Feature 的 `actions.ts`；
   - 将老 `components/` 下沉到对应 Feature 的 `ui/` 目录下；
   - 提取各 Feature 的 `contract.ts`、`types.ts`、`queries.ts`、`public.ts` 与 `public.server.ts`；
   - 将单测移至 Feature 目录下就近共存 (`service.test.ts` / `<View>.test.tsx`)。
3. **跨 Feature 真实共用收敛至 `src/shared/`**：仅当守卫（如 `control-guard.ts`）或上下文在多个 Feature 间真实共享时放入 `src/shared/`。

---

## 六、 垂直切片的三级共享拓扑与依赖流向法则 (Three-Tier Shared & Dependency Law)

在实际工程落地中，开发者最容易对“到底什么时候可以直接引用、什么时候必须抽 shared”产生困惑。为彻底消除模糊性，项目确立严格的**三级分层共享与依赖法则**：

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Level 1：全仓跨业务大域（Cross-Domain: 跨 Package）                                   │
│ • 范围：业务大域 A (@domain/area-a) ↔ 业务大域 B (@domain/area-b)                     │
│ • 规则：【强隔离】严禁跨包私下穿透引用！                                              │
│ • 共享机制：必须走全局基座横向共享包（经 package.json 显式声明 "workspace:*"）：      │
│   - @biz/shared（业务中台共享资产：统一流水发号器、审批流状态机、主子表明细等）         │
│   - @base/shared（底层纯技术工具：toPlainData, resolvePagination, Result 等）          │
│   - @base/ui（工业风设计系统与通用组件）                                               │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│ Level 2：单业务包内、并列的一级业务切片（Intra-Domain / Cross-Feature）                │
│ • 范围：例如 packages/domains/<area>/src/features/ 下并列的：                          │
│   ├── feature-a/             (独立业务特性 A)                                          │
│   └── feature-b/             (独立业务特性 B)                                          │
│ • 关系：属于同一业务大域，但彼此是独立自治的业务模块，耦合度低                         │
│ • 规则：【同域弱耦合】一级切片之间严禁深层穿透私有实现！                              │
│         跨 Feature 共享的数据库上下文、权限快照边界、联合 Subject 类型等，              │
│         必须统一收敛在当前 Package 本地的 src/shared/ 中进行解耦共享！                │
│         （例如：packages/domains/<area>/src/shared/contract-types.ts）                 │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│ Level 3：单个二级业务切片内部的极细子切片（Sub-Feature: 强内聚聚合根）                 │
│ • 范围：例如某一 Feature 内部的：                                                      │
│   ├── sub-slice-a/           (核心主定义与 CRUD)                                       │
│   └── sub-slice-b/           (强从属附属能力或矩阵编排)                                │
│ • 关系：【天然高内聚】业务生命周期完全捆绑，属于同一领域聚合根                         │
│ • 规则：【直接消化】这一层严禁过度设计！坚决不抽琐碎的 micro-shared 目录，             │
│         子切片之间坦然互相直接引用类型与服务，保持代码路径扁平、心智负担最小。        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 依赖判断黄金自检清单

- **问题 1：我要调用的东西在另一个独立的 npm package 里吗？**
  - 是 ➔ **Level 1**：必须通过 `@biz/shared` 或 `@base/shared` 共享，严禁相对路径横向越界。
- **问题 2：我要调用的东西在同一个包内，但在另一个同级的并列 Feature（一级切片）里吗？**
  - 是 ➔ **Level 2**：必须收敛至本 Package 的 `src/shared/`，严禁深层穿透到对方 Feature 的私有 service 或内部组件。
- **问题 3：我要调用的东西在同一个 Feature（二级切片）内部的兄弟 Sub-Feature 目录吗？**
  - 是 ➔ **Level 3**：直接相对引用，不建 micro-shared，拥抱聚合根内部的必要高内聚。

---

## 七、 UI 架构防巨石设计铁律 (UI Anti-Monolith & Modular Slicing)

在实际业务开发中，开发者与 AI 最容易犯的错误是**把所有 UI、表单控件与状态逻辑塞进一个单一的 `<View>.tsx` 或 `<FormPage>.tsx` 中，导致代码膨胀为上千行的‘巨石文件’**。为此，团队树立以下绝对红线：

1. **单文件行数硬限制**：
   - 任何 UI 切片组件代码行数严格控制在 **50~180 行** 以内；超过 200 行必须无条件进行物理拆解；
2. **三级递进 UI 拆分规范**：
   - **Level 1（极简标准层）**：直接使用 `DataTable` + `FormModal`，快速闭环轻量配置；
   - **Level 2（组件积木化层）**：单切片复杂化时，强制抽取 `use<Feature>FormState.ts` 纯逻辑 Hook，并将界面拆分为 `<Feature>BasicSection.tsx`、`<Feature>TechnicalSection.tsx` 等单一职责小积木；
   - **Level 3（子切片领域自治层 — 终极形态）**：存在从属子实体或明细子表时，由子切片独立提供原子级 UI（如 `specification/ui/SpecificationTable.tsx`），主表单仅负责组装子切片组件，主子切片边界清晰、各司其职；
3. **列表列必须独立文件**：`DataTable` 的 columns 必须独立抽离至 `columns.tsx`，与 View 视图完全解耦；
4. **子切片最大嵌套深度硬约束（防目录深渊）**：子切片只允许存在于 `src/features/<feature>/<sub-feature>/` 恰好 1 层深度，**严禁递归嵌套（如 `features/a/b/c/`）**；若某个子切片复杂度进一步扩大，必须将其平级提升重构为独立的一级 Feature；
5. **主向子严格单向依赖铁律（防循环死锁）**：主切片可在事务与页面中单向引用子切片的契约、类型与 Service；**子切片绝对禁止反向引用主切片的私有实现**（Service / Actions / UI），确保子切片自治、纯粹且具备完全独立的单测覆盖。
