# 修改白名单与边界：SaaS Web 门户与主面板框架 (foundation-web-shell)

## 允许修改的文件与目录 (修改白名单)

- `apps/tenant/**`
- `packages/ui/**`
- `packages/authorization/**`
- `.gitignore`
- `pnpm-lock.yaml`
- `feature_list.json`
- `.harness/features/foundation-web-shell/**`

## 严禁修改的内容 (受保护区域)

- 严禁擅自修改 `packages/foundation/**`。
- 严禁在未经 ADR 评审下修改其他特性目录。
