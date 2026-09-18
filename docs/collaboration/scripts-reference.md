# 命令参考手册 (Scripts Reference)

本文件是根 `package.json` 全量 26 条 `scripts` 的**权威技术事实源 (SSoT)**。

> 💡 **架构设计规范**：
> 本工程遵循 **Turborepo 任务拓扑图** 与 **Next.js 官方 `src/instrumentation.ts`** 规范组织应用生命周期。
> 编译期代码生成由 Turborepo 基于文件 Hash 增量调度，运行时环境自愈由 Next.js 进程原生管理，静态门禁统一由 Git `pre-commit` 拦截，根命令保持纯粹的单一职责。

---

## 一、Turborepo 原生拓扑流水线 (Task Pipeline)

根命令通过 `turbo.json` 显式声明依赖拓扑与增量缓存，无需手动前置依赖：

| 顶层命令           | 底层实际调度                     | 拓扑前置依赖 (`dependsOn`) | 增量缓存策略                 | 职责定位                          |
| :----------------- | :------------------------------- | :------------------------- | :--------------------------- | :-------------------------------- |
| `pnpm dev`         | `turbo run dev`                  | `//#codegen`               | 缓存命中时 20ms 跳过代码生成 | 本地全端联调 (Turbo 并行拉起双端) |
| `pnpm dev:tenant`  | `turbo run dev --filter=tenant`  | `//#codegen`               | 依赖切片无变动则直接拉起应用 | 租户端独立开发 (`:3000`)          |
| `pnpm dev:control` | `turbo run dev --filter=control` | `//#codegen` + 运行时自愈  | 依赖切片无变动则直接拉起应用 | 平台总控端独立开发 (`:3001`)      |
| `pnpm build`       | `turbo run build`                | `//#codegen`, `^build`     | 产物增量缓存                 | 生产全端构建                      |
| `pnpm check`       | `turbo run check`                | `//#codegen`, `^check`     | 执行各包类型检查与迁移校验   | 全仓静态扫描 (`tsc --noEmit`)     |
| `pnpm test`        | `turbo run test`                 | `//#codegen`, `^test`      | 单元测试拓扑调度             | 全仓单测执行                      |

---

## 二、特性装配与代码生成 (`turbo codegen`)

### `pnpm codegen` (别名 `pnpm sync:features`)

在 `turbo.json` 中声明为根任务 `//#codegen`，配置了严格的文件 Hash 监听范围：

- **监听输入 (`inputs`)**：`packages/features/**/{manifest.ts,schema.prisma,package.json}`、`packages/db-tenant/prisma/schema.prisma`、`scripts/sync/**`
- **缓存产物 (`outputs`)**：`apps/tenant/src/kernel/registry.generated.ts`、`packages/db-tenant/prisma/schema.generated.prisma`

#### 1. 注册表生成 (`scripts/sync/sync-features.mjs`)

- **扫描机制**：扫描 `packages/features/*`（排除 `control-admin`），匹配 `src/manifest.ts`。按 `tenant-admin` 置顶、其余字典序排序。
- **生成产物**：`apps/tenant/src/kernel/registry.generated.ts`（导出 `ALL_TENANT_MANIFESTS`、CASL `globalTenantCatalog`、侧边栏导航、权限树）。
- **运行特性**：**幂等保护**，内容未变跳过磁盘写入，避免触发 Turbopack 热重载。依据 **ADR-006** 解耦切片间依赖。

#### 2. 租户 Schema 聚合 (`scripts/sync/sync-tenant-schema.mjs`)

- **聚合机制**：以 `packages/db-tenant/prisma/schema.prisma` 为底座，合并各业务切片 `prisma/schema.prisma`。
- **扩展语法**：支持 `// @db-migrate-extension ModelName` 声明切片侧模型扩展字段。
- **冲突拦截**：模型重复定义、扩展无主模型、同名字段类型契约冲突时硬报错中断。
- **生成产物**：`packages/db-tenant/prisma/schema.generated.prisma`（自动挂载 `@prisma/client-tenant` 生成头）。

---

## 三、平台总控端运行时自愈 (`instrumentation.ts`)

遵循 Next.js 官方生命周期标准，总控库的 Day 0 初始化由 **`apps/control/src/instrumentation.ts`** 的 `register()` 钩子在服务启动时自动完成：

