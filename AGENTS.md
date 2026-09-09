# AGENTS.md — 智能体协同工程最高宪法 (Harness Engineering Constitution)

本项目采用 **FDD (Feature-Driven Development) 垂直切片架构** 与 **Harness 智能体工程协同体系**。

- **业务定位**：现代化工业制造与供应链多租户 SaaS ERP 系统（涵盖平台管控端 Control 与租户端 Tenant）。
- **核心技术栈**：Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + PostgreSQL (Database-per-tenant 物理隔离) + Better Auth + CASL + Turborepo / pnpm Monorepo。

> ⚠️ **地图索引定位与防膨胀规约 (Map Index & Anti-Bloat Invariant)**
> 本文件是**根目录高维地图索引与绝对不变红线**，**绝非无节制膨胀的内容仓库**。
> 严禁向本文件直接平铺堆叠业务逻辑、操作手册或冗余细节。所有可渐进式披露的领域规则、设计文档与治理规范，统一以索引方式关联到 `.harness/` 子文档中按需加载。

---

## 启动工作流 (Startup Workflow)

开工写代码前，严格按顺序执行以下 6 步：

1. **确认当前工作区**：执行 `pwd` 确认处于仓库根目录。
2. **环境基线自检**：运行 `./init.sh` 确保基础运行环境无损。
3. **查阅特性总账**：阅读 `feature_list.json` 确认全局特性状态与前置依赖。
4. **锁定会话特性**：在 `member.local.md` 中配置 `active_feature_id`。
5. **渐进式加载上下文 (Progressive Disclosure)**：根据当前任务类型，按需调阅文末导航对应文档（设计查 `context/`、决策查 `memory/adr/`、分工查 `agents/`、避坑查 `memory/`）。
6. **对齐特性沙盒**：阅读 `.harness/features/<feature_id>/context.md` 并锁定 `scope.md` 白名单。

---

## 核心工作规则 (Working Rules)

- **单特性聚焦 (One feature at a time)**：每次会话仅认领一个前置依赖已满足的未完成特性（以 `feature_list.json` 为准）。
- **严格范围边界**：严格受限在对应特性的 `scope.md` 白名单文件内修改代码，严禁越界。
- **门禁由钩子兜底 (No manual gate runs)**：日常开发**不要**主动运行全量 `./scripts/verify.sh`（耗时且由 `pre-commit` 自动兜底）；即时反馈仅对改动文件执行单测或 `lsp_diagnostics`。
- **单源状态收敛**：进度与交接记录维护在 `progress.md`、`session-handoff.md` 与特性沙盒；架构漂移与经验沉淀至 `.harness/memory/`。
- **保持整洁可重启**：结束时保证工作区随时可重新运行 `./init.sh`。

---

## 六大工程红线 (Zero-Tolerance Rules)

1. **严禁跨特性越权修改**：修改严格受限于特性 `scope.md` 白名单文件。
2. **严禁带病开发与虚假完成**：代码必须保证 `git commit` 时 pre-commit 门禁一次性通过，**严禁用 `--no-verify` 绕过钩子**。
3. **严禁引入跨包幽灵依赖**：引用 `@chenrun/*` 内部兄弟包时，必须在当前模块 `package.json` 显式声明 `"workspace:*"` 并执行 `pnpm install`。
4. **严禁硬编码权限与越权**：权限必须由 Better Auth `statement` 与 CASL 强类型判定（详见 `ADR-003` 与 `.harness/context/tier-3-deep-dives.md`）。
5. **严禁绕过租户隔离**：PostgreSQL Database-per-Tenant 物理隔离，业务数据必须由 Tenant Context 路由，严禁直拼连接串（详见 `ADR-002` 与 `.harness/context/tier-3-deep-dives.md`）。
6. **严禁破坏分层架构**：Server Components 直调 Application Service，严禁自发 HTTP 绕调内部 REST API（详见 `ADR-004` 与 `.harness/context/tier-2-domain-matrix.md`）。

---

## 完成定义 (Definition of Done)

只有当以下条件**全部满足**时，特性才算真正完成：

- [ ] 目标业务功能与逻辑全部实现完毕。
- [ ] 专属自动化测试及全栈门禁 `./scripts/verify.sh` 100% 执行通过（由 `pre-commit` 钩子提交时验证）。
- [ ] 真实任务进展与验证证据已记录至 `progress.md`、特性沙盒及 `feature_list.json`。
- [ ] 仓库保持干净且可无缝重启（运行 `./init.sh` 正常）。

---

