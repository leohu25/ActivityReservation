# 修改白名单与边界：Monorepo 骨架与 Next.js 初始化 (foundation-monorepo)

## 允许修改的文件与目录

- `.gitignore`
- `docs/**`
- `pnpm-workspace.yaml`
- `turbo.json`
- `package.json`
- `pnpm-lock.yaml`
- `tsconfig.json`
- `tsconfig.base.json`
- `apps/tenant/**`
- `packages/**`
- `tooling/**`
- `.harness/features/foundation-monorepo/**`
- `scripts/**`

## 严禁修改的内容

- 严禁修改 `docs/` 下的原始架构设计规范。
- 严禁手写违反分层架构的代码或绕过统一依赖管理。
