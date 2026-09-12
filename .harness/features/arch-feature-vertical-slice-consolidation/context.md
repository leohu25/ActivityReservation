# Customer Center Feature-based Vertical Slice 收敛上下文

## 目标

将 Customer Center 业务区域从技术层横向平铺迁移为按业务能力内聚的 Feature-based Vertical Slice，并纠正 FDD、Feature、Sub-Feature、Use Case 与 DDD 的架构术语。

## 架构基线

- 整体：Modular Monorepo。
- 业务模块：Feature-based Vertical Slice Architecture。
- 横向能力：Horizontal Shared / Platform Modules。
- 业务分析与任务拆解：采用 Feature-Driven 思想。
- 复杂 Feature：按需采用 DDD；简单业务不铺设完整 DDD 分层。

## 业务层级

- Customer Center：Business Area / Feature Group。
- Customer Management：Feature。
- Classification：Sub-Feature。
- Create Classification：Vertical Slice / Use Case。