## 会话结束规程 (End of Session)

1. 更新 `progress.md`、`session-handoff.md` 及对应特性的 `progress.md` / `handoff.md`。
2. 更新 `feature_list.json` 中的特性完成状态与真实证据。
3. 登记发现的非当前特性范围的技术债到 `.harness/memory/technical-debt.md`。
4. 提交代码（由 `pre-commit` 钩子自动执行门禁验证）；除非明确要求，无需额外手动重跑全量门禁。
5. 运行 `./scripts/session-end.sh` 执行物理收尾校验。

---

## 验证与操作命令 (Verification Commands)

```bash
# 环境基线自检与启动
./init.sh

# 查看当前会话状态
./scripts/status.sh

# 全栈门禁自检 (git commit 时由 .git/hooks/pre-commit 自动调用，平时无需手动运行)
./scripts/verify.sh

# 会话收尾与交接状态校验
./scripts/session-end.sh
```

---

## 异常与升级机制 (Escalation)

遇到以下情况**立即挂起并向人类提问**，严禁擅自猜测：

- **架构决策冲突**：多租户物理隔离、鉴权协议或跨包依赖倒置分歧；
- **需求范围模糊**：`feature_list.json` 验收标准或 `scope.md` 白名单与实际代码冲突；
- **反复测试/类型失败**：连续排查 2 轮仍未定位的底层框架或第三方依赖兼容问题；
- **环境或基线损坏**：运行 `./init.sh` 失败且根因不在当前特性范围。

---

## 渐进式核心索引导航 (Progressive Disclosure Map)

本表格为仓库唯一高维地图。智能体按任务类型直接调阅对应子文档，禁止在根目录平铺展开：

### 1. 架构设计与上下文规范 (`.harness/context/`)

| 维度 | 路径 | 核心内容与适用场景 |
| --- | --- | --- |
| **元数据 (Tier 1)** | `.harness/context/tier-1-metadata.md` | 技术栈选型、核心环境变量与基础基线配置 |
| **领域拓扑 (Tier 2)** | `.harness/context/tier-2-domain-matrix.md` | Monorepo 目录职责、反平铺规约与应用解耦 |
| **深度协议 (Tier 3)** | `.harness/context/tier-3-deep-dives.md` | 租户库物理隔离路由、四层鉴权、动态连接池协议 |
| **工业风设计系统** | `.harness/context/design-system.md` | UI/UX 工业风组件规范、设计令牌与响应式设计 |
| **上下文配额** | `.harness/context/budget.md` | Token 预算、上下文 JIT 按需加载与剪枝策略 |

### 2. 特性沙盒与状态追踪 (`feature_list.json` & `.harness/features/`)

| 维度 | 路径 | 核心内容与适用场景 |
| --- | --- | --- |
| **特性事实源 (SSoT)** | `feature_list.json` | 全局特性总账、依赖关系、完成状态与验收证据 |
| **特性开发沙盒** | `.harness/features/<id>/` | 特性专属上下文、`scope.md` 白名单与验证记录 |
| **沙盒规范模板** | `.harness/features/_template/` | 新建特性的 5 件套模板（context, scope, progress 等） |

### 3. 多智能体协同与工具治理 (`.harness/agents/` & `tools/`)

| 维度 | 路径 | 核心内容与适用场景 |
| --- | --- | --- |
| **协同总矩阵** | `.harness/agents/index.md` | Coordinator 编排流、四阶段流水线与协作铁律 |
| **角色契约清单** | `.harness/agents/` | `coordinator`, `researcher`, `implementer`, `reviewer` |
| **工具安全策略** | `.harness/tools/policies.md` | 工具权限沙盒、并发安全性与高危命令防护 |

### 4. 团队持久记忆与生命周期 (`.harness/memory/` & `lifecycle/`)

| 维度 | 路径 | 核心内容与适用场景 |
| --- | --- | --- |
| **记忆总索引** | `.harness/memory/index.md` | 团队持久化记忆与经验沉淀的统一入口 |
| **架构决策 (ADR)** | `.harness/memory/adr/` | 核心决策记录（ADR-001 ~ ADR-004 架构背景与选型理由） |
| **避坑指南** | `.harness/memory/learnings.md` | 踩坑经验、生产事故复盘与最佳实践反模式 |
| **技术债台账** | `.harness/memory/technical-debt.md` | 历史遗留问题、待重构项与架构漂移追踪 |
| **生命周期钩子** | `.harness/lifecycle/` | 会话启动自检、会话结束校验 (`session-end.mjs`) |
