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
- `packages/features/tenant-admin/**`
- `packages/authorization/**`
- `tsconfig.base.json`
- `pnpm-lock.yaml`
- `apps/tenant/src/**`
- `scripts/**`
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

- `packages/features/tenant-admin/README.md` # 1 file @ 9fb8d112，联动修改自动登记

- `packages/features/tenant-admin/src/components/RolePermissionManager.test.tsx` # 1 file @ 9fb8d112，联动修改自动登记

- `packages/features/tenant-admin/src/server/session.test.ts` # 1 file @ 9fb8d112，联动修改自动登记

- `packages/features/tenant-admin/src/services/org-management-services.test.ts` # 1 file @ d84c15e8，联动修改自动登记

- `packages/features/tenant-admin/src/services/tenant-role-service.test.ts` # 1 file @ 1e0de5f5，联动修改自动登记

- `packages/features/tenant-admin/src/services/tenant-settings-service.test.ts` # 1 file @ 02aaaad6，联动修改自动登记

- `packages/features/tenant-admin/src/features/org-management/org-management-services.test.ts` # 1 file @ head，联动修改自动登记

- `packages/features/tenant-admin/src/features/role-management/service.test.ts` # 1 file @ head，联动修改自动登记

- `packages/features/tenant-admin/src/features/role-management/ui/RolePermissionManager.test.tsx` # 1 file @ head，联动修改自动登记

- `packages/features/tenant-admin/src/features/tenant-settings/service.test.ts` # 1 file @ head，联动修改自动登记

- `packages/features/tenant-admin/src/shared/server/context.test.ts` # 1 file @ head，联动修改自动登记

- `.harness/context/budget.md` # 1 file @ 66db3358，联动修改自动登记
