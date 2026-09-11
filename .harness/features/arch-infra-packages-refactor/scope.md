# Scope 白名单: arch-infra-packages-refactor

## 允许修改/新增的文件范围

- `feature_list.json`
- `member.local.md`
- `pnpm-lock.yaml`
- `.harness/features/arch-infra-packages-refactor/**`
- `packages/db-control/**`
- `packages/db-tenant/**`
- `packages/authorization/**`
- `packages/auth/**`
- `apps/**`
- `packages/features/**`
- `scripts/**`
- `skills-lock.json`
- `.agents/skills/**`
- `.harness/**`

## 附带修改与前置联动 (Spillover / 联动扩围)

- `docs/**` # 理由：更新架构与协作指南索引
- `AGENTS.md` # 理由：更新最高宪法中的交接规约与单源治理
- `package.json` # 理由：精简 scripts 命令并直接指向 .harness/lifecycle 脚本
