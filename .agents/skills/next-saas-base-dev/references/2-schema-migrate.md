# 模块 2：数据建模与租户库物理演进

本系统采用 **PostgreSQL Database-per-tenant 物理隔离** 架构。业务切片在各自包内独立维护模型定义，框架统一聚合至 `@base/db-tenant` 并由 `tooling/db-migrate` 负责多租户版本演进与平滑升级。

---

## 1. 切片目录结构规范

```bash
packages/domains/<feature-name>/
└── prisma/
    └── schema.prisma          # 切片专属数据模型 (仅维护实体定义，严禁在切片内手写 DB Client)
```

> ⚠️ **重要架构规约 (ADR-004)**：
> 切片包内**严禁**自建私有 DB Client 或直连连接池。所有数据库访问统一消费平台共享包 `@base/db-tenant` 导出的单例 `TenantPrismaClient`，由 `getTenant*Context()` 动态路由。

---

## 2. 切片 Prisma Schema 定义 (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/@prisma/client-<feature-name>"
}

// 业务数据实体定义 (必须强制包含 ADR-009 实体审计与软删除基线字段)
model ResourceItem {
  /// 业务编码 (主键)
  code        String    @id @map("code") @db.VarChar(30)
  /// 业务名称
  name        String    @map("name") @db.VarChar(100)
  /// 关键比率
  rate        Decimal?  @map("rate") @db.Decimal(5, 2)
  /// 受控金额
  amount      Decimal?  @map("amount") @db.Decimal(12, 2)
  /// 业务状态: ACTIVE(正常) / DISABLED(停用)
  status      String    @default("ACTIVE") @db.VarChar(10)

  // ===== 框架强制基础审计与数据范围基线字段 (ADR-009) =====
  /// 创建人用户ID (数据范围 SELF 核心依据，UUIDv7；系统写入为 SYSTEM_ACTOR_ID)
  createdById String    @map("created_by_id") @db.Uuid
  /// 归属部门ID (数据范围 DEPT / DEPT_TREE 核心依据，UUIDv7 创建时快照)
  deptId      String?   @map("dept_id") @db.Uuid
  /// 最后更新人用户ID (UUIDv7)
  updatedById String?   @map("updated_by_id") @db.Uuid
  /// 软删除标记 (默认 false)
  isDeleted   Boolean   @default(false) @map("is_deleted")
  /// 软删除时间
  deletedAt   DateTime? @map("deleted_at")
  /// 软删除操作人用户ID (UUIDv7)
  deletedById String?   @map("deleted_by_id") @db.Uuid
  /// 创建时间
  createdAt   DateTime  @default(now()) @map("created_at")
  /// 更新时间
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@map("resource_item")
}
```

---

## 3. 业务实体基础审计与软删除强制基线 (ADR-009)

> ⚠️ **红线门禁提示**：
> 凡是业务实体（主数据、单据等），必须强制包含以下 8 个字段，门禁脚本 `scripts/check/check-entity-baseline.mjs` 在 `pnpm verify` 与 `git commit` 时进行机械化拦截：
>
> 1. `createdById: String @db.Uuid`: 创建人用户 ID（UUIDv7，数据范围 `SELF` 过滤下推物理列）
> 2. `deptId: String? @db.Uuid`: 归属部门 ID（UUIDv7，数据范围 `DEPT` / `DEPT_TREE` 过滤下推物理列）
> 3. `updatedById: String? @db.Uuid`: 最后修改人用户 ID
> 4. `isDeleted: Boolean`: 软删除标记，默认 `false`
> 5. `deletedAt: DateTime?`: 软删除执行时间
> 6. `deletedById: String? @db.Uuid`: 软删除操作人用户 ID
> 7. `createdAt: DateTime`: 创建时间戳
> 8. `updatedAt: DateTime`: 最后更新时间戳
>
> **仅以下四类允许豁免**：
>
> - 单据明细从表（如 `OrderDetailItem`，随主表级联生命周期）；
> - 纯多对多关联中间表（如 `ItemTagAssignment`）；
> - 全租户共享配置字典表（如 `GlobalTag`，靠自身 `status` 启停用）；
> - 组织人事基座事实源表（`Department`、`EmployeeProfile` 等）。

---

## 4. 数据库演进与多租户迁移运维 (`tooling/db-migrate`)

模型修改后，严禁手动修改生产 SQL。统一在**仓库根目录**使用标准化命令：

```bash
# 1. 业务切片 Schema 修改后，生成增量版本迁移补丁
pnpm run db:migrate:generate --scope tenant --name add_xxx_fields

