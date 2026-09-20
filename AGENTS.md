# AGENTS.md — 项目工程开发规范与协同契约

本项目为 **现代化多租户 SaaS 基础设施与通用业务底座 (Modular Monorepo + Vertical Slice Architecture)**。

- **双端应用**：`apps/control`（平台管控平面）与 `apps/tenant`（租户数据平面）；
- **横向平台基建**：`packages/base/*`（`@base/auth` 认证、`@base/authorization` CASL 四层权限、`@base/db-tenant` 多租户动态连接池、`@base/ui` 工业风组件与 DataTable、`@base/shared` 序列化工具）；
- **跨业务中台资产**：`packages/biz-shared`（`@biz/shared` 审批流状态机、单据发号器契约）；
- **平台系统套件**：`packages/platform/*`（`@platform/control-admin` 平台管控中心、`@platform/tenant-admin` 租户系统设置）；
- **垂直业务切片**：`packages/domains/*`（各业务切片物理内聚、无横向耦合，例如 `@domain/customer-center` 客户中心等领域）；
- **迁移引擎与工具**：`tooling/db-migrate`（12-Factor 无状态自愈迁移引擎）；
- **全栈开发规范事实源**：本底座派生出的全套开发规范详见 **`.agents/skills/next-saas-base-dev/`**（开工前必须参考）。

---

## 启动工作流 (Startup Workflow)

开工写代码前，按顺序执行以下 4 步：

1. **确认工作区**：执行 `pwd` 确认处于仓库根目录；
2. **运行自检基线**：执行 `pnpm init`（或 `node scripts/init.mjs`）确保环境就绪并挂载 Git pre-commit 物理门禁；
3. **锁定目标范围**：查阅 `feature_list.json` 确认目标特性状态与前置依赖（或遵循用户明确指定的任务边界）；
4. **加载开发规范**：涉及业务切片开发或基座改造时，加载 `.agents/skills/next-saas-base-dev/` 规范执行。

---

## 核心工作规则 (Working Rules)

- **单任务聚焦 (One feature/task at a time)**：每次仅处理一个明确目标，严禁跨范围随意修改无关文件；
- **提交前必须审阅确认 (Human Review Before Commit)**：在执行 `git commit` 前，智能体必须主动向用户呈现本次修改清单与核心变更说明，**获得用户明确确认审阅通过后方可执行提交**，严禁擅自静默提交；
- **提交信息必须使用中文 (Chinese Commit Message)**：Git 提交信息必须严格遵循 Conventional Commits 规范，且 Header 说明与 Body 详细要点**必须使用中文书写**（例如 `feat(material): 实现物料与工艺BOM中心及全仓权限四维契约标准化`），严禁使用全英文提交信息；
- **门禁由钩子兜底 (No manual gate runs)**：日常开发**不要**手动全量运行 `pnpm verify`（耗时且由 Git `pre-commit` 自动兜底）；即时反馈仅对改动文件执行同级单测或类型检查；
- **单源状态收敛**：特性开发进度与真实交付证据严格记录至 `feature_list.json` 与沙盒 `progress.md`；
- **插件条件路由 (Optional Plugin Routing)**：运行时按需探测宿主能力（若当前环境存在 `typesafe_evaluate` 则动态路由至 `.harness/plugins/jev-evaluator.md` 启用辅助判断，不存在则直接跳过路由，平滑保持原生工作流）；
- **保持整洁可重启**：结束时工作区随时可重新无损运行 `pnpm init`（或 `node scripts/init.mjs`）。

---

## 工程红线体系 (Zero-Tolerance Rules)