1. **环境探测**：Next.js Node 运行时启动时在后台触发一次；
2. **底层引擎**：调用 `@base/db-migrate` 导出的 `ensurePlatformDatabase()`；
3. **安全事务**：在 PostgreSQL 咨询锁保护下检查库状态（`EMPTY` / `PARTIAL` / `READY` / `UPGRADE_REQUIRED`）；
4. **自动建表与播种**：未就绪时自动应用平台基线 SQL 建表，并使用 Better Auth 相同算法哈希密码创建初始超管；
5. **控制台自描述**：服务拉起时自动输出 `[Control DB] 平台总控库自愈就绪 (状态: READY, 当前版本: ...)`。

> ⚠️ **排障提醒 (为什么删表后没有自动初始化？)**：
>
> - **严格空库 (Fail-Closed)**：系统仅在库完全无核心表（`user`、`organization`、`session`）时才判定为 `EMPTY`。若在 Navicat 中手动删表遗留了部分表，会被判定为残缺库 `PARTIAL` 强行阻断。彻底清空请执行 `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`。
> - **超管环境变量配置**：执行 Day 0 初始化必须在 `apps/control/.env.local` 中配置 `CONTROL_BOOTSTRAP_ADMIN_EMAIL`、`CONTROL_BOOTSTRAP_ADMIN_NAME` 与 `CONTROL_BOOTSTRAP_ADMIN_PASSWORD` (≥12位)，缺失时会直接抛出 `SEED_CONFIGURATION_MISSING` 阻断。
> - **物理库必须预先存在**：应用无跨库创建 Database 权限，物理库（如 `control_db`）必须已由 Docker 或 DBA 创建。

---

## 四、数据库迁移引擎 (`tooling/db-migrate`)

基于 12-Factor 无状态原则设计的迁移引擎，支持 `tenant`（多租户分库）与 `platform`（平台总控库）两套 Scope。

| 命令                                      | 说明                                                                                                   | 适用阶段                       |
| :---------------------------------------- | :----------------------------------------------------------------------------------------------------- | :----------------------------- |
| `pnpm db:migrate:check`                   | **只读一致性校验**（CI 与 `pre-commit` 门禁使用）                                                      | 门禁、CI、改动 Schema 后的自检 |
| `pnpm db:migrate:catalog`                 | 重新生成预编译运行时 Catalog 快照                                                                      | 迁移脚本目录变更后             |
| `pnpm db:migrate:generate`                | 生成新迁移：`--scope platform/tenant --name <名称>`；破坏性变更需加 `--allow-destructive --reason ...` | 数据模型字段增删改             |
| `pnpm db:migrate:baseline`                | 为已有数据库打基线：`--scope platform/tenant`                                                          | 存量库接入管理                 |
| `pnpm db:migrate:baseline:reset:tenant`   | 重置租户基线：`--scope tenant --reset`                                                                 | 租户基线异常重建 (谨慎)        |
| `pnpm db:migrate:baseline:reset:platform` | 重置平台基线：`--scope platform --reset`                                                               | 平台基线异常重建 (谨慎)        |
| `pnpm db:tenant:reset`                    | 本地开发一键清空并重置租户物理库为最新 Baseline（自动灌装最新 DDL、迁移账本与组织种子）                | 本地开发重置基线后一键刷新     |

### `db:migrate:check`（4 项静态一致性门禁）

全程**只读且不连接数据库**：

1. **文档注释门禁**：校验所有模型与字段必须包含 `///` 文档注释；
2. **Schema 校验和**：当前 Schema 的 SHA-256 必须与最新迁移快照严格匹配；
3. **迁移链连续性**：按序检验各版本 `previousVersion` 链接，杜绝迁移分叉与断链；
4. **Catalog 就绪性**：确认预编译运行时文件存在。

> 注：`@base/db-migrate` 包的 `check` 任务已被挂载至 `turbo run check`，在执行 `pnpm check` 或 `git commit` 时自动校验。

---

## 五、总控库直连诊断工具 (`@base/db-control`)

用于 `apps/control` 总控库本地快速诊断（基于 Prisma CLI 封装）。常规模型变更仍须遵循迁移引擎。

