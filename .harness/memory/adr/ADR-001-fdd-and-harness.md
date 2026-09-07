# 架构决策记录 (ADR 0001)：采用 FDD 垂直切片与 Harness 协作工程

## 状态

已采纳 (Accepted)

## 上下文

在多人与多 AI 智能体共同研发的大型 ERP 项目中，传统水平分层架构容易引发跨层冲突、上下文过载和责任模糊。AI 在长会话中容易出现幻觉、记忆漂移与越权改动。

## 决策

1. 采用 FDD (Feature-Driven Development) 垂直切片架构，各业务功能模块自治打包（包含 permissions、domain、application、ui 等）。
2. 引入 Harness 智能体工程规范，通过根目录宪法 (`AGENTS.md`)、门禁检查 (`verify.sh`)、单特性沙盒 (`.harness/features/<id>/`) 与会话锚点 (`member.local.md`) 实现物理隔离与确定性交付。

## 影响与后果

- 特性边界清晰，便于渐进式交付与单特性回滚。
- 每次会话需锁定特性并严格遵循 `scope.md` 白名单。
