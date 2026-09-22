# Turborepo 任务拓扑与缓存编排规范 (turbo.json)

本文件是根目录 `turbo.json` 的**权威架构设计与配置说明文档 (SSoT)**。

Turborepo 在本项目中作为 **Monorepo 构建与任务拓扑调度引擎**，负责管理全仓工作区包（双端应用 `apps/*`、平台底座 `@base/*`、中台资产 `@biz/*`、平台套件 `@platform/*`、业务切片 `@domain/*` 以及迁移工具）之间的编译期依赖关系、任务执行顺序与增量缓存。

---

## 一、核心配置概览

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "cacheMaxSize": "2GB",
  "cacheMaxAge": "7d",
  "globalDependencies": ["turbo.json", "pnpm-workspace.yaml"],
  "tasks": {
    "codegen": { ... },
    "@runtime/db#codegen": { ... },
    "@runtime/tenant#codegen": { ... },
    "generate": { ... },
    "build": { ... },
    "lint": { ... },
    "check": { ... },
    "test": { ... },
    "dev": { ... }
  }
}
```

### 全局参数说明

- **`ui: "tui"`**：在交互式终端下启用 Turborepo 现代 TUI 界面，清晰分屏展示各包并行日志。
- **`cacheMaxSize: "2GB"`**：本地文件缓存上限为 2GB，超出时自动淘汰最久未使用的构建产物。
- **`cacheMaxAge: "7d"`**：本地缓存有效期为 7 天。
- **`globalDependencies`**：`turbo.json` / `pnpm-workspace.yaml` 变更会使全部任务缓存失效。

### 设计原则（教科书式 Turborepo）

1. **根 `package.json` 只保留 `turbo run *` 调度器**，不挂业务编排脚本、不写 `&&` 胶水；
2. **编译期生成物住在产物所属包**：谁产出 `registry.ts` / 聚合 Schema，谁暴露 `codegen` 脚本；
3. **依赖一律写在 `turbo.json#tasks.*.dependsOn`**，开发 (`dev`) 与正式打包 (`build`) 共用同一拓扑；
4. **有哈希输入/输出的生成任务开启缓存**；`prisma generate` 保持 `cache: false` 强制新鲜。

---

## 二、任务拓扑与依赖流向 (Task Graph)

```mermaid
graph TD
  SF["@runtime/tenant#codegen<br>(manifest → registry.ts)"]
  SS["@runtime/db#codegen<br>(切片 Schema → 聚合 schema.prisma)"]
  SF --> Generate["generate<br>(Prisma Client 生成)"]
  SS --> Generate
  Generate --> Dev["dev (开发服务器)"]
  Generate --> Check["check (类型与静态检查)"]
  Generate --> Test["test (单元测试)"]
  Generate --> Build["build (生产打包)"]
  BuildDep["^build (上游依赖包 build)"] --> Build
```

`pnpm dev` 与 `pnpm build` 均沿 `*#dev|build → *#generate → @runtime/*#codegen` 执行，不存在「仅开发聚合、打包不聚合」的分叉。

---

## 三、各任务详细配置与作用解析

### 1. `@runtime/db#codegen`（包任务：租户 Schema 聚合）

- **类型**：Package Task（脚本位于产物包 `packages/runtime/db`，路径 `@runtime/db#codegen`）。
- **脚本**：`node ./scripts/sync-schema.mjs`
- **职责**：将 `@base/db-tenant` 与 `packages/domains/*`、`packages/platform/*` 的 `prisma/schema.prisma` 聚合为 `packages/runtime/db/prisma/schema.prisma`（Canonical Tenant Schema）。
- **监听输入 (`inputs`)**：本包 `scripts/**`、`packages/base/db-tenant/prisma/schema.prisma`、`packages/domains/**/prisma/schema.prisma`、`packages/platform/**/prisma/schema.prisma`
- **缓存产物 (`outputs`)**：`prisma/schema.prisma`
- **扩展语法**：支持 `// @db-migrate-extension ModelName` 声明切片对基座模型的字段扩展；模型冲突/字段类型冲突硬失败。

### 2. `@runtime/tenant#codegen`（包任务：特性注册表聚合）

