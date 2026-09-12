# Customer Center Feature-based Vertical Slice 收敛范围

## 允许修改

- `feature_list.json`
- `member.local.md`
- `.harness/features/arch-feature-vertical-slice-consolidation/**`
- `.harness/features/arch-fdd-ddd-workspace-consolidation/context.md`
- `.harness/features/arch-fdd-ddd-workspace-consolidation/progress.md`
- `.harness/features/arch-fdd-ddd-workspace-consolidation/handoff.md`
- `.harness/context/tier-2-domain-matrix.md`
- `.harness/memory/adr/ADR-001-fdd-and-harness.md`
- `.harness/memory/adr/ADR-004-fdd-vertical-slices-and-multi-app.md`
- `.harness/memory/adr/ADR-008-fdd-slices-with-ddd-aggregates-and-biz-shared.md`
- `.harness/memory/index.md`
- `.agents/skills/erp-feature-dev/**`
- `AGENTS.md`
- `README.md`
- `packages/features/README.md`
- `packages/features/customer-center/**`
- `pnpm-lock.yaml`
- `apps/tenant/src/app/(dashboard)/customer/**`
- `apps/tenant/src/kernel/registry.generated.ts`
- `scripts/sync-features.mjs`
- `scripts/check-redlines.mjs`
- `scripts/check-redlines.test.mjs`
- `docs/ARCHITECTURE.md`
- `docs/README.md`
- `docs/architecture/fdd-vertical-slice-architecture.md`
- `docs/architecture/Feature_Manifest_and_Dynamic_Discovery_Architecture.md`
- `docs/architecture/database-migration-engine.md`
- `docs/collaboration/harness-collaboration-guide.md`
- `tooling/db-migrate/README.md`

## 禁止修改

- 不迁移 `procurement-center`、`tenant-admin`、`control-admin` 的业务实现。
- 不修改 Prisma Schema 或数据库迁移。
- 不改变路由、权限语义、UI 设计或业务规则。
