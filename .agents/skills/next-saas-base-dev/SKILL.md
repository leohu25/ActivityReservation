---
name: next-saas-base-dev
description: 现代多租户 SaaS 架构全栈工程开发与基建演进标准指南。本规范从企业级真实生产工程中严格提炼派生，是本模板项目及所有基于本基座衍生项目的核心开发宪法与权威事实源。在进行任何代码编写、功能开发、模块扩展、架构重构、组件封装或缺陷修复时必须优先加载并严格遵循本指南。涵盖两大核心领域：1. 业务特性垂直切片开发（packages/domains/* 与 packages/platform/*），严格遵循客户档案黄金标杆 CRUD 范式（细节见 references/9-crud-resource-paradigm.md）；2. 平台基座与基础设施框架演进（@base/* 与 tooling/db-migrate）。触发场景：开发/修改任何业务功能或特性切片、实现 CRUD、编写 Server Action/Query、调整 DataTable/FormModal、迭代 base 基础设施、修改 apps 装配层、修复 Bug。必须加载本技能并按 references 索引执行；禁止过时 API（见下方作废清单）。
color: blue
emoji: 🚀
vibe: 契约即事实源、约定大于配置、少即是多
agent_created: true
---

# 现代多租户 SaaS 架构开发规范 (Next SaaS Base Dev)

> **本文件定位**：**地图与索引**。只保留分层、红线摘要、流水线索引与阅读导航。  
> **具体开发细节一律在 `references/`**，禁止把实现示例堆进本文件。

> **权威目标规格**：`docs/architecture/refactoring-architecture-and-official-patterns.md`  
> **标杆实现**：`packages/domains/customer-center/src/features/customer-management/*`  
> 与 `apps/tenant/src/app/(dashboard)/customer/customers/page.tsx`

---

## 一、 包拓扑地图

```text
apps/control | apps/tenant          双端装配
packages/domains/*                  业务切片（customer-center 等）
packages/platform/*                 平台业务（control-admin / tenant-admin）
packages/base/ui                    UI 契约：DataTable / FormModal / list params
packages/base/biz-shared            资源管道：createResource*
packages/base/shared                defineServerAction / toPlainData
packages/base/auth | authorization | db-tenant | db-control
tooling/db-migrate                  12-Factor 迁移引擎
```

- 业务切片现行路径：`packages/domains/*`、`packages/platform/*`（勿再写 `packages/features/*` 作为现行目录）。
- **不单开** `@base/crud` 一类包；缺能力增强 `@base/ui` 或 `@base/biz-shared`。

---

## 二、 红线摘要（细则见对应 reference）

| # | 红线 | 细则 |
| :--- | :--- | :--- |
| 1 | 权限/列表 URL 契约收敛在 `contract.ts`（SSoT），门禁脚本硬拦 | `references/1-contracts.md` |
| 2 | mutation：`defineServerAction` + `toPlainData`；RSC→Client 禁 Promise/函数 props | `references/4-server-actions.md` |
| 3 | 破坏性操作单次 `ConfirmDialog`；反馈用 Toast；禁 `window.location.reload()` | `references/5-ui-components.md` |
| 4 | 数据经 `TenantDbManager` 分库路由，禁拼连接串 | `docs/ARCHITECTURE.md`、db-tenant 文档 |
| 5 | 标准列表：`DataTable` 默认 chrome + `useListSearch`；禁业务手绘表壳 | `references/5-ui-components.md` |
| 6 | 写路径 CASL（Action 内断言 + UI `subject`/门禁） | `references/4`、`references/7` |
| 7 | 列表 URL：`defineListSearchParams`；Client：`useListSearch` | `references/9-crud-resource-paradigm.md` |
| 8 | CRUD 表单：`FormModal` + schema/fields；禁业务层手写字段树 / 直接 RHF | `references/5-ui-components.md` |
| 9 | 标准 CRUD 优先 `createResourceActions` / `createResourcePage`；`use server` 平铺导出 | `references/9`、`references/4` |
| 10 | 导出走 `exportContractCsv` + 契约字段 | `references/1-contracts.md` |
| 11 | 原子层 shadcn 规范（`@base/ui` `components/ui/`） | `.agents/skills/shadcn/` |
| 12 | 通用能力上浮至 `@base/ui` / `@base/biz-shared`，禁业务平行第二套 | `references/8-base-infrastructure.md` |
| 13 | 测试同级共存；实体审计+软删除基线；提交前人工审阅 + 中文 Conventional Commits；禁 `--no-verify` | `AGENTS.md`、`references/2-schema-migrate.md` |

**作废 / 禁止用于新代码**（仅存量迁移过渡的标 `@deprecated`）：

`useTableUrlState`、`parseTableSearchParams`、`useDataTableState`、`useListUrlNav`、业务层 RHF 手写表单、ListShell/TableRegion、`count(*)+1` 发号、客户端默认 `router.refresh()`、单开 `@base/crud` 包。

---

## 三、 赛道一：业务切片流水线（地图）

**标杆 SOP 与示例** → [`references/9-crud-resource-paradigm.md`](./references/9-crud-resource-paradigm.md)（必读）

```text
① contract.ts     权限契约 + defineListSearchParams 扩展字段
② schema.ts       共享 Zod
③ service.ts      领域逻辑（事务 / 发号 / 状态机）
④ queries.ts      server-only + cache + DTO
⑤ actions.ts      createResourceActions → 平铺 export
⑥ ui/*FormModal   FormModal + schema/fields + subject
⑦ ui/*View        useListSearch + DataTable + filterExtra
⑧ apps page.tsx   createResourcePage
→ 单测与 check/test 全绿
```

| 阶段 | 深入阅读 |
| :--- | :--- |
| ① 契约 | `references/1-contracts.md` |
| ②③ 数据与服务 | `references/2-schema-migrate.md`、`references/3-services.md` |
| ⑤ Actions | `references/4-server-actions.md` |
| ⑥⑦ UI | `references/5-ui-components.md` |
| ⑧ 装配 / Manifest | `references/6-tenant-routing.md` |
| CASL Provider | `references/7-casl-ability-provider.md` |
| 包骨架 | `references/0-architecture-topology.md` |

---

## 四、 赛道二：基座演进（地图）

升级 `@base/*`、`tooling/*`、apps 装配时：

1. 读 [`references/8-base-infrastructure.md`](./references/8-base-infrastructure.md)（职责、单向依赖、Level1→2→3）；
2. 架构全景：`docs/ARCHITECTURE.md` 及 `docs/architecture/*`；
3. **禁止** `@base/*` 依赖 `packages/domains/*` / `packages/platform/*`。

---

## 五、 渐进式阅读索引

| 领域 | 路径 |
| :--- | :--- |
| **CRUD 黄金标杆（必读）** | `references/9-crud-resource-paradigm.md` |
| 切片包骨架 | `references/0-architecture-topology.md` |
| 契约 | `references/1-contracts.md` |
| Schema / 迁移 | `references/2-schema-migrate.md` |
| Service / Query | `references/3-services.md` |
| Server Actions | `references/4-server-actions.md` |
| DataTable / FormModal | `references/5-ui-components.md` |
| 路由 / page / Manifest | `references/6-tenant-routing.md` |
| CASL Provider | `references/7-casl-ability-provider.md` |
| 基座包 | `references/8-base-infrastructure.md` |
| 目标架构规格 | `docs/architecture/refactoring-architecture-and-official-patterns.md` |
| 系统全景 | `docs/ARCHITECTURE.md` |

---

## 六、 使用约定

1. 本 Skill 根文件 **只当地图**；写代码前按阶段打开对应 `references/`。  
2. references 与仓库真实导出冲突时：**以代码真实 API 为准**，并回写文档债。  
3. 与 `AGENTS.md` 冲突时：以 `AGENTS.md` 工程红线为 P0。