| 命令                       | 对应底层指令              | 用途                                         |
| :------------------------- | :------------------------ | :------------------------------------------- |
| `pnpm db:control:diff`     | `tsx src/cli.ts diff`     | 比对 Schema 与数据库实体的差异               |
| `pnpm db:control:diff:sql` | `tsx src/cli.ts diff:sql` | 输出差异对应的可执行 SQL                     |
| `pnpm db:control:push`     | `tsx src/cli.ts push`     | 本地原型开发直接同步结构（**严禁生产使用**） |
| `pnpm db:control:status`   | `tsx src/cli.ts status`   | 查看当前总控库迁移状态                       |
| `pnpm db:control:gen`      | `prisma generate`         | 重新生成控制端 Prisma Client                 |

---

## 六、启动、构建与断点调试

### 服务启动

| 命令               | 对应 Turbo 任务                  | 默认端口                  |
| :----------------- | :------------------------------- | :------------------------ |
| `pnpm dev`         | `turbo run dev`                  | 3000 (租户) / 3001 (管控) |
| `pnpm dev:tenant`  | `turbo run dev --filter=tenant`  | 3000                      |
| `pnpm dev:control` | `turbo run dev --filter=control` | 3001                      |
| `pnpm build`       | `turbo run build`                | —                         |

> 端口优先级：`apps/*/.env.local` > `apps/*/.env` > 默认值 (租户 3000 / 管控 3001)。

### 断点调试 (Zed / VS Code 通用)

项目在 `.vscode/launch.json` 中预置了调试通道：

- **`Next.js: Debug Tenant (租户端)`**：对应 `pnpm dev:tenant`
- **`Next.js: Debug Control (平台总控端)`**：对应 `pnpm dev:control`

在 Zed / VS Code 命令面板选择对应项启动即可。Turbo 会按需执行 `codegen`，随后拉起 Next.js 服务端，`debugger;` 语句与红点断点在服务端正常挂起。

---

## 七、工程治理与质量门禁

| 命令               | 作用                                                                  | 触发时机                    |
| :----------------- | :-------------------------------------------------------------------- | :-------------------------- |
| `pnpm init`        | 环境自检（Node/pnpm 版本、pre-commit 钩子、总控库自愈）               | 新会话开始前执行            |
| `pnpm status`      | 输出当前协作分支、生效特性沙盒及特性交付状态                          | 随时确认当前工作项          |
| `pnpm verify`      | 执行 8 项架构门禁扫描（红线、沙盒、实体基线、权限契约、类型检查）     | `git commit` 时钩子自动拦截 |
| `pnpm session:end` | 校验特性总账、经验记忆文件是否齐备                                    | 任务交接或会话结束时        |
| `pnpm check`       | 聚合执行全仓类型检查 (`turbo run check`，包含 codegen、迁移校验、tsc) | 门禁调用或改动类型后        |
| `pnpm lint`        | 执行全仓 ESLint 代码规范扫描 (`turbo run lint`)                       | 提交前审查                  |
| `pnpm test`        | 执行全仓单元测试 (`turbo run test`)                                   | 逻辑修改后验证              |
| `pnpm ui:add`      | 使用 shadcn CLI 向 `packages/ui` 引入组件                             | 扩展通用 UI 库时            |
| `pnpm clean:cache` | 清理 Turbo 缓存与 Next.js 编译中间产物 (`.turbo`, `apps/*/.next`)     | 编译缓存污染排查            |

---

## 八、开发场景速查清单

| 场景                          | 推荐操作路径                                                                                                                      |
| :---------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| **开工就绪**                  | 执行 `pnpm init`，按需执行 `pnpm status` 查看任务状态                                                                             |
| **新增/删除业务切片**         | 直接运行 `pnpm dev:tenant`（Turbo 自动检测并增量执行 `codegen`）                                                                  |
| **改动租户/平台 Prisma 模型** | 1. 补齐字段 `///` 注释；2. 运行 `pnpm db:migrate:generate --scope platform/tenant --name <名称>`；3. 运行 `pnpm check` 验证一致性 |
| **本地断点调试**              | Zed 中按 `Cmd + Shift + P` → 执行 `debugger: start` → 选择对应端启动                                                              |
| **遇到 Next.js 编译异常**     | 执行 `pnpm clean:cache`，随后重新拉起服务                                                                                         |
| **代码提交阶段**              | 正常执行 `git commit`，底层门禁会自动运行全量校验，无需手工调用 verify                                                            |
