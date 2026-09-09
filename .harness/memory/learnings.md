# 避坑指南与工程实践库 (Learnings)

本文档记录团队在开发过程中踩过的坑与最佳实践：

## 1. 权限定义与强类型声明 (Better Auth + CASL)

- **痛点**：在引入成熟权限库后，AI 仍可能随手使用未经验证的裸字符串（如直接手写 `"procurement.order.create"` 或拼写错误），导致权限判定失效或意外越权。
- **解法**：
  - 功能权限统一在各业务切片的 `permissions.ts` 中声明 Better Auth `statement` (Resource -> Actions) 与 CASL `ProcurementPermission` / `Subject` 契约映射；
  - 严禁手写魔术字符串，统一引用切片导出的权限强类型对象（如 `ProcurementPermission.order.resource`、`ProcurementPermission.order.actions` 或 `ProcurementFields`）；
  - 服务端使用 `@RequireAbility(action, subject)` 或 CASL `ability.can()` 判定，前端通过 `<Can I={action} a={subject}>` 门禁，字段三态通过 `<PermissionField>` 控制；
  - 在 `./scripts/check-redlines.mjs` 中设置了物理红线扫描，严禁绕过授权体系或旧版裸写权限判定。

## 2. 数据库连接池与动态路由

- **痛点**：Database-per-Tenant 频繁创建 PrismaClient 会导致连接池泄露和数据库连接占满。
- **解法**：在 `TenantDbManager` 中维护有容量上限（LRU 策略）的 Client 缓存池，并合理设置连接生命周期。

## 3. Server Component 与 Data Fetching

- **痛点**：Next.js App Router 中 Server Component 内部 `fetch('/api/...')` 会产生自请求网络往返，且丢失 Cookie/Session 上下文。
- **解法**：Server Component 必须直调 Application Service，Server Action 仅作为 Web Mutation 适配器。

## 4. 多租户物理库迁移与 Alembic 式 Diff 生成

- **痛点**：多租户物理隔离下若直接由 Next.js 服务启动时执行 `prisma db push`，会导致大量租户库并发死锁且无审计回滚账本。
- **解法**：在 Control DB 维护 `TenantMigration` 账本模型；使用 `tooling/tenant-migrate generate` 基于 Prisma migrate diff 离线静态生成升级 SQL (`migration.sql` 与 `down.sql`)；运行时通过事务升级引擎与执行器实现幂等升级与失败断点阻断。

## 5. 消除状态双写与沙盒单源治理 (Single Source of Truth)

- **痛点**：在根目录下频繁更新全量 `progress.md` 和 `session-handoff.md`，同时又在 `.harness/features/<id>/` 下重复更新，导致两份记录经常出现内容冲突或维护冗余。
- **解法**：
  - **彻底移除根目录下冗余的 `progress.md` 和 `session-handoff.md`**；
  - **各特性的执行进度与换手交接单**严格且唯一收敛至其自身专属沙盒目录 `.harness/features/<id>/progress.md` 与 `handoff.md`；
  - **全局特性账本**统一以 `feature_list.json` 为唯一事实源 (SSoT)；
  - **跨特性的经验总结**统一沉淀至 `.harness/memory/learnings.md`，**发现的历史遗留问题**统一登记至 `.harness/memory/technical-debt.md`。

## 6. 合理执行门禁验证，杜绝机械重复

- **痛点**：在准备执行 `git commit` 前，开发者或智能体已刚刚手动运行过 `./scripts/verify.sh` 并确认通过；由于 Git `pre-commit` 钩子本身已挂载该校验，若在无源码变更下连续手动重复执行，会导致 12 个 package 的全量类型与红线扫描被连续计算两次，造成严重的无效等待。
- **解法**：
  - 核心节点只需保证通过一次有效门禁；
  - 刚刚验证通过且代码未再修改时，直接执行提交，由 `pre-commit` 自动兜底；
  - 日常开发优先执行单 Package 测试或类型检查，避免无节制全量扫盘。

## 7. 公共 UI 模块与 shadcn 官方组件安装规范 (Monorepo SOP)

- **痛点**：
  - 手写私有 UI 伪冒 shadcn 原生规范，不仅颜色硬编码（如 `slate-*`、`blue-*`），且绕过了 `--muted`、`--border` 等设计令牌，导致主题、品牌色和 Dark Mode 切换失效；
  - 在 Monorepo 环境中随意运行交互式 CLI 容易卡死终端，或因缺少子包别名导致文件落入错误路径。
- **解法与固化规范**：
  - **基础原子组件标准**：`packages/ui` 基础原子组件必须 100% 遵循 `shadcn/ui (new-york)` 原生实现，使用 React 19 标准签名、`data-slot` 体系与 CSS 变量设计令牌；
  - **安装新组件必须走统一命令**：

    ```bash
    pnpm ui:add <component_name>
    # 等价于：npx shadcn@latest add <component_name> -y --overwrite -c packages/ui
    ```

  - **组件添加后的标准化流程 (SOP)**：
    1. **命令下发**：根目录执行 `pnpm ui:add <组件名>`；
    2. **依赖闭环**：检查 `packages/ui/package.json`，确保 CLI 下载引入的新依赖（如 `@radix-ui/*`）声明完整，避免幽灵依赖；
    3. **统一导出**：在 `packages/ui/src/index.ts` 中显式追加 `export * from "./components/<组件名>";`，使全仓业务应用直接从 `@chenrun/ui` 导入；
    4. **质量验证**：执行 `pnpm --filter @chenrun/ui check && pnpm --filter @chenrun/ui test`；
    5. **门禁自检**：运行 `./scripts/verify.sh` 确保类型零错误、无幽灵依赖。

## 8. 严禁主观猜测与私造轮子，遇到疑难强制检索官方规范 (Official Docs First)

- **痛点**：
  - 在遇到框架或库的复杂底层报错时（例如 Next.js App Router 报错 `Only plain objects can be passed. Decimal objects are not supported`），容易凭借主观经验猜测，盲目手写脆弱的递归清洗或 ad-hoc 拼接逻辑；
  - 甚至在引入三方库时（如 SuperJSON）未查阅其真实规范，误以为默认支持任意非原生 Class，漏掉了官方 README 明确要求的 `registerCustom` 配方，导致重复踩坑与代码架构漂移。
- **解法与行为契约 (Learning & Invariant)**：
  - **首查官方文档 (Official Recipes First)**：遇到涉及三方库行为、版本破坏性改动或边缘报错时，**严禁闭门造车或主观猜测**，必须第一时间通过联网搜索或文档检索工具查阅官方 GitHub 仓库、官方 README 与标准配方（Recipes）；
  - **对齐成熟生态规范**：如 SuperJSON 官方明确提供了对 `Decimal.js` / `Prisma.Decimal` 的标准拓展配方（`SuperJSON.registerCustom<Decimal, string>(...)`），严格遵循官方实现既优雅又稳健；
  - **坚持工业级标准**：能用业界经过数亿次生产验证的成熟库（如 `radash`、`dayjs`、`superjson`、`Intl`）解决的问题，严禁手写脆弱轮子；同时必须对齐强类型（彻底消灭 `any`）与完备的中文业务注释。

