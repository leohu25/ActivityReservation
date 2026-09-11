# `@chenrun/db-migrate` — 统一数据库演进与基线引擎

本项目数据库演进与多租户基线管理的统一底层工具包。管辖：

1. **平台控制库 (`platform` / `saas_control`)** 的基线与版本升级；
2. **多租户物理独立库 (`tenant` / `tenant_xxx`)** 的全量快照与舰队增量迁移。

---

## 一、 为什么重构（设计理念与背景）

在之前的方案中，系统在生产运行时试图通过 `node_modules/.bin/prisma` 或 `require.resolve("prisma/package.json")` 动态扫描并调用 Prisma CLI，存在三个致命缺陷：

1. **构建与运行脱节**：打包到 Next.js / Turbopack 后，文件路径被转译为模块标识符，引发运行期 `ENOENT` 异常；
2. **生产环境脆弱性**：生产镜像或 Serverless 环境无需且不应携带完整的 Prisma CLI 开发工具链；
3. **租户开通半成品**：建库与建表非原子，一旦 DDL 抛错便残留没有任何业务表的空数据库。

**重构后的核心原则**：

- **开发期显式生成**：开发者在修改 Prisma Schema 后运行命令生成迁移文件，提交至 Git 审查；
- **构建期只读校验**：`pnpm dev`、`pnpm build` 与 `pnpm check` 仅作一致性断言，**绝不自动修改工作区代码**；
- **新库走全量基线**：新租户开通直接执行预编译、带校验和的最新 Baseline SQL，0 秒冷启动；
- **老库走增量升级**：控制平台后台看板手动触发，支持单租户或舰队批量升级；
- **运行期零依赖**：预先编译只读 `runtime-catalog.ts` 打入应用 Bundle，生产环境脱离 Prisma CLI。

---

## 二、 目录结构与功能定位

```text
tooling/db-migrate/
├── package.json              # 工具包元数据与依赖定义 (@chenrun/db-migrate)
├── tsconfig.json             # TypeScript 构建配置 (继承 monorepo 根配置)
├── prisma.config.ts          # 仅用于开发阶段调用 Prisma CLI 的数据源配置文件
├── README.md                 # 架构设计、目录定位与日常操作指南 (本文件)
│
├── baselines/                # 【开发期对照源】各作用域的完整基线快照（文件工件，给 CLI Diff 用）
│   ├── platform/             # 平台库基线
│   │   └── <version>/
│   │       ├── baseline.sql  # 平台库全量建表 DDL
│   │       ├── manifest.json # 基线元数据与校验和
│   │       └── schema.prisma # 对应的 canonical 聚合 Schema
│   └── tenant/               # 租户库基线
│       └── <version>/
│           ├── baseline.sql  # 包含部门、员工档案、岗位、采购、客户等的全量 DDL
│           ├── manifest.json # 基线元数据与 SHA-256 校验和
│           └── schema.prisma # 聚合各业务 Feature 后的唯一事实源 Schema
│
├── migrations/               # 增量版本迁移目录（老库演进专用）
│   ├── platform/             # 平台库各历史版本的增量升级补丁
│   └── tenant/               # 租户库各历史版本的增量升级补丁
│       └── <YYYYMMDDHHmmss>_<name>/
│           ├── migration.sql # 升级 SQL (up)
│           ├── down.sql      # 回滚 SQL (down，若支持)
│           ├── manifest.json # 包含风险标记与审批元数据的清单
│           └── schema.snapshot.prisma # 本次变更对应的快照
│
├── generated/                # 【线上运行时代码】编译产物目录 (纳入版本控制)
│   └── runtime-catalog.ts    # 预编译为 TypeScript 常量的总账 (包含最新 Baseline + 历次增量 SQL)
│
└── src/                      # 源码实现
    ├── cli.ts                # 命令行调度入口 (pnpm db:migrate:*)
    ├── index.ts              # 模块对外统一导出入口
    ├── check.ts              # 校验 Canonical Schema 与快照/Catalog 的一致性
    │
    ├── core/                 # 核心模型与领域工具
    │   ├── types.ts          # 作用域、清单、风险代码等核心契约
    │   ├── paths.ts          # 工作区目录解析与定位
    │   ├── risk.ts           # 危险 SQL 静态扫描 (DROP TABLE, DROP COLUMN 等) 与批准断言
    │   └── artifacts.ts      # 文件目录清单安全加载器 (带 SHA-256 防篡改比对)
    │
    ├── schema/               # 租户 Schema 动态扫描与聚合
    │   ├── aggregate.ts      # 扫描 db-tenant 与 features/*/prisma，支持 @db-migrate-extension
    │   └── aggregate.test.ts # 聚合器单元测试
    │
    ├── generation/           # 迁移与基线生成引擎 (开发期运行)
    │   ├── prisma.ts         # 调用本地依赖的 Prisma CLI 执行 diff 与 validate
    │   └── generate.ts       # 增量迁移脚手架生成、全量基线生成与 Runtime Catalog 序列化
    │
    └── runtime/              # 生产运行期服务 (纯 SQL 执行，无 Prisma CLI 依赖)
        ├── catalog.ts        # 获取只读 Catalog
        ├── platform-runner.ts# 带 advisory lock 锁保护的平台升级执行器
        ├── tenant-runner.ts  # 带 advisory lock 锁保护的多租户执行升级引擎
        ├── provisioner.ts    # 租户物理库自动化原子开通、基线建表与 Seed 初始化器
        └── service.ts        # 提供给应用层的总控 Facade (DatabaseMigrationService)
```

