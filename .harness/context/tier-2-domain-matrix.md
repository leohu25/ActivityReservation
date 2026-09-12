# Tier 2：模块化 Monorepo 与业务能力拓扑

> 适用于模块接口调用、依赖对齐、业务层级和运行时边界核对。

## 一、总体架构

```text
apps/
├── tenant/                  # Next.js 租户应用与 Composition Root
└── control/                 # Next.js 平台应用与 Composition Root

packages/
├── features/                # Feature-based Vertical Slice 业务模块集合
│   ├── control-admin/
│   ├── tenant-admin/
│   ├── procurement-center/
│   └── customer-center/
├── auth/                    # Horizontal 身份认证能力
├── authorization/           # Horizontal 权限基础设施
├── db-control/              # Horizontal Control DB 能力
├── db-tenant/               # Horizontal Tenant DB 能力
├── ui/                      # Horizontal 设计系统
├── shared/                  # Horizontal 纯技术共享
└── biz-shared/              # 克制的跨业务稳定模式共享
```

整体是 Modular Monorepo。`packages/features/*` 纵向组织业务，Horizontal Shared / Platform Modules 横向支撑多个业务模块；`apps/*` 位于依赖拓扑顶端负责装配。

## 二、业务层级术语

```text
Customer Center        → Business Area / Feature Group
Customer Management    → Feature
Classification         → Sub-Feature
Create Classification  → Vertical Slice / Use Case
```

- 页面不自动等于 Feature；
- 文件夹不自动等于 Aggregate、Subdomain 或 Bounded Context；
- 一个页面可组合多个 Use Case；
- `packages/features` 是业务模块集合目录名，不表示所有层级都叫 Feature。

业务分析与任务拆解采用 Feature-Driven Development（FDD）思想。FDD 是开发方法，不是架构名称。

## 三、Feature-based Vertical Slice 基线

业务区域内部按业务能力内聚：

```text
src/features/<feature>/
├── contract.ts
├── types.ts
├── service.ts
├── queries.ts          # RSC server-only 读取
├── actions.ts          # Client mutation Server Actions
├── ui/
├── public.ts           # Client-safe API
└── public.server.ts    # Server-only API
```

Sub-Feature 可位于所属 Feature 内部。简单业务可按规模精简文件；只有出现复杂业务不变量、状态机、事务一致性边界或领域计算时，才在 Feature 内按需使用 DDD，不预建空分层。

## 四、依赖与运行时规则

1. `apps/* → packages/features/* → Horizontal Shared / Platform Modules`。
2. Feature Package 之间禁止直接依赖；多 Feature 组合位于 `apps/*`。
3. Horizontal Platform Module 禁止反向依赖业务 Feature。
4. 跨包只能使用 `package.json#exports`，禁止 `/src/` 内部路径穿透。
5. App Router 页面保持极薄，只处理框架参数、Provider、权限快照与模块装配。
6. Server Component 读取调用 Feature 的 server-only Query，禁止 self-fetch 内部 API。
7. Client mutation 使用 Server Action；每个 Action 必须重新认证、授权和校验输入。
8. `public.ts` 不得暴露数据库或 Next.js 服务端能力，`public.server.ts`/`queries.ts` 必须标记 `server-only`。
9. Business Area 内 `shared/` 只承接多个 Feature 的真实复用，单 Feature 私有代码不得提前提升。
