# 命令参考手册 (Scripts Reference)

本文件是根 `package.json` 全量 25 条 `scripts` 的**权威技术事实源 (SSoT)**。

> ⚠️ `package.json` 为严格 JSON 格式，写入注释会导致 Node/pnpm 启动解析崩溃，全量命令说明统一收敛于此。

---

## 核心前置校验矩阵 (Preflight Matrix)

开发与构建链路中，3 项前置自动化任务的触发分布：

| 命令 | `sync:features` (切片/Schema同步) | `db:migrate:check` (迁移一致性门禁) | `db:platform:ensure` (总控库Day0初始化) | 核心定位 |
| :--- | :---: | :---: | :---: | :--- |
| `pnpm dev` | ✅ | ✅ | ✅ | 本地全端联调 (Turbo 并行拉起双端) |
| `pnpm dev:tenant` | ✅ | ✅ | ❌ | 租户端独立开发 (`:3000`) |
| `pnpm dev:control` | ❌ | ✅ | ✅ | 平台管控端独立开发 (`:3001`) |
| `pnpm build` | ✅ | ✅ | ❌ | 生产构建 |
| `pnpm check` | ✅ | ✅ | ❌ | 全仓 TypeScript 类型检查 (`tsc --noEmit`) |
| `pnpm test` | ✅ | ❌ | ❌ | 全仓单测执行 |
| `pnpm init` | ❌ | ❌ | ✅ | 会话开工自检与基线就绪 |
| `pnpm verify` | ✅ (经 check) | ✅ (经 check) | ❌ | Git pre-commit 物理门禁自检 |
| VS Code/Zed 调试 | ❌ | ❌ | ❌ | 调试器专用通道 (避免子进程调试死锁) |

> 📌 **关键速记**：
>
> - `dev:tenant` 覆盖了 `sync:features` 与 `db:migrate:check`，增删业务切片后直启即可，无需手动同步；
> - `dev:control` 覆盖了 `db:migrate:check` 与 `db:platform:ensure`，总控库 Day 0 自动就绪；
> - `dev` 为全集并集（包含全部 3 项前置），双端联调无缝开箱；
> - 仅 VS Code / Zed 调试配置为绕开 IDE 调试器死锁而采用裸 `--filter`，前置项全部跳过。

---

## 一、特性装配与代码生成

### `pnpm sync:features`

串联执行两个自动化生成脚本：

```bash
node scripts/sync/sync-features.mjs && node scripts/sync/sync-tenant-schema.mjs
```

#### 1. 注册表生成 (`sync-features.mjs`)

- **执行逻辑**：扫描 `packages/features/*`（排除 `control-admin`，匹配 `src/manifest.ts`）。按 `tenant-admin` 置顶、其余字典序稳定排序。
- **核心产物**：`apps/tenant/src/kernel/registry.generated.ts`（导出 `ALL_TENANT_MANIFESTS`、CASL `globalTenantCatalog`、侧边栏导航、权限树）。
- **运行特性**：**幂等保护**，内容未变时跳过写入，避免触发 Next.js 热重载。依据 **ADR-006** 解耦切片间依赖。

#### 2. 租户 Schema 聚合 (`sync-tenant-schema.mjs`)

- **执行逻辑**：以 `packages/db-tenant/prisma/schema.prisma` 为底座，合并各业务切片 `prisma/schema.prisma`。
- **扩展机制**：支持 `// @db-migrate-extension ModelName` 语法向中心模型注入切片专用字段。
- **硬性冲突检查**：模型重复声明、扩展无主模型、同名字段类型契约冲突时抛错中断。
- **核心产物**：`packages/db-tenant/prisma/schema.generated.prisma`（自动注入 `@prisma/client-tenant` 客户端生成头）。

---

## 二、数据库迁移引擎 (`tooling/db-migrate`)

基于 12-Factor 无状态原则设计的自愈迁移引擎，操作分属 `tenant`（多租户分库）与 `platform`（平台总控库）两套 Scope。

| 命令 | 说明 | 适用阶段 |
| :--- | :--- | :--- |
| `pnpm db:migrate:check` | **只读一致性校验**（详见下文） | 门禁、CI、改动 Schema 后的自检 |
| `pnpm db:migrate:catalog` | 重新生成预编译运行时 Catalog 快照 | 迁移脚本目录变更后 |
| `pnpm db:migrate:generate` | 生成新迁移：`--scope platform/tenant --name <名称>`；破坏性变更须附加 `--allow-destructive --reason ...` 参数 | 数据模型字段增删改 |
| `pnpm db:migrate:baseline` | 为已有数据库打基线：`--scope platform/tenant` | 存量库接入管理 |
| `pnpm db:migrate:baseline:reset` | 重置租户基线：`--scope tenant --reset` | 租户基线异常重建 (谨慎) |
| `pnpm db:platform:ensure` | **平台总控库 Day 0 自愈初始化**（详见下文） | 首次部署、开工自检 |

### 核心子命令详解

#### `db:migrate:check`（4 项静态一致性门禁）

全程**只读且不连接数据库**：

1. **文档注释门禁**：校验所有模型与字段必须包含 `///` 文档注释。
2. **Schema 校验和**：当前 Schema 的 SHA-256 必须与最新迁移快照严格匹配，防范私改 Schema 未生成迁移。
3. **迁移链连续性**：按序检验各版本 `previousVersion` 链接，杜绝迁移分叉与断链。
4. **Catalog 就绪性**：确认预编译运行时文件存在。

