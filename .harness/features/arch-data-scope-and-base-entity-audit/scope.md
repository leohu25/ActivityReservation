# 修改白名单与边界：通用实体审计基础字段规范与客户中心数据权限闭环 (arch-data-scope-and-base-entity-audit)

## 允许修改的文件与目录 (修改白名单)

- `packages/features/customer-center/**`
- `packages/features/procurement-center/prisma/schema.prisma`
- `packages/db-tenant/prisma/**`
- `scripts/check-entity-baseline.mjs`
- `scripts/check-entity-baseline.test.mjs`
- `scripts/verify.sh`
- `scripts/sync-tenant-schema.mjs`
- `tooling/db-migrate/**`
- `apps/tenant/src/app/(dashboard)/customer/**`
- `.harness/features/arch-data-scope-and-base-entity-audit/**`

## 附带修改与前置联动 (Spillover / 联动扩围)

- `packages/authorization/**` # 拓扑与数据范围工具函数适配（如需）
- `feature_list.json` # 特性状态事实源更新

## 严禁修改的内容 (受保护区域)

- 严禁破坏 PostgreSQL 物理隔离逻辑；
- 严禁破坏原有 RBAC 动作权限契约；
- 严禁擅自修改除当前特性受控切片外的其他已稳定特性核心逻辑。

- `README.md` # 1 file @ 7f5fa7c7，联动修改自动登记

- `packages/features/control-admin/src/control-admin.test.ts` # 1 file @ 02aaaad6，联动修改自动登记

- `packages/features/control-admin/src/features/migration-management/service.test.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/platform-overview/service.test.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/tenant-management/service.test.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/shared/server/control-guard.test.ts` # 1 file @ head，联动修改自动登记

- `apps/control/src/app/(dashboard)/layout.tsx` # 1 file @ 7d63f460，联动修改自动登记

- `apps/control/src/app/(dashboard)/migrations/page.tsx` # 1 file @ 2b37ea76，联动修改自动登记

- `apps/control/src/app/(dashboard)/overview/page.tsx` # 1 file @ 7d63f460，联动修改自动登记

- `apps/control/src/app/(dashboard)/tenants/page.tsx` # 1 file @ 7d63f460，联动修改自动登记

- `apps/control/src/app/api/auth/[...all]/route.ts` # 1 file @ 7d63f460，联动修改自动登记

- `apps/control/src/app/login/page.tsx` # 1 file @ 7d63f460，联动修改自动登记

- `apps/tenant/src/app/(dashboard)/layout.tsx` # 1 file @ 5b68f3ac，联动修改自动登记

- `packages/features/control-admin/src/components/ControlLayout.tsx` # 1 file @ bed8c287，联动修改自动登记

- `packages/features/control-admin/src/components/ControlMetrics.tsx` # 1 file @ 7d63f460，联动修改自动登记

- `packages/features/control-admin/src/components/MigrationsPage.tsx` # 1 file @ 2b37ea76，联动修改自动登记

- `packages/features/control-admin/src/components/MigrationsView.tsx` # 1 file @ 2b37ea76，联动修改自动登记

- `packages/features/control-admin/src/components/OverviewPage.tsx` # 1 file @ 7d63f460，联动修改自动登记

- `packages/features/control-admin/src/components/ProvisionTenantDialog.tsx` # 1 file @ f2965d2f，联动修改自动登记

- `packages/features/control-admin/src/components/TenantLifecycleTable.tsx` # 1 file @ 7d63f460，联动修改自动登记

- `packages/features/control-admin/src/components/TenantsPage.tsx` # 1 file @ 7d63f460，联动修改自动登记

- `packages/features/control-admin/src/components/TenantsView.tsx` # 1 file @ f2965d2f，联动修改自动登记

- `packages/features/control-admin/src/components/index.ts` # 1 file @ 2b37ea76，联动修改自动登记

- `packages/features/control-admin/src/features/migration-management/actions.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/migration-management/contract.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/migration-management/public.server.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/migration-management/public.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/migration-management/queries.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/migration-management/service.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/migration-management/types.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/migration-management/ui/MigrationsView.tsx` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/platform-overview/contract.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/platform-overview/public.server.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/platform-overview/public.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/platform-overview/queries.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/platform-overview/service.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/platform-overview/types.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/platform-overview/ui/ControlMetrics.tsx` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/platform-overview/ui/OverviewView.tsx` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/tenant-management/actions.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/tenant-management/contract.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/tenant-management/public.server.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/tenant-management/public.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/tenant-management/queries.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/tenant-management/service.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/tenant-management/types.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/tenant-management/ui/ProvisionTenantDialog.tsx` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/tenant-management/ui/TenantDetailDrawer.tsx` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/tenant-management/ui/TenantLifecycleTable.tsx` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/features/tenant-management/ui/TenantsView.tsx` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/index.ts` # 1 file @ 7d63f460，联动修改自动登记

- `packages/features/control-admin/src/server/session.ts` # 1 file @ 7d63f460，联动修改自动登记

- `packages/features/control-admin/src/services/index.ts` # 1 file @ 7d63f460，联动修改自动登记

- `packages/features/control-admin/src/shared/public.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/shared/server.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/shared/server/auth-runtime.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/shared/server/control-guard.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/shared/server/session.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/shared/ui/ControlLayout.tsx` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/shared/ui/ControlLogin.tsx` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/shared/ui/index.ts` # 1 file @ head，联动修改自动登记

- `packages/features/control-admin/src/types.ts` # 1 file @ 2b37ea76，联动修改自动登记

- `packages/ui/src/components/layout/TopHeader.tsx` # 1 file @ 5b68f3ac，联动修改自动登记