- **类型**：Package Task（`packages/runtime/tenant`）。
- **脚本**：`node ./scripts/sync-features.mjs`
- **职责**：扫描 `packages/domains/*`、`packages/platform/*` 的 `src/manifest.ts`，生成 `src/registry.ts`（导航树、Manifest 注册表、CASL 权限目录）。
- **监听输入 (`inputs`)**：本包 `scripts/**`、各切片 `src/manifest.ts` 与 `package.json`
- **缓存产物 (`outputs`)**：`src/registry.ts`
- **运行特性**：幂等保护，内容未变跳过磁盘写入，避免无谓的 Turbopack 热重载。

### 3. `generate`（Prisma 客户端生成）

- **依赖关系 (`dependsOn`)**：`["@runtime/db#codegen", "@runtime/tenant#codegen", "^generate"]`
- **缓存策略 (`cache`)**：`false`
- **职责**：在两个 codegen 产出之后，由 `@base/db-tenant` / `@base/db-control` 执行 `prisma generate`，得到强类型 Client。
- **定位**：`dev`、`build`、`check`、`test` 的共同前置，保证类型与库映射就绪。

---

### 4. `build`（生产全端构建）

- **依赖关系 (`dependsOn`)**：`["generate", "^build"]`
  - `generate`：必须先有最新的 Prisma Client；
  - `^build`：拓扑依赖，必须先构建本模块依赖的底层 workspace 兄弟包（如 UI、Shared、Auth 等）。
- **监听输入 (`inputs`)**：
  - `"$TURBO_DEFAULT$"`（源码文件）
  - `".env*"`、`".env.local"`（环境变量变动将导致构建缓存失效）
- **缓存产物 (`outputs`)**：
  - `".next/**"`（Next.js 生产产物）
  - `"!.next/cache/**"`、`"!.next/dev/**"`（排除开发缓存，减少存储浪费）
  - `"dist/**"`（各底层库打包出口）

---

### 5. `check`（全仓强类型与门禁静态扫描）

- **依赖关系 (`dependsOn`)**：`["generate", "^check"]`
- **缓存策略 (`cache`)**：`false`
- **职责**：并发调度各子包执行 `tsc --noEmit` 以及迁移一致性检查（`db-migrate check`）。前置依赖保证在类型扫描时不会因缺少生成的客户端代码而误报。

---

### 6. `test`（单元测试调度）

- **依赖关系 (`dependsOn`)**：`["generate", "^test"]`
- **缓存策略 (`cache`)**：`false`
- **职责**：执行各包同级单测。确保测试运行时能读取到最新的 Schema 与生成的类型定义。

---

### 7. `lint`（代码规范扫描）

- **依赖关系 (`dependsOn`)**：`["^lint"]`
- **职责**：拓扑调度 ESLint，对代码规范、边界引用（`eslint-plugin-boundaries`）进行严格审查。

---

### 8. `dev`（本地多端微服务并行启动）

- **依赖关系 (`dependsOn`)**：`["generate"]`
- **缓存策略 (`cache`)**：`false`
- **常驻服务 (`persistent`)**：`true`（告知 Turbo 这是常驻进程，不会退出）
- **职责**：并行拉起 `apps/control`（平台管控端，默认 3001）与 `apps/tenant`（租户业务端，默认 3000）。

---

## 四、常见问题与最佳实践

1. **为什么根目录没有把 `clean` 放在 turbo 里，而是用 `node scripts/clean.mjs`？**
   - Turborepo 的核心强项是**按 DAG 拓扑构建与产物缓存**；
   - 清理缓存（如删除根目录的 `.turbo` 本身以及 `apps/*/.next`）属于破坏性操作，如果用 Turbo 执行清理 `.turbo`，容易引起进程锁竞争或自我清理冲突。
   - 因此根目录的 `pnpm clean:cache` 采用独立的 Node.js 跨平台脚本 `node scripts/clean.mjs` 进行优雅安全的物理清理。

2. **如何单独运行某个包的任务？**
   - 租户端：`pnpm --filter tenant dev` 或 `pnpm dev:tenant`
   - 总控端：`pnpm --filter control dev` 或 `pnpm dev:control`
   - 特定特性：`pnpm --filter @domain/customer-center test`
