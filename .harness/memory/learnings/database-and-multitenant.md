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

---

## 4. Prisma 逻辑外键与关系更新陷阱 (`relationMode = "prisma"` 与 `XOR` 推导)

- **痛点与现象**：
  在全仓强制 `relationMode = "prisma"` 架构下，底层 PostgreSQL 数据库完全是逻辑外键（无任何物理外键约束），仅包含普通字段 `department_id varchar` 与索引。开发人员习惯性在更新操作时直接传递外键标量：
  ```ts
  await prisma.employeeProfile.update({
    where: { id },
    data: { departmentId: targetDeptId },
  });
  ```
  在运行时却触发 Prisma 参数校验器报错拦截：
  `Unknown argument departmentId. Did you mean department? Available options are: department, position...`
- **深层技术根因**：
  1. 虽然数据库底层无物理约束，但 Prisma Schema 中为了支持应用层联查声明了 `@relation` 辅助字段；
  2. Prisma 编译器为带关系的模型生成了互斥的入参签名：`data: XOR<UpdateInput, UncheckedUpdateInput>`；
  3. 当 `data` 中传入多个字段时，Prisma 查询编译器默认优先以 `UpdateInput`（关系驱动型）作为候选校验白名单，在该白名单中只允许关系名（如 `department`），标量外键 `departmentId` 被判定为未知参数。
- **最佳实践与铁律**：
  - **凡是在 Schema 中声明了 `@relation` 的关联字段，服务层更新时一律采用 Prisma 官方嵌套关系语法**：
    ```ts
    data: {
      nameSnapshot: cleanName,
      department: targetDeptId
        ? { connect: { id: targetDeptId } }
        : { disconnect: true },
      position: targetPosId
        ? { connect: { id: targetPosId } }
        : { disconnect: true },
    }
    ```
  - **落盘透明性**：由于配置了 `relationMode = "prisma"`，数据库最终执行的 SQL 依然仅仅是普通的字段更新 `SET "department_id" = $1`，不会触发物理约束与死锁；
  - **强类型自检**：必须从 `@base/db-tenant` 导入 `TenantPrisma`，入参和返回 100% 严控强类型，严禁降解为 `any`。

