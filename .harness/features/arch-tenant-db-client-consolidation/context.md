# 特性上下文：多租户 Prisma 客户端归一与连接池聚合治理 (Tenant DB Client Consolidation)

## 一、特性定位

彻底消除各 Feature 内部私自生成的 Prisma 客户端与底层驱动连接池；利用 `tooling/db-migrate` 聚合机制将所有 Feature 模型统一汇聚至 `packages/db-tenant` 生成单一全量强类型 `TenantPrismaClient`；由 `TenantDbManager` 全局单例连接池统一接管物理数据库连接；彻底删除各 Feature 内部冗余的 `src/db/` 与私有缓存，零历史包袱与零兼容壳。

## 二、架构原则与红线

1. **坚持 FDD 垂直切片**：各业务 Feature（如 `customer-center`, `procurement-center`）继续在各自目录下维护自己的 `prisma/schema.prisma` 模型，严禁将模型搬走；
2. **唯一 Client 生产源**：运行期 `@prisma/client-tenant` 由 `packages/db-tenant` 统一基于聚合 Schema 编译生成，天然包含全量业务表模型；
3. **全局唯一连接池**：全系统针对同一个租户物理库，只允许通过 `TenantDbManager` 维护一个底层连接池，禁止各 Feature 自建连接池；
4. **零历史包袱与零兼容壳**：物理删除 `customer-center/src/db`、`procurement-center/src/db`，不留类型别名或兼容层；
5. **依赖纯净化**：底层 `@prisma/adapter-pg` 与 `prisma` 依赖收敛到数据包，业务 Feature 包彻底移除数据库驱动依赖。