### 💡 核心认知：`baselines/` 与 `runtime-catalog.ts` 的区别与联系

很多开发者初次接触时会有疑问：**它们是否是同一个东西？**

**结论：它们本质上是同一批迁移数据的“两种不同生命周期形态”。**

| 维度 | `baselines/` (工件目录) | `generated/runtime-catalog.ts` (代码文件) |
| :--- | :--- | :--- |
| **存在形态** | 目录结构，包含磁盘文件 (`.sql`、`schema.prisma`、`manifest.json`) | 单个只读 TypeScript 代码文件，导出常量对象 |
| **适用阶段** | **开发态 (Dev-time / Build-time)** | **运行态 (Runtime / Production)** |
| **主要用途** | 供 CLI 工具（如 `prisma migrate diff`）读取，用于对比当前代码与基线的差异、生成增量迁移。 | 供生产环境（Node.js / Next.js 服务端）直接 `import` 调用，作为建表与升级的执行总账。 |
| **包含内容** | 仅包含对应作用域的**初始全量大底子快照**。 | **全量汇总**：包含 Baseline 完整 SQL **+** 后续所有增量 Migrations 的 SQL。 |
| **为什么转 TS** | 磁盘文件容易在 Docker/Serverless 打包中丢失路径；开发工具解析语法需要文件。 | 编译为 TS 常量可直接打入 Bundle，**零文件 I/O、无路径脆弱性、免装 Prisma CLI**。 |

**两者的联动链路**：

```text
开发者修改 Prisma Schema
       │
       ▼ (CLI 开发态对比差异)
   [baselines/] (静态文件快照对照物)
       │
       ▼ (产出增量目录)
   [migrations/] (每次版本变更的 migration.sql)
       │
       ▼ (自动聚合编译入库: pnpm db:migrate catalog)
[generated/runtime-catalog.ts] ──> 供 Next.js / Better Auth / 租户开通服务直接内存引用
```

---

## 三、 运行机制与核心逻辑

### 1. 多 Feature Schema 聚合机制 (`@db-migrate-extension`)

工业制造 ERP 采用 FDD 垂直切片架构，各业务中心各自维护其 `prisma/schema.prisma`（如 `procurement-center`、`customer-center`）。

