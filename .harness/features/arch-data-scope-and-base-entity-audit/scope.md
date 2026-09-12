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

- `packages/ui/src/components/shadcn/empty.tsx` # 1 file @ fcd94fcb，联动修改自动登记

- `.harness/context/design-system.md` # 1 file @ a8a73dd2，联动修改自动登记

- `packages/auth/README.md` # 1 file @ a1d3f179，联动修改自动登记

- `packages/auth/src/context/tenant-context.test.ts` # 1 file @ a1d3f179，联动修改自动登记

- `packages/biz-shared/README.md` # 1 file @ 46d3655c，联动修改自动登记

- `packages/db-control/README.md` # 1 file @ a1d3f179，联动修改自动登记

- `packages/db-tenant/README.md` # 1 file @ 6b72d5b0，联动修改自动登记

- `packages/db-tenant/src/index.test.ts` # 1 file @ 6b72d5b0，联动修改自动登记

- `packages/db-tenant/src/migration/migration.test.ts` # 1 file @ a1d3f179，联动修改自动登记

- `packages/db-tenant/src/schema-entities.test.ts` # 1 file @ bc3473a3，联动修改自动登记

- `packages/db-tenant/src/seed/database-seeder.test.ts` # 1 file @ a1d3f179，联动修改自动登记

- `packages/features/README.md` # 1 file @ 7f5fa7c7，联动修改自动登记

- `packages/features/control-admin/README.md` # 1 file @ 6b72d5b0，联动修改自动登记

- `packages/features/procurement-center/README.md` # 1 file @ 6b72d5b0，联动修改自动登记

- `packages/features/procurement-center/src/components/ProcurementOrderCenter.test.tsx` # 1 file @ 46d3655c，联动修改自动登记

- `packages/features/procurement-center/src/services/procurement-order-service.test.ts` # 1 file @ a05f54fa，联动修改自动登记

- `packages/features/procurement-center/src/services/workbench-real-topology.test.ts` # 1 file @ 1e0de5f5，联动修改自动登记

