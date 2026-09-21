# 团队记忆与架构决策总索引 (Memory Index)

> 遵循 `harness-creator` 的 Persistent Memory 模式：两步保存、本地胜出、索引常驻。

## 一、 架构决策记录 (ADRs)

- [ADR-001: Modular Monorepo、Feature-based Vertical Slice 与 Harness 协作工程](adr/ADR-001-fdd-and-harness.md)
- [ADR-002: PostgreSQL Database-per-Tenant 租户物理隔离](adr/ADR-002-database-per-tenant.md)
- [ADR-003: 成熟框架版四层权限架构 (Better Auth + CASL)](adr/ADR-003-four-tier-permissions.md)
- [ADR-004: Turborepo 多应用解耦与 Feature-based Vertical Slice 规范](adr/ADR-004-fdd-vertical-slices-and-multi-app.md)
- [ADR-007: Better Auth 与 CASL 职责边界（认证与业务授权分离）](adr/ADR-007-authn-vs-authz-boundary.md)
- [ADR-008: 业务能力垂直内聚、选择性 DDD 与三级共享体系](adr/ADR-008-fdd-slices-with-ddd-aggregates-and-biz-shared.md)
- [ADR-009: 业务实体基础审计字段基线规范与行级数据范围约束](adr/ADR-009-base-entity-audit-and-data-scope-baseline.md)
- [ADR-010: 多租户独立凭证模型与企业三要素认证架构](adr/ADR-010-tenant-scoped-credentials-and-enterprise-auth.md)

## 二、 踩坑经验与避雷库 (Learnings)

- [避坑指南与工程实践](learnings.md)

## 三、 技术债与架构漂移台账 (Technical Debt)

- [技术债收敛登记表](technical-debt.md)
