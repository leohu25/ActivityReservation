# Harness 智能体与多人协同工程架构指南 (Harness Engineering Guide)

> **核心提示**：本规范定义了一套经过工业级实战验证的“人类开发者 + 多 AI 智能体”安全协同工程体系。  
> **在新项目中初始化**：请直接调用 **`harness-creator` skill**，并以此文档为架构蓝图，在目标代码仓库中一键生成标准的 Harness 基础设施。

---

## 一、 Harness 的本质：给 AI 编码戴上“工程紧箍咒”

大模型写代码最常见的四大顽疾：

1. **记忆漂移**：跨会话后忘记上下文，胡乱修改不相干的文件；
2. **带病开发**：在测试报错、类型未通过的情况下强行宣布完成；
3. **多人冲突**：多个开发者/智能体并发改动互相踩脚；
4. **上下文爆炸**：一次性塞入成千上万行全量代码导致模型幻觉。

**Harness 通过“沙盒隔离 + 严格门禁 + 状态总账 + 分层上下文”彻底解决以上问题。**

---

## 二、 核心目录骨架与职责分工

新项目初始化后的 `.harness/` 标准结构：

```text
根目录/
├── AGENTS.md / CLAUDE.md          # 智能体最高宪法（五大工程红线与自检协议）
├── init.sh                        # 会话启动第一步：环境探测与合法性自检
├── feature_list.json              # 全局特性总账（唯一的 Feature 状态与依赖事实表）
├── member.local.md                # 个人/智能体当前会话锚点（.gitignore 保护，永不提交）
│
├── .harness/
│   ├── agents/                    # 角色协同矩阵（架构师、开发、测试、审核等职责）
│   ├── context/                   # 业务领域分层上下文 (Tier-1 ~ Tier-3 渐进式消费)
│   ├── docs/                      # 架构决策、设计底座与业务规范
│   │
│   ├── features/<feature_id>/     # 【特性沙盒】每个 Feature 拥有独立的 5 个管理文件
│   │   ├── context.md             # 业务背景、需求定义与用户故事
│   │   ├── scope.md               # 物理边界与修改白名单（严格限制只改哪些文件）
│   │   ├── progress.md            # 阶段看板、任务清单（Task 级追踪）与验证证据
│   │   ├── verification.md        # 专属增量测试命令与判定标准
│   │   └── handoff.md             # 跨会话换手交接单（下一会话的起点）
│   │
│   ├── memory/                    # 团队架构决策 (ADR)、踩坑避雷库 (Learnings)
│   └── lifecycle/                 # 会话生命周期脚本 (session-start / session-end)
│
└── scripts/
    ├── verify.sh                  # 全栈极速门禁自检（类型检查 + 静态扫描 + 基础单测）
    └── status.sh                  # 快速查看当前激活的 Feature 与 Git 改动
```

---

## 三、 标准协同工作流（多人与多智能体统一遵循）

无论人类开发者还是 AI 智能体，每个开发会话必须严格执行以下 **5 步闭环标准流程**：

### 1. 启动自检 (`./init.sh`)

- 必须先运行 `./init.sh`；
- 检查本地依赖、环境健全性；
- 严禁“带病开工”，自检不通过直接阻塞。

### 2. 认领特性 (`member.local.md`)

- 查阅 `feature_list.json`，选择前置依赖已满足的待开发特性（`status: pending`）；
- 在根目录 `member.local.md` 中填写当前会话配置：

  ```yaml
  developer: "agent-01"
  active_feature_id: "order_center" # 唯一激活的特性 ID
  role_focus: "fullstack"
  ```

- **核心作用**：锁定当前上下文，防止跨特性串门乱改；该文件被 Git 忽略，多人/多智能体互不冲突。

### 3. 加载限域规格与沙盒 (`.harness/features/<id>/`)

- 智能体只加载对应特性沙盒中的 `context.md`、`scope.md` 和 `progress.md`；
- 严格遵循 `scope.md` 中的**文件修改白名单**，严禁触碰白名单外的其他业务目录和受保护底座。

### 4. 门禁验证 (`./scripts/verify.sh`)

- 编码完成后，必须运行 `verification.md` 中的专属测试，并执行全栈门禁 `./scripts/verify.sh`；
- 确保：类型检查 0 错误、单元测试 100% 通过、静态规范 0 违规。

### 5. 换手交接与归档 (`./scripts/session-end.sh`)

- 将测试通过日志和变更文件回填到 `progress.md` 和 `handoff.md`（及根目录 `session-handoff.md`）；
- 运行生命周期收尾校验命令 `./scripts/session-end.sh`（或 `pnpm session:end`），校验交接状态完备性：
  - 若任务全部闭环且验证充分，方可在 `feature_list.json` 中将状态改为 `completed`，且必须附带 `evidence` 验证凭据；
  - 若会话结束但任务未完，在 `handoff.md` 明确记录下一步动作，供下一任开发者/智能体秒级接力；
  - 会话结束前确保门禁 `./scripts/verify.sh` 和收尾校验 `./scripts/session-end.sh` 双 100% 通过。

---

## 四、 分层上下文机制（防止 Token 爆裂）

智能体阅读代码时，严格按需渐进加载：

| 层级 | 内容范围 | 预算目标 | 消费场景 |
| :--- | :--- | :--- | :--- |
| **Tier 1 (元数据)** | 全局核心红线、规范清单、架构决策概要 | ~1,000 Tokens | 会话启动自检、任务路由分发 |
| **Tier 2 (领域矩阵)** | 对应业务模块的输入/输出契约、依赖关系 | ~3,000 Tokens | 模块间接口对接、契约对齐 |
| **Tier 3 (深度协议)** | 具体的字段规则、状态机流转、算法公式 | ~5,000 Tokens | 针对单一 Feature 的具体编码实现 |

---

## 五、 新项目一键初始化指令（交给新项目 Agent 执行）

在新的空白代码仓库中，只需向 AI 智能体发送以下提示词：

```markdown
请调用 `harness-creator` skill，为当前项目从零初始化一套完整的 Harness 协同工程体系。

请遵循以下核心要求：
1. 架构模式：FDD (Feature-Driven Development) 垂直切片架构；
2. 初始化根目录最高宪法：AGENTS.md、CLAUDE.md、init.sh、feature_list.json、member.local.example.md；
3. 初始化 .harness/ 基础设施：agents/、context/、docs/、lifecycle/、memory/ (含 ADR 模板)、features/ 目录；
4. 建立 ./scripts/verify.sh 门禁脚本，包含类型检查与测试验证；
5. 建立基于 member.local.md 的单特性锁定与沙盒边界保护机制。
```
