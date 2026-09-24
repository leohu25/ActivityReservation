# 特性范围说明 — feat-central-kitchen-production-resources (生产资源与工艺主数据)

## 一、 允许修改的范围白名单 (Whitelist)

- `.harness/features/feat-central-kitchen-production-resources/**`
- `.harness/memory/**`
- `.agents/skills/**`
- `feature_list.json`
- `member.local.md`
- `packages/base/ui/**`
- `packages/domains/production-center/**`
- `packages/runtime/tenant/**`
- `apps/tenant/src/app/(dashboard)/(domains)/production/**`
- `scripts/**`

## 二、 严禁触碰的边界 (Blacklist)

- `apps/control/**` (平台管控平面)
- `packages/base/auth/**` (认证核心)
- `packages/base/authorization/**` (权限核心)
- `packages/domains/customer-center/**`
- `packages/domains/warehouse-center/**`
- `packages/domains/supplier-center/**`
