# 修改白名单与边界：租户组织人事模型与四层权限底层对齐 (foundation-tenant-rbac-core)

## 允许修改的文件与目录 (修改白名单)

- `packages/db-tenant/**`
- `packages/authorization/**`
- `packages/auth/**`
- `packages/ui/**`
- `packages/features/procurement-center/**`
- `apps/tenant/**`
- `apps/control/next-env.d.ts`
- `feature_list.json`
- `member.local.md`
- `pnpm-lock.yaml`
- `scripts/**`
- `docs/**`
- `.harness/**`

## 严禁修改的内容 (受保护区域)

- 严禁擅自修改 `packages/foundation/**`。
- 严禁在未经 ADR 评审下修改其他业务特性目录。
