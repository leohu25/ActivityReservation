# AGENTS.md — 项目工程开发规范与协同契约

本项目为 **现代化多租户 SaaS 基础设施与通用业务底座 (Modular Monorepo + Vertical Slice Architecture)**。

- **双端应用**：`apps/control`（平台管控平面）与 `apps/tenant`（租户数据平面）；
- **横向平台基建**：`@base/auth`（认证）、`@base/authorization`（CASL 四层权限）、`@base/db-tenant`（多租户动态连接池）、`@base/ui`（工业风组件与 DataTable）、`@base/biz-shared`（业务中台资产）、`tooling/db-migrate`（12-Factor 无状态迁移引擎）；
- **纵向业务切片**：`packages/features/*`（各业务切片物理内聚、无横向耦合）；
- **全栈开发规范事实源**：本底座派生出的全套开发规范详见 **`.agents/skills/next-saas-base-dev/`**（开工前必须参考）。

---

## 启动工作流 (Startup Workflow)

开工写代码前，按顺序执行以下 4 步：

1. **确认工作区**：执行 `pwd` 确认处于仓库根目录；
2. **运行自检基线**：执行 `./init.sh` 确保环境就绪并挂载 Git pre-commit 物理门禁；
3. **锁定目标范围**：查阅 `feature_list.json` 确认目标特性状态与前置依赖（或遵循用户明确指定的任务边界）；
4. **加载开发规范**：涉及业务切片开发或基座改造时，加载 `.agents/skills/next-saas-base-dev/` 规范执行。

---

## 核心工作规则 (Working Rules)

- **单任务聚焦 (One feature/task at a time)**：每次仅处理一个明确目标，严禁跨范围随意修改无关文件；
- **门禁由钩子兜底 (No manual gate runs)**：日常开发**不要**手动全量运行 `./scripts/verify.sh`（耗时且由 Git `pre-commit` 自动兜底）；即时反馈仅对改动文件执行同级单测或类型检查；
- **单源状态收敛**：特性开发进度与真实交付证据严格记录至 `feature_list.json` 与沙盒 `progress.md`；
- **保持整洁可重启**：结束时工作区随时可重新无损运行 `./init.sh`。

---

## 六大工程红线 (Zero-Tolerance Rules)

1. **严禁破坏模块与依赖边界**：严格受限于目标改动范围；引用兄弟包必须在 `package.json` 显式声明 `"workspace:*"`，严禁幽灵依赖；
2. **严禁带病提交与虚假完成**：代码必须保证 `git commit` 时 pre-commit 门禁一次性通过，**严禁用 `--no-verify` 绕过钩子**；
3. **严禁硬编码权限与越权**：认证归 Better Auth（管进门），授权统一由 CASL 强类型判定（管屋内），禁止混淆两者边界；
4. **严禁绕过租户物理隔离**：PostgreSQL Database-per-tenant 隔离，业务数据必须由 `TenantDbManager` 动态路由，严禁拼接直连连接串或跨租户穿透；
5. **严禁破坏运行时与序列化防线**：RSC 通过 server-only Query 读取，禁止内部 HTTP 伪接口绕调；Server Action 必须使用 `defineServerAction` 包装并通过 `toPlainData` 彻底消除 Date/Decimal 跨端序列化异常；
6. **业务实体必带审计基线**：除明确白名单豁免外，所有业务数据实体模型必须强制包含 8 大基础审计与软删除字段（ADR-009，门禁静态硬拦截）。

---

## 完成定义 (Definition of Done)

只有当以下条件全部满足时，任务才算真正完成：

- [ ] 目标功能、接口或修复逻辑全部实现完毕；
- [ ] 对应单元测试通过（遵循 Colocation 同级就近共存）；
- [ ] 真实交付证据记录至 `feature_list.json` 或特性沙盒 `progress.md`；
- [ ] 代码通过 Git pre-commit 门禁并成功提交，仓库保持干净且随时可无缝重启（`./init.sh` 正常）。

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
./init.sh

# 查看当前会话与特性进度
./scripts/status.sh

# 全栈门禁自检 (平时无需手动执行，git commit 时由 pre-commit 自动触发)
./scripts/verify.sh

# 会话收尾完整性校验 (可选)
node .harness/lifecycle/session-end.mjs
```

---

## 异常与升级机制 (Escalation)

遇到以下情况**立即挂起并向人类提问**，严禁擅自猜测：

- **架构决策冲突**：多租户分库隔离策略、鉴权协议或跨包依赖倒置分歧；
- **需求范围模糊**：`feature_list.json` 验收标准与实际代码诉求冲突；
- **反复测试/类型失败**：连续排查 2 轮仍未定位的底层框架或依赖兼容问题；
- **环境或基线损坏**：运行 `./init.sh` 报错退出且根因不在当前改动范围。

---

## 渐进式资源索引导航 (Progressive Disclosure)

根据具体任务类型，按需调阅对应底层文档，杜绝盲目全库扫描：

| 维度 | 路径 | 核心内容与适用场景 |
| :--- | :--- | :--- |
| **全栈开发规范事实源** | `.agents/skills/next-saas-base-dev/` | 涵盖切片 8 阶段流水线、纯数据契约、工业风 UI、CASL Provider、基座基础设施演进 |
| **智能体开发工作流** | `docs/collaboration/agent-development-workflow.md` | 智能体端到端 5 步闭环作业指导书 (SOP)、双轨模式与门禁规范 |
| **系统架构白皮书** | `docs/ARCHITECTURE.md` | 双平面运行模型、四大架构支柱、技术栈选型与全景索引 |
| **多租户分库深度解析** | `docs/architecture/saas-multitenant-architecture.md` | 物理分库连接池治理、并发防击穿、TenantDbManager 与全生命周期 |
| **权限系统全链路** | `docs/permissions/permission-architecture-deep-dive.md` | CASL 四层权限闭环、SQL 自动下推、字段物理剥离与端到端时序 |
| **自愈数据迁移引擎** | `docs/architecture/database-migration-engine.md` | 12-Factor 原则、预编译 Catalog、Schema 聚合与咨询锁机制 |
| **团队架构决策 (ADR)** | `.harness/memory/adr/` | 核心决策记录（ADR-001 ~ ADR-009 分层、分库、权限、审计基线） |
| **团队持久记忆** | `.harness/memory/` | 避坑经验 (`learnings.md`) 与技术债台账 (`technical-debt.md`) |
| **多智能体编排 (按需选用)** | `.harness/agents/index.md` | **仅在复杂多阶段或跨模块并行任务中选用**：Coordinator 编排与角色契约 |
| **生命周期钩子脚本** | `.harness/lifecycle/` | 环境启动检查 (`bootstrap.mjs`, `session-start.mjs`) 与收尾校验 (`session-end.mjs`) |
