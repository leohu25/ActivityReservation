# 特性范围说明 — feat-central-kitchen-production-bom (生产 BOM 中心)

## 一、 允许修改的范围白名单 (Whitelist)

- `.harness/features/feat-central-kitchen-production-bom/**`
- `feature_list.json`
- `member.local.md`
- `packages/domains/production-center/**`
- `apps/tenant/src/app/(dashboard)/(domains)/production/**`
- `apps/tenant/src/assembly/**`
- `apps/tenant/scripts/**`
- `packages/base/ui/**`

## 二、 严禁触碰的边界 (Blacklist)

- `apps/control/**` (平台管控平面)
- `packages/base/auth/**` (认证核心)
- `packages/base/authorization/**` (权限核心)
- `packages/domains/customer-center/**` (客户中心，保持稳定无侵入)
