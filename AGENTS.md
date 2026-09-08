# AGENTS.md — 智能体协同工程最高宪法 (Harness Engineering Constitution)

本项目采用 **FDD (Feature-Driven Development) 垂直切片架构** 与 **工业级 Harness 工程协同体系**。无论人类开发者还是 AI 智能体，必须无条件遵守本宪法。

---

## 启动工作流 (Startup Workflow: Before writing code)

开工写代码前，必须严格按顺序执行以下 6 步：

1. **确认当前工作区**：执行 `pwd` 确认处于仓库根目录。
2. **阅读本文件**：完整阅读 `AGENTS.md`，明确行为准则与红线。
3. **查阅项目架构文档**：阅读 `docs/SaaS_Foundation_Minimal.md`。
4. **运行环境自检**：运行 `./init.sh` 确保环境无损。
5. **查阅多智能体与工具规范**：参阅 `.harness/agents/index.md` 与 `.harness/tools/policies.md`。
6. **查阅特性总账**：阅读 `feature_list.json` 获取全局特性状态与前置依赖。
7. **锁定会话特性**：配置 `member.local.md` 中的 `active_feature_id`。

若基础自检失败，必须先修复基线问题，严禁带病开发新功能。

---

## 核心工作规则 (Working Rules)

- **单次仅限一个特性 (One feature at a time)**：从 `feature_list.json` 中仅认领一个前置依赖已满足的未完成特性。
- **严格遵守修改边界 (Stay in scope)**：严格只修改 `.harness/features/<feature_id>/scope.md` 白名单内列出的文件，严禁越界修改其他目录。
- **强制门禁验证 (Verification required)**：不运行门禁验证命令，绝对不能宣称完成。
- **单源状态与沙盒收敛 (Single Source of Truth)**：
  - 各特性的阶段任务清单、测试输出与换手交接单严格在专属沙盒 `.harness/features/<feature_id>/progress.md` 与 `handoff.md` 中维护，杜绝双写冗余；
  - 发现的历史遗留问题与架构漂移统一登记至 `.harness/memory/technical-debt.md`；
  - 踩坑经验与通用架构反思沉淀至 `.harness/memory/learnings.md`。
- **保持整洁可重启状态 (Leave clean state / restartable)**：结束时保证工作区处于随时可重新运行 `./init.sh` 的健康状态。

---

## 架构与工程规范 (Architectural & Engineering Principles)

- **Turborepo 多应用解耦与极薄路由 (Multi-App Decoupling & Thin Routing)**：
  - `apps/tenant`（租户端 SaaS ERP）与 `apps/platform`（平台运营商总控）双核独立部署，物理隔离租户上下文与跨租户运维视界；
  - `apps/*/src/app/` 仅作为页面路由与权限上下文的装配层（Thin Routing），严禁在应用内部直接编写领域业务服务或直接 SQL 查询。
- **FDD (Feature-Driven Development) 垂直切片规范**：
  - 核心领域业务逻辑、专属 UI 交互组件、权限事实源与 DTO 类型全部内聚沉淀在 `packages/features/<feature-name>/` 专属包中；
  - 每个垂直切片包保持自包含与高内聚，应用通过引用切片包进行路由挂载，严禁跨切片循环依赖。
- **高内聚、低耦合、单一职责 (High Cohesion, Low Coupling, Single Responsibility)**：
  - 模块与包之间职责边界绝对清晰，业务切片独立内聚，底座包仅提供纯粹的基础服务与抽象契约，严禁循环依赖或倒置反向依赖。
  - 函数与类严格遵循单一职责，避免巨石函数与过度泛化的“瑞士军刀”结构；跨层调用依赖明确接口或强类型契约。
  - 授权、租户、ORM、数据范围与字段策略正交拆分，保持可插拔与可单测性。
- **全中文代码注释规范 (Chinese Code Comments Requirement)**：
  - 仓库内所有新增与修改的代码注释（包括 JSDoc/TSDoc、行内注释、块注释、架构说明等）必须统一使用中文，严禁使用英文随意注释，确保团队与智能体之间意图准确透明。
