# Modular Monorepo 与 Feature-based Vertical Slice Architecture

> **术语修正**：文件名中的 `fdd-vertical-slice` 为历史路径。FDD 是业务分析和任务拆解方法，不是代码架构名称。

## 架构基线

项目整体采用 Modular Monorepo：

- `apps/*`：Next.js 可部署应用与 Composition Root；
- `packages/features/*`：沿业务方向组织的 Business Area / Feature Group；
- `auth`、`authorization`、`db-*`、`ui`、`shared`、`biz-shared`：Horizontal Shared / Platform Modules。

业务模块采用 Feature-based Vertical Slice Architecture，同一业务能力的 Contract、Types、Service、Query、mutation Action、UI 与测试就近共存。

## 业务层级

```text
Customer Center        → Business Area / Feature Group
Customer Management    → Feature
Classification         → Sub-Feature
Create Classification  → Vertical Slice / Use Case
```

页面和文件夹不能自动等同于 Feature、Aggregate、Subdomain 或 Bounded Context。

## 推荐结构

```text
packages/features/<business-area>/src/
├── features/
│   └── <feature>/
│       ├── <sub-feature>/
│       ├── contract.ts
│       ├── types.ts
│       ├── service.ts
│       ├── queries.ts
│       ├── actions.ts
│       ├── ui/
│       ├── public.ts
│       └── public.server.ts
├── shared/
├── catalog.ts
└── manifest.ts
```

- `queries.ts` 与 `public.server.ts` 标记 `server-only`，供 RSC 读取；
- `actions.ts` 只承接 Client mutation；
- `public.ts` 只导出 Client-safe API；
- 简单 Feature 不强制一用例一目录，也不预建完整 DDD 分层。

## 依赖方向

```text
apps → business features → horizontal platform modules
```

Feature Package 之间禁止直接依赖，跨 Feature 组合位于应用装配层；跨包必须使用显式 exports。

## FDD 与 DDD

- Feature-Driven Development（FDD）：用于业务分析、Feature List、任务拆解、规划和验收；
- Domain-Driven Design（DDD）：仅在 Feature 出现复杂业务不变量、状态机、事务一致性边界或领域计算时按需使用。
