# 架构决策记录 (ADR 0001)：Modular Monorepo、Feature-based Vertical Slice 与 Harness 协作工程

## 状态

已采纳 (Accepted，2026-09-12 术语修订)

## 上下文

在多人与多 AI 智能体共同研发的大型 ERP 项目中，按技术类型横向平铺业务代码容易引发跨层冲突、上下文过载和责任模糊。AI 在长会话中也容易出现幻觉、记忆漂移与越权改动。

早期文档把 Feature-Driven Development（FDD）描述成“垂直切片架构”。该表述混淆了开发方法和代码架构，因此在不改变原决策意图的前提下修正术语。

## 决策

1. 系统采用 Modular Monorepo：`apps/*` 是可部署应用与 Composition Root，`packages/*` 是具有显式公共 API 的模块。
2. 业务代码采用 Feature-based Vertical Slice Architecture，围绕业务能力内聚 Contract、Query、mutation Action、Service、UI 和测试。
3. 认证、授权、数据库、UI、Shared 等作为 Horizontal Shared / Platform Modules 横向支撑业务模块。
4. 业务分析与任务拆解采用 Feature-Driven Development（FDD）思想，通过 Feature List 按功能规划、实施和验收；FDD 不作为架构名称。
5. 复杂 Feature 可在内部按需使用 DDD；简单 CRUD 不强制套用完整 DDD 分层。
6. 引入 Harness 智能体工程规范，通过根目录宪法、门禁、特性沙盒与会话锚点实现确定性交付。

## 业务层级术语

```text
Customer Center        → Business Area / Feature Group
Customer Management    → Feature
Classification         → Sub-Feature
Create Classification  → Vertical Slice / Use Case
```

页面、文件夹、Feature、Aggregate、Subdomain 和 Bounded Context 不自动等价。

## 影响与后果

- 业务变更集中在对应垂直切片，降低霰弹式修改与合并冲突。
- 横向平台能力保持无具体业务流程耦合。
- 每次会话仍需锁定 Harness 任务并严格遵循 `scope.md`。
