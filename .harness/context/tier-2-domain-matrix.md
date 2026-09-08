# Tier 2：领域矩阵与切片拓扑 (Tier 2 Domain Matrix)

> 消费预算：~3,000 Tokens。适用于模块间接口调用、依赖对齐与跨模块契约核对。

## 一、 Monorepo 模块划分

```text
apps/
├── tenant/                  # Next.js 16 租户端应用 (单租户物理隔离域，极薄路由挂载)
└── platform/                # Next.js 16 平台运营商总控应用 (跨租户全局运营域，极薄路由挂载)

packages/
├── features/                # 🎯 FDD 垂直切片包 (业务逻辑、组件、Service 严格自包含)
│   ├── platform-admin/      # 平台总控特性切片 (租户开通、物理库创建、生命周期管控)
│   ├── tenant-rbac/         # 租户角色与四层权限配置切片
│   └── procurement-center/  # 采购中心业务特性切片
│
├── auth/                    # Better Auth 客户端、服务端与 Organization 插件配置
├── authorization/           # CASL + Ability Factory + 四层权限引擎 + 门禁适配
├── db-control/              # Control DB (saas_control) Prisma Client 与集中账本
├── db-tenant/               # Tenant DB (tenant_xxxxx) Prisma Client 与开通引擎
├── ui/                      # 纯基础通用原子 UI 组件库 (Button, Dialog, PermissionField 等)
└── shared/                  # 通用工具函数、枚举与错误码

tooling/
├── tenant-migrate/          # Database-per-Tenant 数据库 Alembic 式迁移 CLI
└── boundary-check/          # 架构边界静态检查器
```

## 二、 核心依赖流向规则与 FDD 纪律

1. **应用层极薄化 (Thin Apps)**：`apps/*` 仅作为页面路由与权限上下文的装配层，**严禁在 `apps/` 内部编写复杂的业务服务、直接 SQL 查询或私有业务组件**，必须将其下沉到 `packages/features/<feature>/`。
2. **切片自包含 (Self-Contained Slices)**：每个业务切片独立内聚其专属的 UI 组件 (`components/`)、服务层 (`services/`)、权限契约 (`permissions.ts`)、数据类型 (`types.ts`) 与单元测试。
3. **依赖单向流向**：`apps/*` 依赖 `packages/features/*` 与基础底座包；Feature 切片依赖 `packages/{auth, authorization, db-control, db-tenant, ui, shared}`；严禁 Feature 切片之间产生循环依赖。
