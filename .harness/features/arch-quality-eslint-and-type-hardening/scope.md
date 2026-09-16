# 特性范围说明 (Scope) — arch-quality-eslint-and-type-hardening

## 修改白名单

- `tooling/db-migrate/generated/runtime-catalog.ts` # 1 file @ 1b91d9b4，联动修改自动登记

- `packages/db-tenant/src/pool/manager.ts` # 1 file @ 46ee97fa，联动修改自动登记

- `eslint-boundaries.mjs` # 1 file @ bc7b400e，联动修改自动登记

- `packages/shared/src/index.test.ts` # 1 file @ 2b347ffa，联动修改自动登记
  (Whitelist)

- `feature_list.json`
- `member.local.md`
- `.harness/features/arch-quality-eslint-and-type-hardening/**`
- `.harness/lifecycle/resolve-feature.mjs`
- `scripts/check/check-boundary.mjs`
- `scripts/tools/status.mjs`
- `package.json`
- `turbo.json`
- `eslint.config.mjs`
- `packages/**/package.json`
- `packages/features/material-center/src/**`
- `packages/features/customer-center/src/**`
- `packages/features/tenant-admin/src/**`
- `packages/features/order-center/src/**`
- `tooling/db-migrate/migrations/tenant/**`
- `packages/db-tenant/prisma/**`
- `scripts/check/check-redlines.mjs`
- `scripts/check/check-redlines.test.mjs`