- `packages/features/tenant-admin/README.md` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/org-management/org-management-services.test.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/role-management/service.test.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/role-management/ui/RolePermissionManager.test.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/tenant-settings/service.test.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/shared/server/context.test.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/shared/README.md` # 1 file @ 6b72d5b0，联动修改自动登记

- `packages/shared/src/index.test.ts` # 1 file @ 02aaaad6，联动修改自动登记

- `packages/ui/README.md` # 1 file @ 46d3655c，联动修改自动登记

- `packages/ui/src/components/feedback/Toast.test.ts` # 1 file @ 40fb8788，联动修改自动登记

- `packages/ui/src/components/templates/CrudFormModal.test.tsx` # 1 file @ 40fb8788，联动修改自动登记

- `apps/control/.env.example` # 1 file @ 02aaaad6，联动修改自动登记

- `apps/control/Dockerfile` # 1 file @ 6b72d5b0，联动修改自动登记

- `apps/control/next-env.d.ts` # 1 file @ a1d3f179，联动修改自动登记

- `apps/control/src/app/layout.tsx` # 1 file @ 85d97e12，联动修改自动登记

- `apps/tenant/.env.example` # 1 file @ 9f45483e，联动修改自动登记

- `apps/tenant/Dockerfile` # 1 file @ 6b72d5b0，联动修改自动登记

- `apps/tenant/components.json` # 1 file @ 410ff8e3，联动修改自动登记

- `apps/tenant/src/app/(auth)/login/page.tsx` # 1 file @ 0afc0f33，联动修改自动登记

- `apps/tenant/src/app/(dashboard)/loading.tsx` # 1 file @ db702b2b，联动修改自动登记

- `apps/tenant/src/app/(dashboard)/organization/departments/page.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `apps/tenant/src/app/(dashboard)/organization/employees/page.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `apps/tenant/src/app/(dashboard)/organization/layout.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `apps/tenant/src/app/(dashboard)/organization/positions/page.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `apps/tenant/src/app/(dashboard)/procurement/layout.tsx` # 1 file @ fcd94fcb，联动修改自动登记

- `apps/tenant/src/app/(dashboard)/procurement/orders/page.tsx` # 1 file @ aa2ecaee，联动修改自动登记

- `apps/tenant/src/app/(dashboard)/settings/company/page.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `apps/tenant/src/app/(dashboard)/settings/general/page.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `apps/tenant/src/app/(dashboard)/settings/layout.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `apps/tenant/src/app/(dashboard)/settings/roles/page.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `apps/tenant/src/app/(dashboard)/settings/security/page.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `apps/tenant/src/app/(dashboard)/workbench/page.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `apps/tenant/src/app/api/auth/[...all]/route.ts` # 1 file @ 9f02a9fa，联动修改自动登记

- `apps/tenant/src/app/layout.tsx` # 1 file @ fcd94fcb，联动修改自动登记

- `apps/tenant/src/app/page.tsx` # 1 file @ 9f02a9fa，联动修改自动登记

- `apps/tenant/src/kernel/navigation.ts` # 1 file @ 1e0de5f5，联动修改自动登记

- `apps/tenant/src/kernel/permissions.ts` # 1 file @ ab326aa7，联动修改自动登记

- `apps/tenant/src/kernel/workbench.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/auth/src/context/tenant-context.ts` # 1 file @ a1d3f179，联动修改自动登记

- `packages/auth/src/context/trusted-tenant-context.ts` # 1 file @ a1d3f179，联动修改自动登记

- `packages/auth/src/server/server.ts` # 1 file @ 6b72d5b0，联动修改自动登记

- `packages/biz-shared/src/index.ts` # 1 file @ 46d3655c，联动修改自动登记

- `packages/db-tenant/src/migration/migration-runner.ts` # 1 file @ a1d3f179，联动修改自动登记

- `packages/db-tenant/src/migration/migration-types.ts` # 1 file @ a1d3f179，联动修改自动登记

- `packages/db-tenant/src/migration/tenant-provisioner.ts` # 1 file @ a1d3f179，联动修改自动登记

- `packages/db-tenant/src/pool/manager.ts` # 1 file @ 6b72d5b0，联动修改自动登记

- `packages/features/procurement-center/src/components/AuditOrderModal.tsx` # 1 file @ dd378d3c，联动修改自动登记

- `packages/features/procurement-center/src/components/CreateOrderDialog.tsx` # 1 file @ dd378d3c，联动修改自动登记

- `packages/features/procurement-center/src/components/ProcurementAbilityBoundary.tsx` # 1 file @ fcd94fcb，联动修改自动登记

- `packages/features/procurement-center/src/components/ProcurementOrderCenter.tsx` # 1 file @ 46d3655c，联动修改自动登记

- `packages/features/procurement-center/src/contracts/order.contract.ts` # 1 file @ a08b39f3，联动修改自动登记

- `packages/features/procurement-center/src/index.ts` # 1 file @ a08b39f3，联动修改自动登记

- `packages/features/procurement-center/src/manifest.ts` # 1 file @ a08b39f3，联动修改自动登记

- `packages/features/procurement-center/src/server/orders-view.ts` # 1 file @ a05f54fa，联动修改自动登记

- `packages/features/procurement-center/src/server/session.ts` # 1 file @ a05f54fa，联动修改自动登记

- `packages/features/procurement-center/src/services/procurement-order-service.ts` # 1 file @ a05f54fa，联动修改自动登记

- `packages/features/procurement-center/src/types.ts` # 1 file @ a08b39f3，联动修改自动登记

- `packages/features/tenant-admin/src/assembly/context.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/catalog.ts` # 1 file @ 9fb8d112，联动修改自动登记

- `packages/features/tenant-admin/src/features/audit-log/contract.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/org-management/actions.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/org-management/department-service.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/org-management/department.contract.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/org-management/employee-management-service.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/org-management/employee.contract.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/org-management/position-service.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/org-management/position.contract.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/org-management/queries.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/org-management/ui/DepartmentFormModal.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/org-management/ui/DepartmentView.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/org-management/ui/EmployeeView.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/org-management/ui/PositionFormModal.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/org-management/ui/PositionView.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/role-management/actions.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/role-management/contract.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/role-management/queries.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/role-management/service.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/role-management/types.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/role-management/ui/CreateRoleModal.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/role-management/ui/RolePermissionManager.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/tenant-settings/actions.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/tenant-settings/company-settings.contract.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/tenant-settings/general-settings.contract.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/tenant-settings/queries.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/tenant-settings/security-settings.contract.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/tenant-settings/service.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/tenant-settings/ui/CompanySettingsView.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/tenant-settings/ui/GeneralSettingsView.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/tenant-settings/ui/SecuritySettingsView.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/workbench/types.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/features/workbench/ui/WorkbenchView.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/manifest.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/shared/permission-registry.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/shared/server/tenant-context.ts` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/features/tenant-admin/src/shared/ui/TenantAdminAbilityBoundary.tsx` # 1 file @ 3dc05b9a，联动修改自动登记

