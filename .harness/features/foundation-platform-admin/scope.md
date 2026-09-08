# 修改白名单与边界：平台运营商总控面板与租户开通中心 (foundation-platform-admin)

## 允许修改的文件与目录 (修改白名单)

- `apps/tenant/**`
- `packages/db-control/**`
- `packages/shared/**`
- `pnpm-lock.yaml`
- `AGENTS.md`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `.harness/features/foundation-platform-admin/**`

## 严禁修改的内容 (受保护区域)

- 严禁擅自修改 `packages/foundation/**`。
- 严禁在未经 ADR 评审下修改其他特性目录。
