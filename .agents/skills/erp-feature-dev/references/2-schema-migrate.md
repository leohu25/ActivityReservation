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

// 业务数据实体定义
model Customer {
  id             String    @id @default(uuid()) @db.Uuid
  customerCode   String    @unique @map("customer_code") @db.VarChar(50)
  customerName   String    @map("customer_name") @db.VarChar(100)
  defaultTaxRate Decimal?  @map("default_tax_rate") @db.Decimal(5, 2)
  creditLimit    Decimal?  @map("credit_limit") @db.Decimal(12, 2)
  status         String    @default("ACTIVE") @db.VarChar(20)
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  @@map("customers")
}
```

---

## 2. 租户物理库客户端构造 (`src/db/client.ts`)

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

## 3. 生成并执行租户数据库迁移

根目录下运行聚合迁移脚本，框架会自动扫描并比对当前切片的 Schema：

```bash
# 1. 扫描变更并生成时间戳版本化迁移 SQL (生成至 tooling/tenant-migrate/migrations/)
pnpm migrate:tenant:gen

# 2. 对所有租户独立物理库执行升级
pnpm migrate:tenant:up
```