# 2. 检查生成的迁移工件与运行时总账一致性 (门禁自检)
pnpm run db:migrate:check

# 3. (开发重构/上线前专用) 将所有增量演进完整压平进全新 Day 0 基线快照
pnpm run db:migrate:baseline:reset:tenant
pnpm run db:migrate:baseline:reset:platform
```

### 迁移历史不可变规则（Append-Only）

一旦迁移或基线工件已经提交到 Git，普通开发提交中严禁修改、删除、重命名或搬移：

- `tooling/db-migrate/migrations/**`
- `tooling/db-migrate/baselines/**`

数据库结构需要修复时必须新增迁移，禁止重写历史。`scripts/check/check-migration-immutability.mjs` 会检查 Git 暂存区，并由 `scripts/verify.mjs` 和 pre-commit 钩子在提交前硬拦截。新增迁移目录允许提交，物理工件清单必须保持完整并带有有效 SHA-256 校验和。

`baseline:reset` 属于需要同步重建对应数据库的受控操作，不是普通提交的豁免开关；执行前必须单独确认影响范围并建立专用重置流程。

---

## 5. 存量数据库平滑演进与老表加字段铁律 (Expand and Contract)

在企业级多租户 SaaS 系统中，各租户物理数据库已常驻大量业务数据。为彻底杜绝租户库升级时因 `contains null values` 抛错导致服务瘫痪，全仓必须严格遵循以下两套场景分流准则：

### 准则一：新建表 vs 老表追加字段清晰界限

| 场景 | 数据库物理约束 (`schema.prisma`) | 应用层校验 (`schema.ts` / Zod) | 解释与依据 |
| :--- | :--- | :--- | :--- |
| **新建一张全新表** | 核心业务字段正常 `NOT NULL` (如 `id`, `name`, `status`) | 正常必填校验 | 新表无存量历史包袱，数据库物理非空约束是防止脏数据的必要底线。 |
| **在已有存量数据的旧表上追加新字段** | **必须声明为可空（带 `?`）** (如 `tagTypeId String?`) | **应用层强校验必填** (如 `z.string().min(1)`) | 存量旧行无历史初值；数据库可空确保秒级平滑升级；应用层卡死入口确保新写入数据 100% 完整。 |

> ⚠️ **禁止手动篡改 SQL 铁律**：
> 全仓所有的 `migration.sql`、`down.sql` 与 `manifest.json` 必须 100% 由命令 `pnpm db:migrate:generate` 原生生成，严禁手工篡改 SQL 文件。若遇到存量数据不兼容，一律通过修正 Prisma Schema 的可空性重新生成，保证迁移引擎 checksum 事实源绝对一致。

### 准则二：业务数据字典外键关联规范

当业务实体需要关联通用基础档案数据字典（如业务标签类型、行业分类、结算方式）时：
1. **字段命名与类型**：统一存储数据字典主键 ID，以 `*Id` 结尾并采用可空（如 `tagTypeId String? @map("tag_type_id") @db.VarChar(60)`）；
2. **场景标识解耦**：业务切片严禁硬编码分类字符串，统一从 `@domain/base-archives/dict` 导出的 `DICT_TYPES` SSoT 常量中注入；
3. **数据读取与回显**：由装配层调用 `getDictOptionsByTypeQuery(identifier)` 拉取字典项，前端下拉选项以 `value: dict.id` 进行选择，表格回显兼容历史空值显示为 `"—"`。

### 准则三：自动化门禁硬拦截 (`scripts/check/check-migration-safety.mjs`)

仓库已部署自动门禁，在 `pnpm verify` 与 `git commit` 时机械化扫描待提交迁移：
- 若检测到 `ALTER TABLE ... ADD COLUMN ... NOT NULL` 且未提供 `DEFAULT` 默认值，门禁立即硬性拦截阻断提交，防止向已有表盲目追加非空字段破坏存量租户库。