1. **严禁破坏模块与依赖边界**：严格受限于目标改动范围；引用兄弟包必须在 `package.json` 显式声明 `"workspace:*"`，严禁幽灵依赖；
2. **严禁未经审阅擅自提交与带病提交**：必须经用户显式审阅确认后提交；代码必须保证 `git commit` 时 pre-commit 门禁一次性通过，**严禁用 `--no-verify` 绕过钩子**；
3. **严禁用 `any` 恶性降解（强制全链路强类型与类型健全）**：全仓代码（业务切片、服务层、UI 组件、测试与工具库）必须 100% 遵循 TypeScript 强类型约束，**严禁使用 `any`、`(x as any)`、无 SAFETY 说明的任意类型强转**；所有 I/O 与入参边界必须通过 Zod Schema 或严格的 Type Guard 收敛，所有数据库查询必须依托 Prisma 强类型（如 `TenantPrisma.*WhereInput`），确保类型端到端严格可推导；
4. **严禁手写裸 DOM 与原生非受控控件**：界面必须 100% 使用 `@base/ui` (shadcn) 原子与复合套件搭建（如 `Table`, `DatePicker`, `Select`, `Dialog`, `Button`, `DataTable.Workspace` 等），严禁在业务切片内手写原生 `<table>`、原生 `<input type="date">` 或手写零散裸 `div` 布局；
5. **严禁写操作按钮裸奔（必须受控于 CASL）**：标准列表优先使用 `DataTable`（显式配置 `subject` 自动接管 `create`、`export` 与行操作 `DataTableRowActions`）；非 DataTable 的自定义视图（如树形卡片、独立操作栏）必须通过 `useAbility()` 或 `<AuthGuard action={...} subject={...}>` 声明式守卫进行权限控制，严禁在页面中渲染无权限守卫的写操作按钮（新增、编辑、删除、状态启停用等）；
6. **严禁破坏运行时与序列化防线（严禁 RSC 跨端透传函数）**：RSC 通过 server-only Query 读取，禁止内部 HTTP 伪接口绕调；RSC 向 Client 组件仅允许传递经序列化的纯数据，**严禁将未标 `"use server"` 的 query 函数或普通服务端函数作为 prop 直接传递给 Client 组件**；Server Action 必须使用 `defineServerAction` 包装并通过 `toPlainData` 彻底消除 Date/Decimal 跨端序列化异常；
7. **严禁硬编码权限与越权**：认证归 Better Auth（管进门），授权统一由 CASL 强类型判定（管屋内），禁止混淆两者边界；
8. **严禁绕过租户物理隔离**：PostgreSQL Database-per-tenant 隔离，业务数据必须由 `TenantDbManager` 动态路由，严禁拼接直连连接串或跨租户穿透；
9. **业务实体必带审计基线**：除明确白名单豁免外，所有业务数据实体模型必须强制包含 8 大基础审计与软删除字段（ADR-009，门禁静态硬拦截）；
10. **交互单次确认与零全页强刷**：破坏性操作统一由 `ConfirmDialog` 提示一次，严禁浏览器原生 `confirm(...)` 与 `window.location.reload()`；
11. **跨平台统一 Node.js 脚本规范**：全仓所有构建、门禁、初始化与治理脚本必须 100% 使用 Node.js (`*.mjs`) 实现，**严禁引入平台相关的 Shell 脚本 (`*.sh` / `*.bash`)**，抹平 Windows/Mac/Linux 开发环境差异。门禁与 `init.mjs` 强制静态与运行时双重拦截。

---

## 完成定义 (Definition of Done)

只有当以下条件全部满足时，任务才算真正完成：

- [ ] 目标功能、接口或修复逻辑全部实现完毕；
- [ ] 对应单元测试通过（遵循 Colocation 同级就近共存）；
- [ ] 真实交付证据记录至 `feature_list.json` 或特性沙盒 `progress.md`；
- [ ] 代码通过 Git pre-commit 门禁并成功提交，仓库保持干净且随时可无缝重启（`pnpm init` 正常）。

---

## 会话结束规程 (End of Session)

1. 更新 `feature_list.json` 中的特性完成状态与真实证据（`evidence`）；
2. 登记发现的非本次任务范围的技术债至 `.harness/memory/technical-debt.md`；
3. 提交代码（由 `.git/hooks/pre-commit` 自动运行门禁验证）；
4. 可选运行 `pnpm session:end`（或 `node .harness/lifecycle/session-end.mjs`）验证交接完整性。

---

## 验证命令 (Verification Commands)

