# @chenrun/features

辰润 ERP 的业务区域与业务模块集合。

## 架构定位

项目整体采用 **Modular Monorepo**。`packages/features/*` 沿业务方向组织完整业务模块，业务代码采用 **Feature-based Vertical Slice Architecture**；`auth`、`authorization`、`db-*`、`ui`、`shared`、`biz-shared` 等则是 **Horizontal Shared / Platform Modules**，横向为业务模块提供基础能力。

| 子包目录 | 包名 | 业务定位 |
| --- | --- | --- |
| `control-admin` | `@chenrun/feature-control-admin` | 平台管控业务区域 |
| `tenant-admin` | `@chenrun/feature-tenant-admin` | 租户组织与权限管理业务区域 |
| `customer-center` | `@chenrun/feature-customer-center` | Customer Center Business Area / Feature Group |
| `procurement-center` | `@chenrun/feature-procurement-center` | 采购中心业务区域 |

目录名 `packages/features` 是业务模块集合的工程命名，不表示其下所有层级都叫 Feature。业务分析与代码组织使用以下清晰层级（中英对照）：

- **`Business Area / Feature Group`（业务领域 / 特性集群）**：例如 Customer Center（客户中心），大业务板块，通常作为一个 npm 工作区包；
- **`Feature`（核心业务特性 / 独立业务功能）**：例如 Customer Management（客户管理）、Store Management（门店管理），具备完整业务闭环；
- **`Sub-Feature`（子特性 / 附属业务能力）**：例如 Classification（分类与标签管理），依附于主特性；
- **`Vertical Slice / Use Case`（垂直切片 / 业务用例）**：例如“创建分类”、“停用门店”、“生效报价”，贯穿从 UI 到 DB 的端到端业务操作。

## Feature-based Vertical Slice 基线与导出规范

业务区域内部优先按业务能力内聚，而不是在根目录横向平铺 `components/`、`services/`、`actions.ts` 和 `types.ts`。

公共 API 统一遵循现代 Turborepo 与 Next.js 官方最佳实践，采用 `package.json#exports` 暴露语义子路径：

- **消灭大杂烩 Barrel File**：彻底废弃根目录 `index.ts` 全量导出；
- **Server/Client 物理环境隔离**：区分前端安全的 `./<feature>`（映射 `public.ts`）与纯服务端的 `./<feature>/server`（映射 `public.server.ts`，首行标注 `import "server-only"`），防止服务端逻辑或 Node 原生模块泄露至浏览器；
- **私有实现防穿透**：严禁跨包直接引用包内 `/src/` 内部文件。

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

简单业务可以按实际规模精简文件；只有领域规则复杂时才在 Feature 内按需使用 DDD，不预建空的 `domain/application/infrastructure` 分层。

## 依赖方向

```text
apps/* → packages/features/* → Horizontal Shared / Platform Modules
```

- Feature Package 禁止直接依赖另一个 Feature Package；
- 横向基础模块禁止反向依赖具体业务 Feature；
- 跨包调用必须使用 `package.json#exports`；
- 多 Feature 组合位于 `apps/*` 的 Composition Root。

## 开发方法

业务分析与任务拆解采用 Feature-Driven Development（FDD）思想，以 Feature List、特性沙盒和验收证据组织交付。FDD 是开发方法，不是本项目的架构名称。
