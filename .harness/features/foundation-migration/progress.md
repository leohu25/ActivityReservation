# 特性推进记录：多租户数据库迁移引擎 (foundation-migration)

## 一、 当前状态

- 状态：✅ 已完成 (completed)
- 依赖前置：`foundation-web-shell`

## 二、 任务完成记录

- [x] 在 Control DB 增加 `TenantMigration` 集中迁移账本模型与生命周期 API
- [x] 在 `packages/db-tenant` 定义租户独立数据库 Schema (`Department`, `PurchaseOrder`)
- [x] 实现 `PgSqlExecutor`、`TenantMigrationRunner` 事务升级引擎与 `TenantProvisioner` 物理库自动开通引擎
- [x] 实现基于 Prisma migrate diff 的 Alembic 式实体变更自动扫描生成器 (`tenant-migrate generate <name>`)
- [x] 实现完整的 CLI 命令行工具 (`up`, `status`, `retry`, `rollback`, `provision`)
- [x] 编写迁移引擎与 CLI 专属测试套件，全仓 62/62 单测通过、9/9 类型检查全绿、Next.js 构建与全栈门禁验证全部通过
