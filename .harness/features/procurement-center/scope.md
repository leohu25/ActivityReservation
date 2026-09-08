# 修改白名单与边界：采购中心 (procurement-center)

## 允许修改的文件与目录

- `packages/features/procurement-center/**`
- `packages/features/control-admin/**`
- `packages/db-tenant/**`
- `apps/tenant/src/app/(dashboard)/procurement/**`
- `feature_list.json`
- `pnpm-lock.yaml`
- `.harness/features/procurement-center/**`

## 严禁修改的内容

- 严禁随意修改 `packages/foundation/**` 核心逻辑（如有缺陷需提 ADR 讨论）。
- 严禁修改其他业务 Feature 目录。
