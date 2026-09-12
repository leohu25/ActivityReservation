# Phase 0：垂直切片全景架构与包骨架范式 (Vertical Slice Architecture Topology)

> 消费预算：~4,000 Tokens。涉及新建 Feature、架构重构或检查包拓扑时的全局指导。

本项目采用 **Feature-based Vertical Slice Architecture（基于特性的垂直切片架构）**，彻底告别按技术分层的横向大杂烩（如所有 Controller 放在一起、所有 Service 放在一起）。

---

## 一、 核心分层概念（中英对照）

1. **`Business Area / Feature Group`（业务领域 / 特性集群）**：
   - 对应 `packages/features/<business-area>/`（如 `customer-center`, `tenant-admin`, `control-admin`）。
   - 是一个完整的工作区包，承载某一完整业务线。
2. **`Feature`（核心业务特性 / 独立业务功能）**：
   - 对应 `src/features/<feature>/`（如 `tenant-management`, `customer-management`）。
   - 具备完整的业务闭环与垂直切片，内部自包含契约、类型、服务、Query、Action 与 UI。
3. **`Sub-Feature`（子特性 / 附属业务能力）**：
   - 对应 `src/features/<feature>/<sub-feature>/`（如客户管理下的 `classification` 分类与标签）。
   - 仅在主特性存在稳定独立的子实体且用例复杂时嵌套。
4. **`Vertical Slice / Use Case`（垂直切片 / 业务用例）**：
   - 贯穿 UI → Server Query/Action → Service → DB 的最小端到端业务闭环。

---

## 二、 Business Area 工作区包标准完整骨架 (Package-Level Topology)

一个标准的业务集群包（如 `packages/features/<business-area>/`）由 **业务切片 (features/)**、**横向共享 (shared/)**、**运行时装配 (assembly/)** 与 **元数据注册 (manifest/catalog)** 4 大支柱完整构成：

```bash
packages/features/<business-area>/
├── prisma/schema.prisma                # 业务切片专属数据模型 (多 Feature 共享或独立)
├── package.json                        # 语义化子路径声明 (严格 exports，无根 barrel)
└── src/
    ├── features/                       # 纵向业务特性切片集群 (各 Feature 物理独立)
    │   └── <feature>/
    │       ├── <sub-feature>/          # [可选] 仅存在稳定子能力时嵌套 (如 classification)
    │       │   ├── contract.ts
    │       │   ├── types.ts
    │       │   ├── service.ts
    │       │   ├── queries.ts
    │       │   ├── actions.ts
    │       │   ├── public.ts
    │       │   └── public.server.ts
    │       ├── contract.ts             # [Phase 2] 纯数据契约 (受控字段枚举与 SSoT 动作)
    │       ├── types.ts                # [Phase 2] 入参、筛选条件与 ViewModel 强类型
    │       ├── service.ts              # [Phase 3] 领域业务逻辑、事务与数据持久化
    │       ├── service.test.ts         # [Phase 3/7] 同级单测 (Colocation 测试就近共存)
    │       ├── queries.ts              # [Phase 3] RSC 纯服务端读取 (供 page.tsx 直调)
    │       ├── actions.ts              # [Phase 4] 纯服务端写操作 (defineServerAction + CASL)
    │       ├── public.ts               # [Package Entry] Client-Safe 导出入口 (View/Types)
    │       ├── public.server.ts        # [Package Entry] Server-Only 导出入口 (import "server-only")
    │       └── ui/                     # [Phase 5] Feature 专属私有组件与视图
    │           ├── <Feature>View.tsx   # 核心交互视图组件 (useAbility + DataTable.Root)
    │           ├── <Feature>View.test.tsx # 页面与契约 100% 对齐单测
    │           └── <Feature>Modal.tsx  # 增改查弹窗等私有子组件
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
                              │ (useAction 调用)                    │                     │
                              └──────────────────────────┬──────────┴─────────────────────┘
                                                         ▼
                                                    service.ts (领域业务逻辑)
                                                         │
                                                         ▼
                                                    Prisma / Database
```

### 绝对红线禁忌

1. **外部禁止穿透内部路径**：外部应用（`apps/control`, `apps/tenant` 等）**严禁**直接 `import ... from "@chenrun/feature-xxx/src/..."`，只能通过 `package.json#exports` 暴露的语义子路径引用。
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
  "name": "@chenrun/feature-example",
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
4. **清理平铺老文件与更新 exports**：物理删除 `src/actions.ts`、`src/types.ts`、`src/components`、`src/services`、`src/index.ts`，配置 `package.json#exports`，并在门禁检测脚本中移除包白名单豁免。
