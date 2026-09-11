# 上下文预算管理与紧缩协议 (Context Budget & Compaction Protocol)

> 遵循 `harness-creator` 的 `context-engineering-pattern`：**三层披露、动态预算上限、80% 触发反应式紧缩**。

---

## 一、 上下文分层预算配额 (Token Budget Allocation)

| 层级 | 内容范围 | 目标 Token 预算 | 加载时机 | 适用角色 |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1 (元数据)** | 全局核心红线、项目技术栈、运行环境基线 | ~1,000 Tokens | 会话启动自检、环境健全性检查 | 所有角色 |
| **Tier 2 (领域拓扑)** | Monorepo 模块架构、依赖关系拓扑、跨包接口契约 | ~3,000 Tokens | 特性规划、契约设计、跨模块引用 | Coordinator, Researcher |
| **Tier 3 (深度协议)** | 四层权限链执行细则、多租户连接管理协议 | ~5,000 Tokens | 权限与底层基础设施研发 | Implementer |
| **Feature Sandbox** | 单一特性的 `context.md` + `scope.md` + `verification.md` | ~2,000 Tokens | 特性限域编码与针对性测试 | Implementer, Reviewer |

---

## 二、 Token 紧缩硬规则 (Anti-Bloat Invariants)

1. **扩围登记按目录聚合**：`check-boundary.mjs` 自动折叠为 `dir/** # N files @ commit`；禁止在 `scope.md` 逐文件流水账。
2. **测试输出只报异常**：各包 `test` 使用 `scripts/fail-only-reporter.mjs`；全绿仅 `ok N/N`，回执/progress 只记该行或失败摘要，禁止粘贴成功用例明细。
3. **证据一行化**：`feature_list.json` 的 `evidence` 与 progress 验证记录控制在一行摘要（命令 + N/N + commit），详情指针到 `verification.md`。
4. **上下文按需加载**：优先 grep 定位后再精读；禁止整目录 `ls`/通读 README 当背景。

---

## 三、 80% 上下文紧缩触发规则 (Compaction Rule)

- 当单次会话累积使用的 Token 达到模型上下文窗口上限的 **80%** 时，智能体必须主动执行紧缩总结：
  1. 将已完成的推演结论与代码 Diff 沉淀回写至 `progress.md` 与 `handoff.md`。
  2. 释放中间探索过程产生的临时冗长文件读取内容。
  3. 保持会话上下文精炼健康，杜绝长会话幻觉与漂移。
