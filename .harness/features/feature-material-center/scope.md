# 特性范围文件白名单 (Scope Whitelist) — feature-material-center

> 严格限定阶段 3 (Implement) 允许创建或修改的文件边界，超出此清单必须向 Coordinator 升级。

## 一、允许新建与修改的文件 (修改白名单)

### 1. 业务切片包内部 (packages/features/material-center/**)

- `packages/features/material-center/package.json`
- `packages/features/material-center/tsconfig.json`
- `packages/features/material-center/prisma/schema.prisma`
- `packages/features/material-center/src/manifest.ts`
- `packages/features/material-center/src/catalog.ts`
- `packages/features/material-center/src/features/classification/**`
- `packages/features/material-center/src/features/unit-management/**`
- `packages/features/material-center/src/features/item-master/**`
- `packages/features/material-center/src/features/bom-management/**`
- `packages/features/material-center/src/shared/**`
- `packages/features/material-center/src/assembly/**`

### 2. 租户前端装配层路由与页面 (apps/tenant/**)

- `apps/tenant/package.json` (声明 workspace 依赖)
- `apps/tenant/src/app/(dashboard)/materials/layout.tsx`
- `apps/tenant/src/app/(dashboard)/materials/categories/page.tsx`
- `apps/tenant/src/app/(dashboard)/materials/units/page.tsx`
- `apps/tenant/src/app/(dashboard)/materials/items/page.tsx`
- `apps/tenant/src/app/(dashboard)/materials/boms/page.tsx`
- `apps/tenant/src/app/(dashboard)/materials/boms/[bomId]/page.tsx`

### 3. 多租户数据库聚合与迁移工件 (受控生成)

- `packages/db-tenant/prisma/schema.generated.prisma` (由 sync-tenant-schema 自动生成)
- `tooling/db-migrate/migrations/tenant/**` (由 pnpm db:migrate:generate 生成)
- `tooling/db-migrate/generated/runtime-catalog.ts` (由 pnpm db:migrate:catalog 编译)
- `apps/tenant/src/kernel/registry.generated.ts` (由 pnpm sync:features 生成)

### 4. 特性沙盒与治理追踪文件

- `.harness/features/feature-material-center/**`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`

---

## 二、严禁修改的内容 (受保护区域)

- 严禁修改 `@base/auth`、`@base/db-control` 平台总控与认证协议。
- 严禁修改其他非关联 Feature 切片包（`customer-center`, `order-center`, `procurement-center`, `tenant-admin`, `control-admin`）。
- 严禁擅自修改根目录门禁脚本（`scripts/check-entity-baseline.mjs`, `scripts/check-redlines.mjs` 等）。
- 严禁使用 `--no-verify` 绕过 git pre-commit 物理门禁。

- `tooling/db-migrate/migrations/tenant/20260913105634_add_material_and_bom_models/down.sql` # 1 file @ head，联动修改自动登记

- `tooling/db-migrate/migrations/tenant/20260913105634_add_material_and_bom_models/manifest.json` # 1 file @ head，联动修改自动登记

- `tooling/db-migrate/migrations/tenant/20260913105634_add_material_and_bom_models/migration.sql` # 1 file @ head，联动修改自动登记

- `tooling/db-migrate/migrations/tenant/20260913105634_add_material_and_bom_models/schema.snapshot.prisma` # 1 file @ head，联动修改自动登记
