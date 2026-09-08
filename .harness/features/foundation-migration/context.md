# 特性背景：多租户数据库迁移引擎 (foundation-migration)

## 一、 目标

提供 tooling/tenant-migrate 工具，对每个独立租户数据库进行幂等、可追溯、可重试的版本升级，记录 TenantMigration 账本。

## 二、 范围内能力

1. 基于 Prisma Migrate / 物理 SQL Runner 实现针对单租户/多租户物理库的迁移执行。
2. Control DB 维护 TenantMigration 版本账本与升级历史。
3. 提供幂等与失败回滚/重试机制。

## 三、 明确不做

- 业务订单数据结构变更。
