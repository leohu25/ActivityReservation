# 修改白名单与边界：多租户数据库迁移引擎 (foundation-migration)

## 允许修改的文件与目录 (修改白名单)

- `packages/db-control/**`
- `packages/db-tenant/**`
- `tooling/tenant-migrate/**`
- `tooling/platform-migrate/**`
- `tooling/db-migrate/**`
- `packages/features/control-admin/**`
- `packages/features/procurement-center/prisma/schema.prisma`
- `apps/control/**`
- `apps/tenant/package.json`
- `tsconfig.base.json`
- `turbo.json`
- `README.md`
- `.harness/features/foundation-migration/**`
- `.harness/context/tier-2-domain-matrix.md`
- `.harness/memory/**`
- `pnpm-lock.yaml`
- `package.json`
- `feature_list.json`

## 严禁修改的内容 (受保护区域)

- 严禁擅自修改业务特性目录。