- **TypeScript 强类型与零 any 纪律 (Strict TypeScript & Zero Any Discipline)**：
  - 严禁滥用 `any`。所有函数参数、返回值、复杂结构必须提供精确类型定义或合理的泛型约束；
  - 必须使用 `unknown`、`never`、类型守卫 (Type Guard) 或精准接口替换随意声明的 `any`；必要底层库类型断言必须有明确的上下文或 `SAFETY:` 说明，做到编译期类型安全与可预测性。

---

## 五大工程红线 (Zero-Tolerance Rules)

1. **严禁跨特性越权修改**：只能在对应特性的 `scope.md` 白名单文件内修改代码。
2. **严禁带病开发与虚假完成**：类型错误未清零、测试失败或门禁不通过，严禁宣称完成。
3. **严禁手写硬编码权限与绕过授权**：功能权限统一在模块的 Better Auth `statement` (Resource -> Actions) 与 CASL `Subject/Action` 中声明；服务端通过 `@RequireAbility` / CASL `can()` 强类型判定，前端通过 `<Can>` / `<Permission>` 门禁，严禁手写绕过授权体系的魔术字符串。
4. **严禁绕过租户隔离**：PostgreSQL Database-per-Tenant 物理隔离，业务数据必须由 Tenant Context 动态路由，严禁客户端直拼连接串。
5. **严禁破坏分层架构**：Next.js Server Components 直调 Application Service，严禁自发 HTTP 绕调内部 REST API。

---

## 完成定义 (Definition of Done: done only when)

只有当以下条件**全部满足**时，特性才算真正完成：

- [ ] 目标业务功能与逻辑全部实现完毕。
- [ ] 专属自动化测试及全栈门禁 `./scripts/verify.sh` 100% 执行通过（类型检查 0 错误、单测 0 失败）。
- [ ] 真实任务进展与验证证据已记录至 `.harness/features/<feature_id>/progress.md` 与 `feature_list.json`。
- [ ] 仓库保持干净且可无缝重启（从标准启动入口 `./init.sh` 正常运行）。

---

## 会话结束规程 (End of Session: Before ending)

在结束当前开发会话前，必须完成：

1. 在当前特性沙盒 `.harness/features/<feature_id>/progress.md` 与 `handoff.md` 记录详细执行状态、产出与交接信息。
2. 更新 `feature_list.json` 中的特性完成状态与真实证据。
3. 若存在跨特性的历史遗留缺陷或架构漂移，统一登记到 `.harness/memory/technical-debt.md`；若有踩坑经验，沉淀到 `.harness/memory/learnings.md`。
4. 运行 `./scripts/verify.sh` 确保留给下一会话一个可正常重启的干净代码库 (clean restartable state)。
5. 运行 `./scripts/session-end.sh` (或 `pnpm session:end`) 执行物理收尾校验，确认沙盒交接闭环就绪。

---

## 验证命令 (Verification Commands)

```bash
# 环境自检
./init.sh

# 查看当前会话状态
./scripts/status.sh

# 全栈极速门禁自检 (包含 type check, lint 与 test)
./scripts/verify.sh

# 会话收尾与交接状态校验
./scripts/session-end.sh
```

---

## 多智能体协同与技术债收敛机制 (Multi-Agent & Technical Debt)

- **四大核心角色**：系统遵循 `harness-creator` 标准收敛为 `coordinator` (编排)、`researcher` (研究/架构)、`implementer` (实现)、`reviewer` (审计) 四大角色，详细契约见 `.harness/agents/`。
- **技术债收敛铁律**：开发或审查时发现的非当前 Feature 范围的历史遗留问题，**严禁擅自直接重构**，必须统一登记至 `.harness/memory/technical-debt.md`，由 Coordinator 统一评估并排期。
- **工具安全沙箱**：受保护路径（`.git/**`, `.env*` 等）与危险命令策略受 `.harness/tools/policies.md` 约束。

---

## 必需的核心工件 (Required Artifacts)

- `feature_list.json` — 全局特性状态总账 (唯一事实源)
- `.harness/features/<id>/` — 单特性专属沙盒（含 `progress.md`, `handoff.md`, `scope.md`, `context.md`, `verification.md`）
- `.harness/memory/` — 架构决策 (ADR)、避坑指南 (learnings) 与技术债台账 (technical-debt)
- `init.sh` — 标准自检与启动脚本
- `member.local.md` — 本地会话单特性锁定锚点