- `packages/shared/src/api/action.ts` # 1 file @ 85d97e12，联动修改自动登记

- `packages/shared/src/api/index.ts` # 1 file @ 85d97e12，联动修改自动登记

- `packages/shared/src/api/response.ts` # 1 file @ 4ba06e61，联动修改自动登记

- `packages/shared/src/api/result.ts` # 1 file @ 4ba06e61，联动修改自动登记

- `packages/shared/src/constants/index.ts` # 1 file @ dd378d3c，联动修改自动登记

- `packages/shared/src/errors/app-error.ts` # 1 file @ 4ba06e61，联动修改自动登记

- `packages/shared/src/errors/index.ts` # 1 file @ 4ba06e61，联动修改自动登记

- `packages/shared/src/index.ts` # 1 file @ fcd94fcb，联动修改自动登记

- `packages/shared/src/types/common.ts` # 1 file @ 4ba06e61，联动修改自动登记

- `packages/shared/src/types/index.ts` # 1 file @ 4ba06e61，联动修改自动登记

- `packages/shared/src/types/pagination.ts` # 1 file @ 4ba06e61，联动修改自动登记

- `packages/shared/src/utils/collection/index.ts` # 1 file @ a0a14098，联动修改自动登记

- `packages/shared/src/utils/format/index.ts` # 1 file @ a0a14098，联动修改自动登记

- `packages/shared/src/utils/index.ts` # 1 file @ ab326aa7，联动修改自动登记

- `packages/shared/src/utils/mask/index.ts` # 1 file @ 4ba06e61，联动修改自动登记

- `packages/shared/src/utils/tree/index.ts` # 1 file @ 4ba06e61，联动修改自动登记

- `packages/shared/src/utils/validation/index.ts` # 1 file @ 4ba06e61，联动修改自动登记

- `packages/ui/src/components/composite/auth/AuthField.tsx` # 1 file @ fcd94fcb，联动修改自动登记

- `packages/ui/src/components/composite/auth/AuthGuard.tsx` # 1 file @ fcd94fcb，联动修改自动登记

- `packages/ui/src/components/composite/data-table/DataTableActions.tsx` # 1 file @ fcd94fcb，联动修改自动登记

- `packages/ui/src/components/composite/data-table/DataTableColumnSettings.tsx` # 1 file @ 5b68f3ac，联动修改自动登记

- `packages/ui/src/components/composite/data-table/DataTableContent.tsx` # 1 file @ 5b68f3ac，联动修改自动登记

- `packages/ui/src/components/composite/data-table/DataTableRoot.tsx` # 1 file @ 5b68f3ac，联动修改自动登记

- `packages/ui/src/components/composite/data-table/DataTableRowActions.tsx` # 1 file @ 5b68f3ac，联动修改自动登记

- `packages/ui/src/index.ts` # 1 file @ 46d3655c，联动修改自动登记

- `tsconfig.base.json` # 1 file @ 3dc05b9a，联动修改自动登记

- `compose.local.yaml` # 1 file @ c1768354，联动修改自动登记

- `compose.prod.yaml` # 1 file @ 6b72d5b0，联动修改自动登记
