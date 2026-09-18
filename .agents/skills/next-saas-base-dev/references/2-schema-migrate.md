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
model Customer {
  /// 客户编码 (主键)
  customerCode   String    @id @map("customer_code") @db.VarChar(30)
  /// 客户名称
  customerName   String    @map("customer_name") @db.VarChar(100)
  /// 默认税率(%)
  defaultTaxRate Decimal?  @map("default_tax_rate") @db.Decimal(5, 2)
  /// 授信额度(元)
  creditLimit    Decimal?  @map("credit_limit") @db.Decimal(12, 2)
  /// 客户状态: ACTIVE(正常) / DISABLED(停用)
  status         String    @default("ACTIVE") @db.VarChar(10)

  // ===== 框架强制基础审计与数据范围基线字段 (ADR-009) =====
  /// 创建人用户ID (数据范围 SELF 核心依据)
  createdById    String    @map("created_by_id") @db.VarChar(50)
  /// 归属部门ID (数据范围 DEPT / DEPT_TREE 核心依据)
  deptId         String?   @map("dept_id") @db.VarChar(50)
  /// 最后更新人用户ID
  updatedById    String?   @map("updated_by_id") @db.VarChar(50)
  /// 软删除标记 (默认 false)
  isDeleted      Boolean   @default(false) @map("is_deleted")
  /// 软删除时间
  deletedAt      DateTime? @map("deleted_at")
  /// 软删除操作人用户ID
  deletedById    String?   @map("deleted_by_id") @db.VarChar(50)
  /// 创建时间
  createdAt      DateTime  @default(now()) @map("created_at")
  /// 更新时间
  updatedAt      DateTime  @updatedAt @map("updated_at")

  @@map("customer")
}
```

---

## 3. 业务实体基础审计与软删除强制基线 (ADR-009)

> ⚠️ **红线门禁提示**：
> 凡是业务实体（主数据、单据等），必须强制包含以下 8 个字段，门禁脚本 `scripts/check/check-entity-baseline.mjs` 在 `pnpm verify` 与 `git commit` 时进行机械化拦截：
>
> 1. `createdById: String`: 创建人用户 ID（数据范围 `SELF` 过滤下推物理列）
> 2. `deptId: String?`: 归属部门 ID（数据范围 `DEPT` / `DEPT_TREE` 过滤下推物理列）
> 3. `updatedById: String?`: 最后修改人用户 ID
> 4. `isDeleted: Boolean`: 软删除标记，默认 `false`
> 5. `deletedAt: DateTime?`: 软删除执行时间
> 6. `deletedById: String?`: 软删除操作人用户 ID
> 7. `createdAt: DateTime`: 创建时间戳
> 8. `updatedAt: DateTime`: 最后更新时间戳
>
> **仅以下四类允许豁免**：
>
> - 单据明细从表（如 `CustomerQuoteItem`，随主表级联生命周期）；
> - 纯多对多关联中间表（如 `CustomerTagAssignment`）；
> - 全租户共享配置字典表（如 `CustomerTag`，靠自身 `status` 启停用）；
> - 组织人事基座事实源表（`Department`、`EmployeeProfile` 等）。

---

## 4. 数据库演进与多租户迁移运维 (`tooling/db-migrate`)

模型修改后，严禁手动修改生产 SQL。统一在**仓库根目录**使用标准化命令：

```bash
# 1. 业务切片 Schema 修改后，生成增量版本迁移补丁
pnpm run db:migrate:generate --scope tenant --name add_xxx_fields

# 2. 检查生成的迁移工件与运行时总账一致性 (门禁自检)
pnpm run db:migrate:check

# 3. 重新编译生成运行期内存 Catalog (供 Next.js 服务端零 IO 引用)
pnpm run db:migrate:catalog

# 4. (开发重构/上线前专用) 将所有增量演进完整压平进全新 Day 0 基线快照
pnpm run db:migrate:baseline:reset:tenant
pnpm run db:migrate:baseline:reset:platform
```

### 迁移历史不可变规则（Append-Only）

一旦迁移或基线工件已经提交到 Git，普通开发提交中严禁修改、删除、重命名或搬移：

- `tooling/db-migrate/migrations/**`
- `tooling/db-migrate/baselines/**`

数据库结构需要修复时必须新增迁移，禁止重写历史。`scripts/check/check-migration-immutability.mjs` 会检查 Git 暂存区，并由 `scripts/verify.mjs` 和 pre-commit 钩子在提交前硬拦截。新增迁移目录允许提交，`generated/runtime-catalog.ts` 可随新增迁移正常更新。

`baseline:reset` 属于需要同步重建对应数据库的受控操作，不是普通提交的豁免开关；执行前必须单独确认影响范围并建立专用重置流程。
