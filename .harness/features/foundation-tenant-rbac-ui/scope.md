# 修改白名单与边界：租户管理员角色与四层权限配置中心 (foundation-tenant-rbac-ui)

## 允许修改的文件与目录 (修改白名单)

- `apps/tenant/**`
- `packages/authorization/**`
- `packages/db-control/**`
- `packages/shared/**`
- `packages/ui/**`
- `pnpm-lock.yaml`
- `AGENTS.md`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `.harness/features/foundation-tenant-rbac-ui/**`

## 严禁修改的内容 (受保护区域)

- 严禁擅自修改 `packages/foundation/**`。
- 严禁在未经 ADR 评审下修改其他特性目录。
