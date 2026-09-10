# 特性交接记录 (Handoff)

## 交付概要

完成多租户数据库客户端归一化重构：

1. **Schema 聚合机制**：引入 `scripts/sync-tenant-schema.mjs`，保留各 Feature 目录下的 `prisma/schema.prisma` 独立维护，构建期自动聚合输出到 `packages/db-tenant/prisma/schema.generated.prisma`。
2. **唯一 Client 生产源**：`packages/db-tenant` 统一生成包含全量业务表的 `@prisma/client-tenant`（`TenantPrismaClient`）。
3. **彻底物理清理**：彻底删除 `customer-center/src/db` 与 `procurement-center/src/db`，各业务包 `package.json` 彻底移除了数据库驱动依赖。
4. **统一连接池与会话注入**：所有 Feature 会话（`session.ts`）与业务 Service 直接接收 `TenantPrismaClient`，由 `TenantDbManager`（使用 `globalThis` 缓存）针对每个租户库维护全局唯一的连接池实例。
5. **门禁验证**：13/13 包类型检查通过，全仓 139+ 单测全绿，Next.js 生产构建通过，`./scripts/verify.sh` 全绿。