- **模型所属权 (Owner)**：每个实体表只能有一个 Owner（如 `Department` 归属 `db-tenant`）；
- **显式切片扩展 (Extension)**：当采购单需要反向关联部门（`orders PurchaseOrder[]`）时，在切片 Schema 中使用专用注解：

  ```prisma
  // @db-migrate-extension Department
  model Department {
    id     String          @id
    orders PurchaseOrder[]
    @@map("department")
  }
  ```

- 聚合器（`src/schema/aggregate.ts`）在合并时会自动识别并将跨切片字段安全编入主模型，绝不会产生重复模型定义。

### 2. 新租户开通逻辑 (`TenantDatabaseProvisioner`)

```text
触发开通 (POST /api/...)
       │
       ▼
1. 检查/创建物理数据库 (CREATE DATABASE "tenant_xxx")
       │
       ▼
2. Control DB 登记为 PROVISIONING
       │
       ▼
3. 获取 PostgreSQL Advisory Lock 互斥锁
       │
       ▼
4. 断言目标库为空库 (防止半成品污染)
       │
       ▼
5. 单事务执行 runtime-catalog.ts 中的最新 Baseline SQL
       │
       ▼
6. 执行基线种子数据 (TenantDatabaseSeeder: ROOT部门、岗位、Owner档案)
       │
       ▼
7. 校验关键表存在 (department, employee_profile, purchase_order 等)
       │
       ▼
8. Control DB 登记 Baseline 账本，状态翻转为 ACTIVE
```

### 3. 老租户增量升级机制 (`TenantMigrationRunner`)

- 平台管理员进入 `/migrations` 迁移中枢；
- 系统对比租户物理库当前 `schema_version` 与 `runtime-catalog.ts` 中的最新版本；
- 预检通过后，针对选定租户单独加 Advisory Lock 并在事务中按序执行增量 SQL，记录详细耗时与状态。

---

## 四、 常见开发与运维工作流

### 场景 A：新增或修改了实体字段 (开发业务特性)

1. 在对应的 `packages/features/<feature>/prisma/schema.prisma` 修改模型；
2. 运行生成命令：

   ```bash
   pnpm db:migrate:generate --scope tenant --name add_xxx_field
   ```

3. 检查生成的 `tooling/db-migrate/migrations/tenant/...` 目录下的 SQL 文件；
4. 运行一致性检查与单测：

   ```bash
   pnpm db:migrate:check
   pnpm test
   ```

5. 随业务代码一同提交 Git。

### 场景 B：涉及破坏性变更 (如删除已有字段或表)

默认情况下，工具会直接拒绝包含 `DROP TABLE`、`DROP COLUMN` 等高危语句的迁移。如业务确实需要：

```bash
pnpm db:migrate:generate --scope tenant --name drop_legacy_column \
  --allow-destructive \
  --reason "业务需求重构，该字段已废弃" \
  --data-plan "已提前归档至备份表，生产无依赖" \
  --rollback-plan "需从归档表导出恢复数据"
```

### 场景 C：重置全新基线 (仅限开发环境无历史包袱重构)

```bash
pnpm db:migrate:baseline --scope platform --reset
pnpm db:migrate:baseline --scope tenant --reset
```

### 场景 D：平台首次部署 / 空库自愈

开发和生产使用相同的运行时命令，不依赖 Prisma CLI：

```bash
CONTROL_BOOTSTRAP_ADMIN_EMAIL=admin@example.com \
CONTROL_BOOTSTRAP_ADMIN_NAME="平台超级管理员" \
CONTROL_BOOTSTRAP_ADMIN_PASSWORD='从 Secret 注入的一次性强密码' \
pnpm db:platform:ensure
```

运行时只对 `public` 下完全没有用户表的严格空库应用最新 Platform Baseline，随后登记 `platform_migration` 基线记录并幂等创建 Better Auth credential 超管。完整库直接放行；非空但缺表或 checksum 冲突的库会阻断，不会自动补表。已有库的增量迁移也不会由此命令自动执行。

`apps/control/src/instrumentation.ts` 与 `apps/tenant/src/instrumentation.ts` 在 Node.js 服务进程启动时执行同一 ensure；认证请求路径另有进程内 Promise 去重兜底。
