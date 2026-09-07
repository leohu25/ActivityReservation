# Tier 2：领域矩阵与切片拓扑 (Tier 2 Domain Matrix)

> 消费预算：~3,000 Tokens。适用于模块间接口调用、依赖对齐与跨模块契约核对。

## 一、 Monorepo 模块划分

```text
apps/
└── tenant/                  # Next.js 16 租户端应用主入口

packages/
├── foundation/              # SaaS 底座核心：Auth / AuthZ / Tenant Context / Guards
├── db-control/              # Control DB (saas_control) Prisma Client
├── db-tenant/               # Tenant DB (tenant_xxxxx) Prisma Client
├── ui/                      # 共享基础 UI 组件库 (Tailwind + Radix/shadcn)
├── shared/                  # 通用工具函数、枚举与错误码
└── features/
    └── procurement-center/  # 采购中心业务特性切片 (V1 验证用例)

tooling/
├── permission-compiler/     # 权限代码编译器与 P.*/F.* 常量生成器
├── tenant-migrate/          # Database-per-Tenant 数据库迁移 CLI
└── boundary-check/          # 架构边界静态检查器
```

## 二、 核心依赖流向规则

1. `apps/tenant` 依赖 `packages/*` 与各业务 Feature。
2. 业务 Feature 依赖 `packages/foundation`、`packages/db-tenant`、`packages/ui` 与 `packages/shared`。
3. 严禁业务 Feature 之间形成循环依赖，跨业务协作必须通过公开 Service 接口契约。
