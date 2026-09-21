---
name: next-saas-base-dev
description: 现代多租户 SaaS 架构全栈工程开发与基建演进标准指南。本规范从企业级真实生产工程中严格提炼派生，是本模板项目及所有基于本基座衍生项目的核心开发宪法与权威事实源。在进行任何代码编写、功能开发、模块扩展、架构重构、组件封装或缺陷修复时必须优先加载并严格遵循本指南。涵盖两大核心领域：1. 业务特性垂直切片开发（packages/domains/* 与 packages/platform/*），严格遵循标准资源 CRUD 最佳范式（细节见 references/9-crud-resource-paradigm.md）；2. 平台基座与基础设施框架演进（@base/* 与 tooling/db-migrate）。触发场景：开发/修改任何业务功能或特性切片、实现 CRUD、编写 Server Action/Query、调整 DataTable/FormModal、迭代 base 基础设施、修改 apps 装配层、修复 Bug。必须加载本技能并按 references 索引执行；禁止过时 API（见下方作废清单）。
color: blue
emoji: 🚀
vibe: 契约即事实源、约定大于配置、少即是多
agent_created: true
---

# 现代多租户 SaaS 架构开发规范 (Next SaaS Base Dev)

> **本文件定位**：**地图与索引**。只保留分层、红线摘要、流水线索引与阅读导航。  
> **具体开发细节一律在 `references/`**，禁止把实现示例堆进本文件。  
> **权威目标规格**：`docs/architecture/refactoring-architecture-and-official-patterns.md`

---

## 零、 核心分工原则：Skill 中立解耦 vs Harness 项目耦合

为保证本工程基座的高度可复用性与跨项目无缝移植能力，团队严格划分 **Skill** 与 **Harness** 的职责边界：

1. **Skill（架构宪法与通用规范 — 100% 业务解耦，高度中立）**：
   - 本 Skill 仅沉淀**通用的多租户 SaaS 架构模式、技术栈标准、8 阶段流水线、工业风设计系统与前后端防线**；
   - **绝对中立原则**：Skill 正文及所有 references 中，**严禁硬编码或深度耦合当前项目的具体业务逻辑、业务字段或专有业务模块**；所有代码示例统一使用通用的抽象占位符（如 `<domain>`、`<resource>`、`XxxSubject`），确保本规范可无损移植到任何基于本底座的全新 SaaS 业务项目（如 CRM、WMS、MES、电商等）。
2. **Harness（当前项目治理与执行记忆 — 与具体业务强绑定）**：
   - `.harness/` 目录专门负责记录**当前具体项目的业务特性台账 (`feature_list.json`)、当前迭代范围 (`scope.md`)、开发进度 (`progress.md`) 与真实业务交付证据**；
   - 具体的业务领域验收标准与业务实体流转，全部收敛在 Harness 中。

---

## 一、 包拓扑地图

```text
apps/control | apps/tenant          双端装配
packages/domains/*                  业务领域垂直切片 (@domain/*)
packages/platform/*                 平台业务（@platform/control-admin / @platform/tenant-admin）
packages/base/ui                    UI 契约：DataTable / FormModal / list params
packages/biz-shared                 业务中台通用资产：单号发号器 / 审批契约 (@biz/shared)
packages/base/shared                defineServerAction / toPlainData
packages/base/auth | authorization | db-tenant | db-control
tooling/db-migrate                  12-Factor 迁移引擎
```

- 业务切片现行路径：`packages/domains/*`、`packages/platform/*`（勿再写 `packages/features/*` 作为现行目录）。
- **不单开** `@base/crud` 一类包；缺能力增强 `@base/ui` 或 `@biz/shared`。

---

## 二、 红线摘要（细则见对应 reference）

| #   | 红线                                                                                                           | 细则                                          |
| :-- | :------------------------------------------------------------------------------------------------------------- | :-------------------------------------------- |
| 1   | 权限/列表 URL 契约收敛在 `contract.ts`（SSoT），门禁脚本硬拦                                                   | `references/1-contracts.md`                   |
| 2   | mutation：`defineServerAction` + `toPlainData`；RSC→Client 禁 Promise/函数 props                               | `references/4-server-actions.md`              |
| 3   | 破坏性操作单次 `ConfirmDialog`；反馈用 Toast；禁 `window.location.reload()`                                    | `references/5-ui-components.md`               |
| 4   | 数据经 `TenantDbManager` 分库路由，禁拼连接串                                                                  | `docs/ARCHITECTURE.md`、db-tenant 文档        |
| 5   | 标准列表：`DataTable` 默认 chrome + `useListSearch`；禁业务手绘表壳                                            | `references/5-ui-components.md`               |
| 6   | 写路径 CASL（Action 内断言 + UI `subject`/门禁）                                                               | `references/4`、`references/7`                |
| 7   | 列表 URL：`defineListSearchParams`；Client：`useListSearch`                                                    | `references/9-crud-resource-paradigm.md`      |
| 8   | CRUD 表单分级治理：复杂主单据/多字段档案用全屏多页签（`FormPage`）；极简辅助项（分类、标签、字典 ≤ 5 字段）用轻量弹窗（`FormModal`） | `references/5-ui-components.md`               |
| 9   | Mutation 使用 `defineServerAction` 直写；RSC 装配遵循 Next.js 标准 async 函数；`use server` 平铺导出           | `references/9`、`references/4`                |
| 10  | 导出走 `exportContractCsv` + 契约字段                                                                          | `references/1-contracts.md`                   |
| 11  | 原子层 shadcn 规范（`@base/ui` `components/ui/`）                                                              | `.agents/skills/shadcn/`                      |
| 12  | 通用能力上浮至 `@base/ui` / `@biz/shared`，禁业务平行第二套                                                    | `references/8-base-infrastructure.md`         |
| 13  | 测试同级共存；实体审计+软删除基线；提交前人工审阅 + 中文 Conventional Commits；禁 `--no-verify`                | `AGENTS.md`、`references/2-schema-migrate.md` |
| 14  | 严禁用 `any` 降解，强制 TypeScript 强类型（Prisma/Zod/DTO/Props 端到端可推导；禁 `any` / `(x as any)`）        | `AGENTS.md`、`references/3-services.md`       |
| 15  | **架构中立性与业务零耦合**：Skill 严禁硬编码当前项目特定业务逻辑与实体，示例一律抽象化，确保跨项目 100% 可移植 | 本规约「零、核心分工原则」                    |

**作废 / 禁止用于新代码**（仅存量迁移过渡的标 `@deprecated`）：

`any`、`(x as any)` 类型降解、`useTableUrlState`、`parseTableSearchParams`、`useDataTableState`、`useListUrlNav`、业务层 RHF 手写表单、ListShell/TableRegion、`count(*)+1` 发号、客户端默认 `router.refresh()`、单开 `@base/crud` 包、`createResourcePage`、`createResourceActions`、`createResourceList`（过度封装已彻底废弃）。

---

## 三、 赛道一：业务切片流水线（地图）

**标准 CRUD 最佳范式与流程（通用模板，供参考）** → [`references/9-crud-resource-paradigm.md`](./references/9-crud-resource-paradigm.md)（必读）

> 注：8 步流程作为全仓通用的基准参考模板，覆盖绝大多数标准 CRUD 场景。面对主子表、多步骤向导、复杂审批流等高复杂度页面时，在坚守底线的前提下支持合规扩展与定制，切忌生搬硬套。

```text
① contract.ts     权限契约 + defineListSearchParams 扩展字段
② schema.ts       共享 Zod
③ service.ts      领域逻辑（事务 / 发号 / 状态机）
④ queries.ts      server-only + cache + DTO
⑤ actions.ts      defineServerAction 直写 → 平铺 export
⑥ ui/*FormModal   FormModal 声明式弹窗 + schema/fields + subject（或主单据 FormPage）
⑦ ui/*View        useListSearch + DataTable 纯受控视图（带 subject 自动接管权限）
⑧ layout.tsx      路由组 CASL Ability 边界注入（关键防线：通过 getTenantSubjectPermissions 注入该目录下所有 Subject）
⑨ apps page.tsx   标准 RSC 装配（主列表、new、[id] 路由页直通数据）
→ 单测与 check/test 全绿
```

| 阶段              | 深入阅读                                                     |
| :---------------- | :----------------------------------------------------------- |
| ① 契约            | `references/1-contracts.md`                                  |
| ②③ 数据与服务     | `references/2-schema-migrate.md`、`references/3-services.md` |
| ⑤ Actions         | `references/4-server-actions.md`                             |
| ⑥⑦ UI             | `references/5-ui-components.md`                              |
| ⑧ 装配 / Manifest | `references/6-tenant-routing.md`                             |
| CASL Provider     | `references/7-casl-ability-provider.md`                      |
| 包骨架            | `references/0-architecture-topology.md`                      |

---

## 四、 赛道二：基座演进（地图）

升级 `@base/*`、`tooling/*`、apps 装配时：

1. 读 [`references/8-base-infrastructure.md`](./references/8-base-infrastructure.md)（职责、单向依赖、Level1→2→3）；
2. 架构全景：`docs/ARCHITECTURE.md` 及 `docs/architecture/*`；
3. **禁止** `@base/*` 依赖 `packages/domains/*` / `packages/platform/*`。

---

## 五、 渐进式阅读索引

| 领域                           | 路径                                                                  |
| :----------------------------- | :-------------------------------------------------------------------- |
| **标准 CRUD 最佳范式（必读）** | `references/9-crud-resource-paradigm.md`                              |
| 切片包骨架                     | `references/0-architecture-topology.md`                               |
| 契约                           | `references/1-contracts.md`                                           |
| Schema / 迁移                  | `references/2-schema-migrate.md`                                      |
| Service / Query                | `references/3-services.md`                                            |
| Server Actions                 | `references/4-server-actions.md`                                      |
| DataTable / FormModal          | `references/5-ui-components.md`                                       |
| 路由 / page / Manifest         | `references/6-tenant-routing.md`                                      |
| CASL Provider                  | `references/7-casl-ability-provider.md`                               |
| 基座包                         | `references/8-base-infrastructure.md`                                 |
| **对象存储与多态附件**         | `references/10-storage-and-attachments.md`                            |
| 目标架构规格                   | `docs/architecture/refactoring-architecture-and-official-patterns.md` |
| 系统全景                       | `docs/ARCHITECTURE.md`                                                |

---

## 六、 使用约定

1. 本 Skill 根文件 **只当地图**；写代码前按阶段打开对应 `references/`。
2. references 与仓库真实导出冲突时：**以代码真实 API 为准**，并回写文档债。
3. 与 `AGENTS.md` 冲突时：以 `AGENTS.md` 工程红线为 P0。
