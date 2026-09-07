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
6. **查阅特性总账**：阅读 `feature_list.json` 与 `progress.md` 获取当前特性状态。
7. **锁定会话特性**：配置 `member.local.md` 中的 `active_feature_id`。

若基础自检失败，必须先修复基线问题，严禁带病开发新功能。

---

## 核心工作规则 (Working Rules)

- **单次仅限一个特性 (One feature at a time)**：从 `feature_list.json` 中仅认领一个前置依赖已满足的未完成特性。
- **严格遵守修改边界 (Stay in scope)**：严格只修改 `.harness/features/<feature_id>/scope.md` 白名单内列出的文件，严禁越界修改其他目录。
- **强制门禁验证 (Verification required)**：不运行门禁验证命令，绝对不能宣称完成。
- **及时更新状态记录 (Update artifacts)**：每次会话结束前必须更新 `feature_list.json`、`progress.md` 与 `session-handoff.md`。
- **保持整洁可重启状态 (Leave clean state / restartable)**：结束时保证工作区处于随时可重新运行 `./init.sh` 的健康状态。

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
- [ ] 真实验证输出与日志已作为证据记录到 `feature_list.json` 与 `progress.md` 中。
- [ ] 仓库保持干净且可无缝重启（从标准启动入口 `./init.sh` 正常运行）。

---

## 会话结束规程 (End of Session: Before ending)

在结束当前开发会话前，必须完成：

1. 更新 `progress.md` 记录当前执行状态与产出。
2. 更新 `feature_list.json` 中的特性完成状态与证据。
3. 若存在未解决的风险或阻塞项，记录到 `session-handoff.md`。
4. 运行 `./scripts/verify.sh` 确保留给下一会话一个可正常重启的干净代码库 (clean restartable state)。

---

## 验证命令 (Verification Commands)

```bash
# 环境自检
./init.sh

# 查看当前会话状态
./scripts/status.sh

# 全栈极速门禁自检 (包含 type check, lint 与 test)
./scripts/verify.sh
```

---

## 多智能体协同与技术债收敛机制 (Multi-Agent & Technical Debt)

- **四大核心角色**：系统遵循 `harness-creator` 标准收敛为 `coordinator` (编排)、`researcher` (研究/架构)、`implementer` (实现)、`reviewer` (审计) 四大角色，详细契约见 `.harness/agents/`。
- **技术债收敛铁律**：开发或审查时发现的非当前 Feature 范围的历史遗留问题，**严禁擅自直接重构**，必须统一登记至 `.harness/memory/technical-debt.md`，由 Coordinator 统一评估并排期。
- **工具安全沙箱**：受保护路径（`.git/**`, `.env*` 等）与危险命令策略受 `.harness/tools/policies.md` 约束。

---

## 必需的核心工件 (Required Artifacts)

- `feature_list.json` — 全局特性状态总账 (唯一事实源)
- `progress.md` — 持续推进看板与证据库
- `init.sh` — 标准自检与启动脚本
- `session-handoff.md` — 跨会话换手交接单
- `member.local.md` — 本地会话单特性锁定锚点
