# 特性范围说明 — central-kitchen-phase1-entities-and-domains (中央厨房P1基础基建与实体建模)

## 一、 允许修改的范围白名单 (Whitelist)

- `.harness/features/central-kitchen-phase1-entities-and-domains/**`
- `feature_list.json`
- `member.local.md`
- `packages/domains/base-archives/**`
- `packages/domains/product-center/**`
- `packages/domains/supplier-center/**`
- `packages/domains/warehouse-center/**`
- `packages/domains/production-center/**`
- `packages/runtime/db/**`
- `packages/runtime/tenant/**`
- `apps/tenant/**`
- `tooling/db-migrate/**`
- `tsconfig.base.json`
- `scripts/check/check-entity-baseline.mjs`

## 二、 严禁触碰的边界 (Blacklist)

- `apps/control/**` (平台管控平面)
- `packages/base/auth/**` (认证核心)
- `packages/base/authorization/**` (权限核心)
- `packages/domains/customer-center/**` (已有客户中心，保持稳定无侵入)
