---
name: next-saas-base-dev
description: 现代多租户 SaaS 架构全栈工程开发与基建演进标准指南。本规范从企业级真实生产工程中严格提炼派生，是本底座衍生项目的核心开发宪法与权威事实源。在进行任何代码编写、功能开发、模块扩展、架构重构、组件封装或缺陷修复时必须优先加载并严格遵循本指南。涵盖两大核心领域：1. 业务特性垂直切片开发（packages/domains/* 与 packages/platform/*）；2. 平台基座与基础设施框架演进（@base/* 与 tooling/db-migrate）。必须加载本技能并按 references 顶层地图索引调度执行；禁止使用作废 API。
color: blue
emoji: 🚀
vibe: 单一职责、顶层编排、契约即事实源、少即是多
agent_created: true
---

# 现代多租户 SaaS 架构开发指南 (Next SaaS Base Dev)

> **定位声明**：**本文件仅作为顶层总览调度地图**。严格遵循“单一职责与顶层编排原则”，所有具体的实施规范 100% 收敛在 `references/` 下的独立文档中，同级文档之间零耦合。

---

## 零、 核心分工：Skill 规范中立 vs Harness 项目治理

1. **Skill（技术规范与架构模式 — 100% 业务解耦）**：
   - 沉淀通用的多租户 SaaS 架构模式、技术栈标准、设计系统与前后端防线；
   - 保持风格与业务绝对中立，代码示例统一使用抽象占位符（如 `<domain>`、`<resource>`、`XxxSubject`），确保 100% 可移植。
2. **Harness（当前项目执行记忆 — 与具体业务强绑定）**：
   - `.harness/` 目录专门记录具体项目的业务特性清单 (`feature_list.json`)、迭代范围 (`scope.md`)、开发进度 (`progress.md`) 与真实交付证据。

---

## 一、 Monorepo 包拓扑大纲

```text
apps/control | apps/tenant                  [双端装配层]
          │
          ▼
packages/domains/* | packages/platform/*    [业务垂直切片层]
          │
          ▼
packages/biz-shared                         [业务中台通用资产 (@biz/shared)]
          │
          ▼
packages/base/*                             [平台核心基座 (@base/*)]
          │
          ▼
tooling/db-migrate                          [12-Factor 自愈迁移引擎]
```

- 业务切片现行路径：`packages/domains/*`、`packages/platform/*`；
- 平台共享基座：`@base/ui`、`@base/authorization`、`@base/auth`、`@base/db-tenant`、`@base/shared`。

---

## 二、 工程绝对红线与行为准则

| # | 核心红线 | 权威细节独占文档 |
| :- | :--- | :--- |
| **1** | **契约单事实源**：权限项（Subject/Action/Field）与列表 URL 契约必须收敛在 `contract.ts`，门禁硬拦截 | [`references/1-contracts.md`](./references/1-contracts.md) |
| **2** | **实体审计基线**：业务实体必须强制包含 8 大审计与软删除字段（ADR-009），门禁机械化拦截 | [`references/2-schema-migrate.md`](./references/2-schema-migrate.md) |
| **3** | **数据库平滑演进**：老表加字段必须设为可空（带 `?`），严禁手写迁移 SQL，统一工具自愈生成 | [`references/2-schema-migrate.md`](./references/2-schema-migrate.md) |
| **4** | **租户物理隔离**：PostgreSQL 分库隔离，数据经 `TenantDbManager` 路由，严禁跨库直连 | [`references/8-base-infrastructure.md`](./references/8-base-infrastructure.md) |
| **5** | **安全写网关**：Mutation 必须由 `defineServerAction` 包装，自动进行 `toPlainData` 跨端序列化 | [`references/4-server-actions.md`](./references/4-server-actions.md) |
| **6** | **标准列表 Chrome**：标准列表统一使用一体化 `DataTable` + `useListSearch`，严禁业务手绘表壳 | [`references/5-ui-components.md`](./references/5-ui-components.md) |
| **7** | **表单与单据双轨策略**：80% 通用主子表使用 `FormModal` / `FormPage` 纯配置模板；20% 复杂单据使用 `<DocumentShell>` 外壳承载高阶积木拼装（只读态全自动穿透，消灭 `!isView`） | [`references/11-dual-track-form-document-paradigm.md`](./references/11-dual-track-form-document-paradigm.md) |
| **8** | **切片自治与防巨石**：子切片最大嵌套深度严格限制为 1 层；主向子单向依赖；UI 单文件代码严格控制在 50~180 行 | [`references/0-architecture-topology.md`](./references/0-architecture-topology.md) |
| **9** | **严禁写操作按钮裸奔**：所有写操作按钮必须受控于 `<AuthGuard>` 或通过 `DataTable` 自动接管，严禁渲染裸写按钮 | [`references/5-ui-components.md`](./references/5-ui-components.md) |
| **10** | **零全页强刷与单次确认**：破坏性操作统一由 `ConfirmDialog` 提示一次；严禁 `window.location.reload()` 与 `router.refresh()` | [`references/5-ui-components.md`](./references/5-ui-components.md) |
| **11** | **端到端强类型**：严禁使用 `any`、`(x as any)` 恶性降解类型，所有 I/O 必须通过 Zod Schema 或强类型推导收敛 | [`references/3-services.md`](./references/3-services.md) |

---

## 三、 顶层技术规范地图 (Navigation Matrix)

开发或重构时，由本表直接精准路由至对应领域的单一事实源文档：

| 研发工作领域 | 权威独立规范文档 (Single Source of Truth) | 核心职责与关键覆盖 |
| :--- | :--- | :--- |
| **通用标准 CRUD 交付** | [`references/9-crud-resource-paradigm.md`](./references/9-crud-resource-paradigm.md) | **标准资源端到端 8 步交付流水线（SOP 流程）** |
| **单据与复杂表单工作台** | [`references/11-dual-track-form-document-paradigm.md`](./references/11-dual-track-form-document-paradigm.md) | **双轨策略决策树、`<DocumentShell>` 外壳、积木拼装与只读态自动穿透** |
| **包拓扑与切片目录边界** | [`references/0-architecture-topology.md`](./references/0-architecture-topology.md) | Monorepo 依赖流向、子切片单向依赖与嵌套深度约束（≤1层） |
| **权限与 URL 参数契约** | [`references/1-contracts.md`](./references/1-contracts.md) | CASL Subject/Action/Field 枚举与 `defineListSearchParams` |
| **数据建模与自愈迁移** | [`references/2-schema-migrate.md`](./references/2-schema-migrate.md) | Prisma 模型、8大审计基线、老表加字段可空铁律、12-Factor 迁移 |
| **领域服务与查询读接口** | [`references/3-services.md`](./references/3-services.md) | Service 事务写入、`server-only` Queries、React `cache()` 记忆化、DTO 脱敏 |
| **写操作 Server Actions** | [`references/4-server-actions.md`](./references/4-server-actions.md) | `defineServerAction` 强类型包装、权限前置断言、`toPlainData` 序列化 |
| **列表视图与基础 UI 资产** | [`references/5-ui-components.md`](./references/5-ui-components.md) | 一体化 `DataTable` Chrome、`useListSearch`、`TreeFilter`、Toast 反馈 |
| **路由装配与动态菜单** | [`references/6-tenant-routing.md`](./references/6-tenant-routing.md) | 双端 RSC 页面直通装配、切片专属 `AbilityBoundary` 边界与 Manifest |
| **CASL 鉴权引擎核心** | [`references/7-casl-ability-provider.md`](./references/7-casl-ability-provider.md) | `TenantAbilityProvider` 运行时挂载、Fail-Closed 防线与 SQL 自动下推 |
| **平台底座基础设施** | [`references/8-base-infrastructure.md`](./references/8-base-infrastructure.md) | `@base/*` 边界职责、演进三原则与跨项目绝对业务中立性 |
| **对象存储与多态附件** | [`references/10-storage-and-attachments.md`](./references/10-storage-and-attachments.md) | S3 对象存储、预签名安全上传、图片缩放与通用附件关联模型 |

---

## 四、 维护与扩展准则（Single Point of Modification）

为保持知识库的绝对稳定与 Token 零浪费，后续演进严格遵循以下操作规则：

1. **更新/修改某个技术领域**：
   - 仅修改对应的目标 `references/` 独立文档这一处，严禁在其他文档中重复阐述；
2. **新增一个技术标准模块**：
   - 在 `references/` 下新增单一职责的 `12-xxx.md`，并在本文件第三节的地图表格中新增一行索引；
3. **作废某一过时技术**：
   - 直接在对应文档中删除该描述，并在 `references/README.md` 作废清单中登记一条拦截项，杜绝历史包袱。