#### `db:platform:ensure`（Day 0 平台库自愈）

直连 `CONTROL_DATABASE_URL`，在**事务 + PostgreSQL 咨询锁**保护下幂等执行：

1. **库状态检查**：探测当前处于 `EMPTY` / `PARTIAL` / `READY` / `UPGRADE_REQUIRED`。
2. **基线建表**：处于未就绪状态时，自动应用平台基线 SQL 建表。
3. **种子管理员**：执行 `seedPlatformBootstrapAdmin`，调用 Better Auth 相同算法哈希密码并写入用户表。该邮箱须在 `CONTROL_ADMIN_EMAILS` 环境变量白名单内生效。

---

## 三、总控库直连诊断工具 (`@base/db-control`)

用于 `apps/control` 总控库的本地快速诊断（基于 Prisma CLI 封装）。常规模型变更仍须遵循第二节的迁移引擎。

| 命令 | 对应底层指令 | 用途 |
| :--- | :--- | :--- |
| `pnpm db:control:diff` | `tsx src/cli.ts diff` | 比对 Schema 与数据库实体的差异 |
| `pnpm db:control:diff:sql` | `tsx src/cli.ts diff:sql` | 输出差异对应的可执行 SQL |
| `pnpm db:control:push` | `tsx src/cli.ts push` | 本地原型开发直接同步结构（**严禁生产使用**） |
| `pnpm db:control:status` | `tsx src/cli.ts status` | 查看当前总控库迁移状态 |
| `pnpm db:control:gen` | `prisma generate` | 重新生成控制端 Prisma Client |

---

## 四、启动、构建与断点调试

### 服务启动

| 命令 | 启动链路 | 默认端口 |
| :--- | :--- | :--- |
| `pnpm dev` | `sync:features` → `db:migrate:check` → `db:platform:ensure` → `turbo run dev` | 3000 (租户) / 3001 (管控) |
| `pnpm dev:tenant` | `sync:features` → `db:migrate:check` → `pnpm --filter tenant dev` | 3000 |
| `pnpm dev:control` | `db:migrate:check` → `db:platform:ensure` → `pnpm --filter control dev` | 3001 |
| `pnpm build` | `sync:features` → `db:migrate:check` → `turbo run build` | — |

> 端口优先级：`apps/*/.env.local` > `apps/*/.env` > 默认值 (租户 3000 / 管控 3001)。

### 断点调试 (Zed / VS Code 通用)

项目在 `.vscode/launch.json` 中配置了极简调试入口：

- **`Next.js: Debug Tenant (租户端)`**：对应 `pnpm --filter tenant dev`
- **`Next.js: Debug Control (平台总控端)`**：对应 `pnpm --filter control dev`

> 💡 **设计说明**：调试启动跳过了前置检查链，直接运行单端 dev 命令，彻底根治了 IDE 调试器因附加短命前置子进程而导致的 `Waiting for the debugger to disconnect...` 卡死问题。

---

## 五、工程治理与质量门禁

| 命令 | 作用 | 触发时机 |
| :--- | :--- | :--- |
| `pnpm init` | 环境自检（Node/pnpm 版本、pre-commit 钩子、总控库自愈） | 新会话开始前执行 |
| `pnpm status` | 输出当前协作分支、生效特性沙盒及特性交付状态 | 随时确认当前工作项 |
| `pnpm verify` | 执行 8 项架构门禁扫描（红线、沙盒、实体基线、权限契约、类型检查） | `git commit` 时钩子自动拦截 |
| `pnpm session:end` | 校验特性总账、经验记忆文件是否齐备 | 任务交接或会话结束时 |
| `pnpm check` | 聚合执行类型检查 (`sync:features` + `db:migrate:check` + `turbo check`) | 门禁调用或改动类型后 |
| `pnpm lint` | 执行全仓 ESLint 代码规范扫描 | 提交前审查 |
| `pnpm test` | 执行全仓单元测试 (需配合 `sync:features`) | 逻辑修改后验证 |
| `pnpm ui:add` | 使用 shadcn CLI 向 `packages/ui` 引入组件 | 扩展通用 UI 库时 |
| `pnpm clean:cache` | 清理 Turbo 缓存与 Next.js 编译中间产物 (`.turbo`, `.next`) | 编译缓存污染排查 |

---

## 六、开发场景速查清单

| 场景 | 推荐操作路径 |
| :--- | :--- |
| **开工就绪** | 执行 `pnpm init`，按需执行 `pnpm status` 查看任务状态 |
| **新增/删除业务切片** | 运行 `pnpm dev:tenant` 会自动同步，亦可单独运行 `pnpm sync:features` |
| **改动租户/平台 Prisma 模型** | 1. 补齐字段 `///` 注释；2. 运行 `pnpm db:migrate:generate --scope <scope> --name <名称>`；3. 运行 `pnpm db:migrate:check` 验证一致性 |
| **本地断点调试** | Zed 中按 `Cmd + Shift + P` → 执行 `debugger: start` → 选择对应端启动 |
| **遇到 Next.js 编译异常** | 执行 `pnpm clean:cache`，随后重新拉起服务 |
| **代码提交阶段** | 正常执行 `git commit`，底层门禁会自动运行全量校验，无需手工调用 verify |
