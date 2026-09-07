# 多智能体协同矩阵与总索引 (Multi-Agent Roster & Coordination)

> 遵循 `harness-creator` 官方 **Coordinator 编排模式**：**主协调者负责消化需求与合成结果，绝不透传未消化的模糊需求 (Synthesize, Not Delegate Understanding)**。

---

## 一、 核心智能体花名册 (Agent Roster)

每个智能体角色均有独立的专职契约，派发任务时以零上下文继承 (Zero Context Inheritance) 注入：

| 角色标识 (Role ID) | 专职契约文件 | 工具白名单 (Tool Sandbox) | 核心职责 |
| :--- | :--- | :--- | :--- |
| **`coordinator`** | [coordinator.md](./coordinator.md) | Read, Search, Todo, Subagent, Ask User (**严禁直接修改业务代码**) | 全局需求消化、主动问询对齐、Task Spec 精准拆解、多角色编排与最终验收 |
| **`researcher`** | [researcher.md](./researcher.md) | Read, Search, Glob (**只读工具，严禁修改业务代码**) | 架构探索、技术选型调研、依赖拓扑分析与 ADR 记录编写 |
| **`implementer`** | [implementer.md](./implementer.md) | Read, Search, Edit, Write, Test (严格限域当前 Feature 沙盒) | 依据精准 Task Spec 在沙盒白名单内编写垂直切片业务代码与单元测试 |
| **`reviewer`** | [reviewer.md](./reviewer.md) | Read, Search, Test, Lint (**只读工具，严禁修改业务代码**) | 代码交叉审计、门禁审计 (`verify.sh`)、测试覆盖复核与技术债识别 |

---

## 二、 标准四阶段流转流水线 (Phased Workflow)

```text
阶段 1: Research (架构调研)
   └── researcher: 只读调研，输出结构化发现与 ADR 提案 (零业务代码实现)
          ↓
阶段 2: Plan & Spec (消化与规格化)
   └── coordinator: 消化调研结果，制定精准自包含 Task Spec 与白名单边界
          ↓
阶段 3: Implement (限域实现)
   └── implementer: 严格在沙盒 scope.md 白名单内编码，完成专属单元测试
          ↓
阶段 4: Review (审计与门禁)
   └── reviewer: 运行全栈极速门禁，审计架构边界与红线规则，输出审计报告
```

---

## 三、 智能体协作三大铁律

1. **单级派生隔离 (Single-Level Fork Guard)**：子智能体严禁继续派生子智能体，防范调用树失控。
2. **纯净启动基线 (Clean Context Invariant)**：子智能体启动只注入目标 Feature 沙盒与角色契约，不继承冗长父级历史。
3. **技术债收敛铁律 (Tech Debt Invariant)**：发现非当前 Feature 范围的缺陷或漂移，**严禁擅自修改**，统一登记至 `.harness/memory/technical-debt.md`。
