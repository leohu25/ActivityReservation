# 特性范围说明 — base-archives (基础档案与数据字典)

## 允许修改的文件与目录 (修改白名单)

- `feature_list.json`
- `.harness/features/base-archives/**`
- `packages/domains/base-archives/**`
- `packages/base/db-tenant/**`
- `packages/base/authorization/**`
- `packages/domains/customer-center/**`
- `packages/platform/tenant-admin/**`
- `scripts/check/check-entity-baseline.mjs`
- `apps/tenant/src/kernel/registry.generated.ts`
- `apps/tenant/src/app/(dashboard)/settings/dict/**`
- `apps/tenant/src/app/(dashboard)/settings/layout.tsx`
- `apps/tenant/src/app/(dashboard)/archives/**`
- `apps/tenant/src/app/(dashboard)/workbench/**`
- `apps/tenant/src/kernel/**`
- `apps/tenant/package.json`
- `tooling/db-migrate/migrations/tenant/**`
- `tooling/db-migrate/generated/runtime-catalog.ts`

## 附带修改说明

- `TenantDictItem` 登记至 `scripts/check/check-entity-baseline.mjs` 豁免清单（租户全局共享配置只读字典表，通过 status 控制启停）。
- `packages/base/db-tenant/prisma/schema.generated.prisma` 由 `scripts/sync/sync-tenant-schema.mjs` 生成。
- `apps/tenant/src/kernel/registry.generated.ts` 由 `scripts/sync/sync-features.mjs` 自动发现注册。

## 严禁修改的内容 (受保护区域)

- 严禁擅自破坏既有包的向后兼容公开导出。
- 严禁修改其他非关联 Feature 业务切片（如 `customer-center`）。
- 严禁破坏 CASL 四层权限契约与多租户分库隔离边界。
- 严禁未经审阅擅自提交代码。
