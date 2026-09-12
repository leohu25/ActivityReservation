# 模块 2：数据建模与租户库物理迁移

辰润 ERP 采用 **PostgreSQL Database-per-tenant 物理隔离** 架构。每个业务切片独立维护自身的 Prisma 模型定义。

---

## 目录结构规范

```bash
packages/features/<feature-name>/
├── prisma/
│   └── schema.prisma          # 切片专属数据模型
└── src/
    └── db/
        └── client.ts          # 专属 PrismaClient 实例构造与池化复用
```

---

## 1. 切片 Prisma Schema 定义 (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("TENANT_DATABASE_URL")
}

generator client {
  provider = "prisma-client"
  output   = "../node_modules/@prisma/client-<feature-name>"
}

// 业务数据实体定义 (必须强制包含 ADR-009 实体审计与软删除基线字段)
model Customer {
  id             String    @id @default(uuid()) @db.Uuid
  customerCode   String    @unique @map("customer_code") @db.VarChar(50)
  customerName   String    @map("customer_name") @db.VarChar(100)
  defaultTaxRate Decimal?  @map("default_tax_rate") @db.Decimal(5, 2)
  creditLimit    Decimal?  @map("credit_limit") @db.Decimal(12, 2)
  status         String    @default("ACTIVE") @db.VarChar(20)

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

  @@map("customers")
}
```

---

## 2. 业务实体基础审计字段与软删除强制规范 (ADR-009)

> ⚠️ **红线门禁提示**：
> 凡是业务实体（主数据、单据等），必须强制包含以下 8 个字段，门禁脚本 `scripts/check-entity-baseline.mjs` 在 `verify.sh` 与 `git commit` 时进行机械化拦截：
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
> - 单据明细从表（如 `CustomerQuoteItem`，随主表级联生命周期）；
> - 纯多对多关联中间表（如 `CustomerTagAssignment`）；
> - 全租户共享配置字典表（如 `CustomerTag`，靠自身 `status` 启停用）；
> - 组织人事基座事实源表（`Department`、`EmployeeProfile` 等）。

---

## 3. 租户物理库客户端构造 (`src/db/client.ts`)

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient as CustomerPrismaClient,
  Prisma as CustomerPrisma,
} from "@prisma/client-customer";

export { CustomerPrismaClient, CustomerPrisma };

const customerClientCache = new Map<string, CustomerPrismaClient>();

/**
 * 获取对应租户物理库的切片专属 Prisma Client
 * 连接复用，通过 PrismaPg Adapter 连接，严格避免重复构建实例
 */
export function getCustomerPrismaClient(databaseUrl: string): CustomerPrismaClient {
  if (!databaseUrl || databaseUrl.trim().length === 0) {
    throw new Error("TENANT_DATABASE_URL is required for CustomerPrismaClient");
  }

  const cached = customerClientCache.get(databaseUrl);
  if (cached) {
    return cached;
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const client = new CustomerPrismaClient({ adapter });

  customerClientCache.set(databaseUrl, client);
  return client;
}
```

---

## 4. 生成并执行租户数据库迁移

根目录下运行聚合迁移脚本，框架会自动扫描并比对当前切片的 Schema：

```bash
# 1. 扫描变更并生成时间戳版本化迁移 SQL (生成至 tooling/tenant-migrate/migrations/)
pnpm migrate:tenant:gen

# 2. 对所有租户独立物理库执行升级
pnpm migrate:tenant:up
```
