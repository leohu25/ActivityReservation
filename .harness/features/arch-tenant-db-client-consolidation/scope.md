# 特性范围白名单 (Scope Whitelist)

## 允许修改的文件范围

- `packages/db-tenant/**`
- `packages/db-control/**`
- `packages/features/customer-center/**`
- `packages/features/procurement-center/**`
- `tooling/db-migrate/**`
- `apps/tenant/**`
- `feature_list.json`
- `member.local.md`
- `progress.md`
- `session-handoff.md`
- `package.json`
- `.gitignore`
- `pnpm-lock.yaml`
- `skills-lock.json`
- `AGENTS.md`
- `scripts/**`
- `.agents/**`
- `.claude/**`
- `.harness/features/**`
- `.harness/memory/**`

## 严禁修改的内容 (受保护区域)

- 严禁修改 `packages/auth`、`packages/authorization`、`packages/ui` 等不相关包。
- 严禁改变各业务特性的外部业务行为与前端路由契约。
