# AGENTS.md — 智能体协同工程最高宪法 (Harness Engineering Constitution)

本项目采用 **FDD (Feature-Driven Development) 垂直切片架构** 与 **Harness 智能体工程协同体系**。
本文件仅作为**根目录路由索引与不变红线 (Routing & Invariants)**，详细上下文与领域架构见 `.harness/` 索引。

---

## 启动工作流 (Startup Workflow: Before writing code)

开工写代码前，必须严格按顺序执行以下 6 步：

1. **确认当前工作区**：执行 `pwd` 确认处于仓库根目录。
2. **运行环境自检**：运行 `./init.sh` 确保环境基线无损。
3. **查阅特性总账**：阅读 `feature_list.json` 获取全局特性状态与前置依赖。
4. **锁定会话特性**：配置 `member.local.md` 中的 `active_feature_id`。
5. **按需加载上下文 (Progressive Disclosure)**：
   - 领域拓扑与反平铺规约：查阅 `.harness/context/tier-2-domain-matrix.md`；
   - 详细设计与权限协议：查阅 `docs/SaaS_Foundation_Minimal.md` 与 `.harness/context/tier-3-deep-dives.md`；
   - 工具与多智能体策略：查阅 `.harness/agents/` 与 `.harness/tools/policies.md`。
6. **对齐特性沙盒**：阅读 `.harness/features/<feature_id>/context.md` 并锁定 `scope.md` 白名单。

若基础自检失败，必须先修复基线问题，严禁带病开发新功能。

---

## 核心工作规则 (Working Rules)

- **单次仅限一个特性 (One feature at a time)**：仅从 `feature_list.json` 认领一个前置依赖已满足的未完成特性。
- **严格遵守修改边界 (Stay in scope)**：严格只修改对应特性 `scope.md` 白名单内列出的文件，严禁越界修改。
- **强制门禁验证 (Verification required)**：必须通过 `./scripts/verify.sh` 全栈检查，严禁未经验证宣称完成。
- **单源状态与沙盒收敛 (Single Source of Truth)**：
  - 任务进展与交接记录维护在 `progress.md`、`session-handoff.md` 与特性沙盒内；
  - 架构漂移与技术债登记至 `.harness/memory/technical-debt.md`；经验沉淀至 `.harness/memory/learnings.md`。
- **保持整洁可重启状态 (Leave clean state / restartable)**：结束时保证工作区随时可重新运行 `./init.sh`。

---

## 六大工程红线 (Zero-Tolerance Rules)

1. **严禁跨特性越权修改**：严格受限在对应特性的 `scope.md` 白名单文件内修改代码。
2. **严禁带病开发与虚假完成**：类型错误未清零、测试失败或门禁不通过，严禁宣称完成。严禁仅凭单测绿灯就宣称完成（单测运行器存在路径穿透假象），必须通过 `./scripts/verify.sh` 全栈门禁及真实构建。
3. **严禁引入跨包幽灵依赖**：任何代码引用 `@chenrun/*` 内部兄弟包时，必须首先在当前模块的 `package.json` 中显式声明 `"workspace:*"` 依赖并执行 `pnpm install`；门禁脚本对此执行零容忍静态阻断。
4. **严禁手写硬编码权限与绕过授权**：功能权限必须由 Better Auth `statement` 与 CASL 强类型判定，严禁手写魔术字符串。
5. **严禁绕过租户隔离**：PostgreSQL Database-per-Tenant 物理隔离，业务数据必须由 Tenant Context 动态路由，严禁直拼连接串。
6. **严禁破坏分层架构**：Server Components 直调 Application Service，严禁自发 HTTP 绕调内部 REST API。

---

## 完成定义 (Definition of Done: done only when)

只有当以下条件**全部满足**时，特性才算真正完成：

- [ ] 目标业务功能与逻辑全部实现完毕。
- [ ] 专属自动化测试及全栈门禁 `./scripts/verify.sh` 100% 执行通过（类型检查 0 错误、单测 0 失败）。
- [ ] 真实任务进展与验证证据已记录至 `progress.md`、特性沙盒及 `feature_list.json`。
- [ ] 仓库保持干净且可无缝重启（从标准启动入口 `./init.sh` 正常运行）。

---

## 会话结束规程 (End of Session: Before ending)

在结束当前开发会话前，必须完成：

1. 更新 `progress.md`、`session-handoff.md` 及对应特性的 `progress.md` / `handoff.md`。
2. 更新 `feature_list.json` 中的特性完成状态与真实证据。
3. 登记发现的非当前特性范围的技术债到 `.harness/memory/technical-debt.md`。
4. 运行 `./scripts/verify.sh` 确保代码库整洁可重启 (clean restartable state)。
5. 运行 `./scripts/session-end.sh` (或 `pnpm session:end`) 执行物理收尾校验。

---

## 验证与操作命令 (Verification Commands)

```bash
# 环境基线自检与启动
./init.sh

# 查看当前会话状态
./scripts/status.sh

# 全栈极速门禁自检 (包含 type check, build/lint 静态检查与 test 单测)
./scripts/verify.sh

# 会话收尾与交接状态校验
./scripts/session-end.sh
```

---

## 核心索引导航 (Navigation Pointers)

- **特性总账事实源**：`feature_list.json`
- **领域矩阵与反平铺规约**：`.harness/context/tier-2-domain-matrix.md`
- **四层权限与动态路由协议**：`.harness/context/tier-3-deep-dives.md`
- **UI/UX 工业风设计系统**：`.harness/context/design-system.md`
- **角色协作契约**：`.harness/agents/`（coordinator, implementer, researcher, reviewer）
- **技术债与避坑指南**：`.harness/memory/technical-debt.md` 与 `.harness/memory/learnings.md`
