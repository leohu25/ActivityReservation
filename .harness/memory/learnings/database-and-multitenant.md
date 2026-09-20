# 数据库演进与多租户分库避坑指南 (Database & Multitenant Learnings)

本模块记录在 Database-per-Tenant 物理分库架构、TenantDbManager 连接池生命周期、12-Factor 自愈迁移引擎 `@base/db-migrate` 以及 Baseline 基线演化中的避坑指南。

---

## 1. 数据库连接池与动态路由 (TenantDbManager LRU)

- **痛点**：多租户物理隔离下，每个租户拥有独立的 PostgreSQL 数据库。若每次 HTTP 请求都裸 new `PrismaClient`，会导致连接池迅速耗尽、内存泄露甚至把数据库连接数打满打崩。
- **解法与铁律**：
  - 全局统一通过 `TenantDbManager` 获取租户 Client，严禁拼接裸连接串直连；
  - `TenantDbManager` 内部维护带容量上限的 LRU 缓存池与连接保活探测，空闲连接定期释放；
  - 多租户上下文中严格通过 `getCurrentTenantContext` 提取当前租户标识，严禁跨租户穿透。

---

## 2. 统一数据库演进：新库基线与老库增量升级 (@base/db-migrate)

- **痛点**：多租户物理隔离下，若由 Next.js 服务在 Web 请求中动态调用 Prisma CLI 执行 `prisma db push`，打包后因路径重写极易触发 `ENOENT`，且引发并发死锁；老租户库若无审计账本也无法追溯和受控重试。
- **解法与架构设计**：
  - 建立统一无状态演进引擎包 `@base/db-migrate`：
    1. **新库开通 (Instant Provisioning)**：直接执行预生成并经过哈希校验的最新版本全量 Baseline SQL，0 秒极速初始化并注入基础 Seed，彻底与运行期 Prisma CLI 解耦；
    2. **老库升级 (Incremental Migrations)**：在 Control DB 维护 `TenantMigration` 集中账本；通过 `pnpm db:migrate:generate` 显式生成带风险审查元数据的增量迁移补丁；生产环境通过带 PostgreSQL Advisory Lock（咨询锁）的事务升级引擎受控批量执行。

---

## 3. 数据库基线演化与本地缓存诊断自愈规范

- **痛点**：代码重命名或收敛了数据库基线版本（如从旧版本改为新时间戳），但本地已初始化的开发库中 `platform_migration` 账本仍记录旧版本号；启动时报 `Platform database is non-empty but incomplete; missing tables: baseline ledger`。
- **解法与自动化处置 SOP**：
  1. **基线版本漂移识别**：先比对代码中 `baseline.version` 与本地数据库 `platform_migration` 账本中的 `version`；若 SQL 内容与 SHA256 Checksum 一致，仅版本标识不同，可安全执行 SQL 对齐；
  2. **Turbopack 编译脏缓存清理**：在修改底层 DB 协议或重构依赖后，清理 `.next` 缓存目录（`rm -rf apps/<app>/.next`）；
  3. **智能体操作铁律（必须事先跟用户确认）**：严禁静默修改数据库或静默清理缓存；诊断出该类问题时，必须向用户清晰展示诊断依据、即将执行的 SQL/命令及影响范围，待用户明确确认后方可执行。
