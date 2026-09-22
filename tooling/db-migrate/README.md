# `@base/db-migrate` — 统一数据库演进与基线引擎

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
- **新库走全量基线**：新租户开通直接执行物理带校验和的最新 Baseline SQL，0 秒冷启动；
- **老库走增量升级**：控制平台后台看板手动触发，支持单租户或舰队批量升级；
- **运行期零依赖**：物理 SQL 文件与 Manifest 清单作为唯一事实源，运行期动态加载执行，生产环境彻底脱离 Prisma CLI。

---

## 二、 目录结构与功能定位

```text
tooling/db-migrate/
├── package.json              # 工具包元数据与依赖定义 (@base/db-migrate)
├── tsconfig.json             # TypeScript 构建配置 (继承 monorepo 根配置)
├── prisma.config.ts          # 仅用于开发阶段调用 Prisma CLI 的数据源配置文件
├── README.md                 # 架构设计、目录定位与日常操作指南 (本文件)
│
├── baselines/                # 各作用域的完整基线快照（物理 SQL 与元数据）
│   ├── platform/             # 平台库基线
│   │   └── <version>/
│   │       ├── baseline.sql  # 平台库全量建表原生 DDL
│   │       ├── manifest.json # 基线元数据、SHA-256 校验和与 Schema 哈希
│   │       └── schema.prisma # 对应的 canonical 聚合 Schema
│   └── tenant/               # 租户库基线
│       └── <version>/
│           ├── baseline.sql  # 包含部门、员工档案、岗位、采购、客户等的全量原生 DDL
│           ├── manifest.json # 基线元数据与 SHA-256 校验和
│           └── schema.prisma # 聚合各业务 Feature 后的唯一事实源 Schema
│
├── migrations/               # 增量版本迁移目录（老库演进专用物理 SQL）
│   ├── platform/             # 平台库各历史版本的增量升级补丁
│   └── tenant/               # 租户库各历史版本的增量升级补丁
│       └── <YYYYMMDDHHmmss>_<name>/
│           ├── migration.sql # 升级原生 SQL (up)
│           ├── down.sql      # 回滚原生 SQL (down，若支持)
│           ├── manifest.json # 包含风险标记、SHA-256 与审批元数据的清单
│           └── schema.snapshot.prisma # 本次变更对应的快照
│
└── src/                      # 源码实现
    ├── cli.ts                # 命令行调度入口 (pnpm db:migrate:*)
    ├── index.ts              # 模块对外统一导出入口
    ├── check.ts              # 校验 Canonical Schema 与快照的一致性
    │
    ├── core/                 # 核心模型与领域工具
    │   ├── types.ts          # 作用域、清单、风险代码等核心契约
    │   ├── paths.ts          # 工作区目录解析与定位
    │   ├── risk.ts           # 危险 SQL 静态扫描 (DROP TABLE, DROP COLUMN 等) 与批准断言
    │   └── artifacts.ts      # 物理 SQL 文件清单安全加载器 (带 SHA-256 防篡改比对)
    │
    ├── schema/               # 租户 Schema 动态扫描与聚合
    │   ├── aggregate.ts      # 扫描 db-tenant 与 features/*/prisma，支持 @db-migrate-extension
    │   └── aggregate.test.ts # 聚合器单元测试
    │
    ├── generation/           # 迁移与基线生成引擎 (开发期运行)
    │   ├── prisma.ts         # 调用本地依赖的 Prisma CLI 执行 diff 与 validate
    │   └── generate.ts       # 增量迁移脚手架生成、全量基线生成
    │
    └── runtime/              # 生产运行期服务 (纯 SQL 执行，无 Prisma CLI 依赖)
        ├── catalog.ts        # 动态扫描物理文件系统加载基线与迁移工件 (getMigrationCatalog)
        ├── platform-runner.ts# 带 advisory lock 锁保护的平台升级执行器
        ├── tenant-runner.ts  # 带 advisory lock 锁保护的多租户执行升级引擎
        ├── provisioner.ts    # 租户物理库自动化原子开通、基线建表与 Seed 初始化器
        └── service.ts        # 提供给应用层的总控 Facade (DatabaseMigrationService)
```

### 💡 核心认知：物理 SQL 资产单一事实源

系统彻底移除了将 SQL 编译为 TypeScript 常量文件的中间形态，全面转向**物理文件系统原生 SQL 资产**：

1. **唯一事实源**：`baselines/` 与 `migrations/` 目录中的 `.sql` 文件就是最终被数据库执行的唯一 SQL。
2. **防篡改保障**：每个目录伴随 `manifest.json`，在加载时由 `artifacts.ts` 动态计算真实 SQL 的 SHA-256 并与清单严格核验。
3. **零 CLI 运行时**：运行时直接通过 `getMigrationCatalog(scope)` 读取物理 SQL 文本，通过原生 `pg` 驱动执行，完全不需要 Prisma CLI。

---

## 三、 运行机制与核心逻辑

### 1. 多 Feature Schema 聚合机制 (`@db-migrate-extension`)

工业制造 ERP 的业务模块采用 Feature-based Vertical Slice Architecture，各 Business Area 各自维护其 `prisma/schema.prisma`（如 `procurement-center`、`customer-center`）。

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
5. 单事务执行物理文件中的最新 Baseline SQL (`baseline.sql`)
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
- 系统对比租户物理库已成功执行的账本版本与物理迁移目录中的清单；
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

### 场景 E：多人协同分支合并分叉与本地库一键自愈 (`db:local:reset`)

在多人协同开发时，如果同事合入了较早时间戳的历史迁移（减字段或改表），或者本地物理库与远端主干发生结构分叉：

1. **控制台自动识别与补跑**：平台看板采用账本集合差集算法，会自动识别合入的历史补丁并标记 `OUT_OF_ORDER_MIGRATION` 风险警告，提示管理员一键升级补跑；
2. **本地开发库一键重置**：若两人同时修改同一张表导致物理库脏乱或产生结构冲突，严禁在脏库上手工修改，直接运行本地一键重置命令推倒重来：

```bash
pnpm db:local:reset
# 或清空指定租户库：
pnpm db:local:reset -- --name tenant_001
```

系统会自动安全校验（仅限 localhost 执行）、清空物理库并按物理文件目录顺次灌装 Baseline + 全部 Migrations + 种子数据，2 秒内自愈至最新干净状态。
