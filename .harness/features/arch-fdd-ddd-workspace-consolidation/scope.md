# arch-fdd-ddd-workspace-consolidation 范围白名单

## 允许修改的文件清单

- `feature_list.json`
- `member.local.md`
- `.harness/features/arch-fdd-ddd-workspace-consolidation/**`
- `packages/features/procurement-center/src/components/ProcurementOrderCenter.tsx`
- `packages/biz-shared/**`
- `pnpm-workspace.yaml`
- `packages/ui/src/components/templates/**`
- `packages/ui/src/index.ts`
- `packages/features/customer-center/src/components/**`
- `packages/features/customer-center/src/index.ts`
- `.harness/memory/adr/ADR-008-fdd-slices-with-ddd-aggregates-and-biz-shared.md`
- `.harness/memory/index.md`
- `AGENTS.md`
- `.agents/skills/erp-feature-dev/**`
- `packages/biz-shared/README.md`
- `packages/features/customer-center/README.md`
- `packages/ui/README.md`

## 附带修改与前置联动 (Spillover / 联动扩围)
>
> 自动扩围按目录聚合；单文件精确登记，同目录 ≥2 文件折叠为 `dir/**`。

- `pnpm-lock.yaml` # 1 file @ 90af681d，联动修改自动登记
- `packages/ui/src/components/composite/data-table/**` # 4 files @ 90af681d，联动修改自动登记
- `packages/ui/src/CrudFormModal.test.tsx` # 1 file @ 90af681d，联动修改自动登记
- `packages/features/procurement-center/src/components/ProcurementOrderCenter.test.tsx` # 1 file @ 90af681d，联动修改自动登记
