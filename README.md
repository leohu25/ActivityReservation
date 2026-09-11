# 宸润数智 ERP (Chenrun Digital SaaS ERP)

基于 **Next.js 16 (App Router)** + **React 19** + **TypeScript** + **Tailwind CSS v4** + **PostgreSQL (Database-per-tenant 物理隔离)** 构建的现代化工业制造与供应链多租户 SaaS ERP 系统。

项目采用 **FDD (Feature-Driven Development) 垂直切片架构** 与 **Turborepo + pnpm Monorepo** 模块化工程治理体系。

---

## 快速上手指南 (Quick Start)

### 1. 前置环境要求

在开工前，请确保本地开发机已安装：

- **Node.js**：`>= v22.0.0`（推荐使用 `nvm` 或 `fnm`）
- **pnpm**：`v11.x`（项目锁定版本为 `pnpm@11.1.2`，可通过 `corepack enable` 或 `npm i -g pnpm` 安装）
- **Docker / OrbStack**：用于本地启动 PostgreSQL 数据库容器

---

### 2. 安装项目依赖

在**仓库根目录**执行安装命令：

```bash
pnpm install
```

> ⚠️ **重要规范**：
> 本项目为 Monorepo 架构，内部包之间通过 `workspace:*` 建立软链。**严禁使用 `npm install` 或 `yarn install`**，必须在根目录统一执行 `pnpm install`。

---

### 3. 初始化项目与环境检查

执行自动化环境基线自检脚本：

```bash
./init.sh
# 或
pnpm run init
```

脚本将自动执行以下检查与配置：

1. **装载 Git 门禁**：自动在 `.git/hooks/` 配置物理 `pre-commit` 门禁，确保每次提交前全栈自检通过。
2. **环境变量检查**：自动检测各子应用的环境配置文件状态。
3. **Control DB Day 0 自动自愈**：当检测到 `apps/control/.env.local` 且数据库为空时，自动安全执行最新 Baseline 建表并创建初始超管。

---

### 4. 配置本地环境变量

本项目遵循 **Turborepo / Next.js 官方应用级隔离规范**，不在根目录混入环境变量，而是在各 App 目录下维护专属配置。

请根据你的开发职责复制对应的环境模板文件：

```bash
# 1. 租户端应用配置 (Tenant SaaS)
cp apps/tenant/.env.example apps/tenant/.env.local

# 2. 平台总控端配置 (Control Admin)
cp apps/control/.env.example apps/control/.env.local
```

> **提示**：模板中的数据库连接串已默认预置了本地 Docker 容器的访问端口（`55433`）。若你需要自定义超级管理员白名单，可编辑 `apps/control/.env.local` 中的 `CONTROL_ADMIN_EMAILS`。

---

### 5. 启动本地数据库

启动本地 PostgreSQL 容器服务：

```bash
docker compose -f compose.local.yaml up -d
```

---

### 6. 启动本地开发服务

根据你当前开发的子应用选择执行：

| 服务类型 | 启动命令 | 本地访问地址 | 职责定位 |
| :--- | :--- | :--- | :--- |
| **平台管控端 (Control Admin)** | `pnpm run dev:control` | [http://localhost:3001](http://localhost:3001) | 平台超级管理员、租户开通、物理库生命周期、数据迁移中枢 |
| **租户业务端 (Tenant SaaS)** | `pnpm run dev:tenant` | [http://localhost:3000](http://localhost:3000) | 租户端登录、组织架构、权限工作台、采购中心、客户中心 |
| **全栈全量启动** | `pnpm run dev` | 同时启动 3000 与 3001 | 全局联调 |

---

## 常用开发命令清单

### 代码检查与自动化测试

```bash
# 运行全仓类型检查 (TypeScript)
pnpm run check

# 运行全仓单元测试与集成测试
pnpm run test

# 运行代码规范检查
pnpm run lint

# 全栈门禁完整验证 (git commit 前会自动触发)
./scripts/verify.sh
```

### 数据库管理与演进 (`tooling/db-migrate`)

本项目采用 `@chenrun/db-migrate` 统一治理平台控制库与多租户舰队的数据库演进：

```bash
# 1. 一致性检查（校验当前所有 Schema 与已提交的迁移/基线/Catalog 是否一致）
pnpm run db:migrate:check

# 2. 平台控制库 Day 0 结构与种子数据自愈（开箱即用建表并初始化超管）
pnpm run db:platform:ensure

# 3. 实体变更后显式生成增量迁移
pnpm run db:migrate:generate --scope tenant --name add_xxx_field
pnpm run db:migrate:generate --scope platform --name add_xxx_field

# 4. 重新生成或重置最新全量基线快照 (生成可审核的 baseline.sql)
pnpm run db:migrate:baseline --scope tenant --reset
pnpm run db:migrate:baseline --scope platform --reset

# 5. 重新编译生成运行期只读 Catalog (generated/runtime-catalog.ts)
pnpm run db:migrate:catalog
```

---

## 项目工程架构总览

详细系统架构、领域拓扑、租户物理隔离与鉴权协议设计请参见：[系统整体架构设计文档 (`docs/ARCHITECTURE.md`)](docs/ARCHITECTURE.md)。

```text
chenrun-erp-nextjs/
├── apps/
│   ├── control/                  # 平台总控端 App (Next.js 16, 端口 3001)
│   └── tenant/                   # 租户业务端 App (Next.js 16, 端口 3000)
├── packages/
│   ├── auth/                     # 基于 Better Auth 的身份认证核心包
│   ├── authorization/            # CASL 强类型四层权限体系与数据范围下推引擎
│   ├── db-control/               # 平台总控库 (Control DB) Prisma 驱动与 CLI
│   ├── db-tenant/                # 租户物理库 (Tenant DB) 动态路由连接池与迁移运行器
│   ├── shared/                   # 全局共享纯函数工具库 (Result, Dayjs, Radash 等)
│   ├── ui/                       # 基于 shadcn/ui + Tailwind v4 的工业级数智风组件库
│   └── features/                 # FDD 垂直切片业务特性包
│       ├── control-admin/        # 总控台运维与租户生命周期业务切片
│       ├── tenant-admin/         # 租户组织架构、岗位与角色权限业务切片
│       ├── procurement-center/   # 采购中心业务切片 (订单、审批流、字段三态拦截)
│       └── customer-center/      # 客户中心业务切片 (客户、门店、多级分类、报价单)
├── tooling/
│   └── db-migrate/               # 统一数据库迁移与多租户基线演进引擎 (@chenrun/db-migrate)
├── .harness/                     # 智能体协同工程最高宪法、沙盒边界与持久记忆库
├── compose.local.yaml            # 本地 PostgreSQL 容器编排
└── turbo.json                    # Turborepo 任务编排与精准增量缓存配置
```

---

## 协同与贡献规范

本项目严格遵守智能体与团队工程协同宪法：

1. **单特性聚焦**：开发前请查阅 `feature_list.json` 与 `.harness/features/`。
2. **严禁越界修改**：修改代码必须在当前特性的 `scope.md` 白名单内。
3. **零容忍门禁穿透**：所有代码在提交时必须通过 `pre-commit` 门禁自检，严禁用 `--no-verify` 强推。