```bash
# 启动环境健康自检与钩子装载
pnpm init # 或 node scripts/init.mjs

# 查看当前会话与特性进度
pnpm status # 或 node scripts/tools/status.mjs

# 全栈门禁自检 (平时无需手动执行，git commit 时由 pre-commit 自动触发)
pnpm verify # 或 node scripts/verify.mjs

# 会话收尾完整性校验 (可选)
node .harness/lifecycle/session-end.mjs
```

---

## 异常与升级机制 (Escalation)

遇到以下情况**立即挂起并向人类提问**，严禁擅自猜测：

- **架构决策冲突**：多租户分库隔离策略、鉴权协议或跨包依赖倒置分歧；
- **需求范围模糊**：`feature_list.json` 验收标准与实际代码诉求冲突；
- **反复测试/类型失败**：连续排查 2 轮仍未定位的底层框架或依赖兼容问题；
- **环境或基线损坏**：运行 `pnpm init`（或 `node scripts/init.mjs`）报错退出且根因不在当前改动范围。

---

## 渐进式资源索引导航 (Progressive Disclosure)

根据具体任务类型，按需调阅对应底层文档，杜绝盲目全库扫描：

| 维度                        | 路径                                                                       | 核心内容与适用场景                                                                 |
| :-------------------------- | :------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| **全栈开发规范事实源**      | `.agents/skills/next-saas-base-dev/`                                       | 涵盖切片 8 阶段流水线、纯数据契约、工业风 UI、CASL Provider、基座基础设施演进      |
| **智能体开发工作流**        | `docs/collaboration/agent-development-workflow.md`                         | 智能体端到端 5 步闭环作业指导书 (SOP)、双轨模式与门禁规范                          |
| **系统架构白皮书**          | `docs/ARCHITECTURE.md`                                                     | 双平面运行模型、四大架构支柱、技术栈选型与全景索引                                 |
| **多租户分库深度解析**      | `docs/architecture/saas-multitenant-architecture.md`                       | 物理分库连接池治理、并发防击穿、TenantDbManager 与全生命周期                       |
| **权限系统全链路**          | `docs/permissions/permission-architecture-deep-dive.md`                    | CASL 四层权限闭环、SQL 自动下推、字段物理剥离与端到端时序                          |
| **权限缓存与局部渲染范式**  | `docs/permissions/nextjs-app-router-casl-caching-and-partial-rendering.md` | React.cache 请求去重、Layout 骨架提升与 Context 双层缓存最佳实践                   |
| **自愈数据迁移引擎**        | `docs/architecture/database-migration-engine.md`                           | 12-Factor 原则、预编译 Catalog、Schema 聚合与咨询锁机制                            |
| **Turborepo 拓扑与缓存**    | `docs/architecture/turborepo-pipeline-and-cache-specification.md`          | turbo.json 完整拓扑规范、依赖流向、增量缓存策略与任务机制                          |
| **工程命令技术手册**        | `docs/collaboration/scripts-reference.md`                                  | 根 package.json 全量命令参考、Turborepo 任务拓扑与 Next.js 运行时自愈机制          |
| **团队架构决策 (ADR)**      | `.harness/memory/adr/`                                                     | 核心决策记录（ADR-001 ~ ADR-009 分层、分库、权限、审计基线）                       |
| **团队持久记忆**            | `.harness/memory/`                                                         | 避坑经验 (`learnings.md`) 与技术债台账 (`technical-debt.md`)                       |
| **多智能体编排 (按需选用)** | `.harness/agents/index.md`                                                 | **仅在复杂多阶段或跨模块并行任务中选用**：Coordinator 编排与角色契约               |
| **Harness 可选扩展插件**   | `.harness/plugins/`                                                        | 可选插件契约目录（如 Jev 判断器 jev-evaluator.md）；环境命中时动态路由，未命中不路由 |
| **生命周期钩子脚本**        | `.harness/lifecycle/`                                                      | 环境启动检查 (`bootstrap.mjs`, `session-start.mjs`) 与收尾校验 (`session-end.mjs`) |
