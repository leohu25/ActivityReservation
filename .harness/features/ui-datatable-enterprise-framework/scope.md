# ui-datatable-enterprise-framework 白名单范围

## 允许修改的文件与目录 (修改白名单)

### UI 积木与外壳

- `packages/ui/src/components/composite/data-table/**`
- `packages/ui/src/components/composite/form/**`
- `packages/ui/src/components/primitives/table.tsx`
- `packages/ui/src/components/layout/**`
- `packages/ui/src/components/templates/**`
- `packages/ui/src/components/shadcn/**`
- `packages/ui/src/hooks/**`
- `packages/ui/src/components/ThemeToggle.tsx`
- `packages/ui/src/components/DictionarySectionCard.tsx`
- `packages/ui/src/components/AuthorizedField.tsx`
- `packages/ui/src/components/index.ts`
- `packages/ui/src/index.ts`
- `packages/ui/src/lib/**`
- `packages/ui/package.json`
- `packages/ui/components.json`
- `packages/ui/README.md`

### 业务接线（客户中心服务端分页）

- `packages/features/customer-center/src/components/CustomerView.tsx`
- `packages/features/customer-center/src/components/CustomerView.test.tsx`
- `packages/features/customer-center/src/components/StoreView.tsx`
- `packages/features/customer-center/src/components/QuoteView.tsx`
- `packages/features/customer-center/src/services/customer-service.ts`
- `packages/features/customer-center/src/actions.ts`
- `packages/features/customer-center/src/types.ts`
- `apps/tenant/src/app/**/customer/**`

### 应用外壳与样式

- `apps/*/src/app/globals.css`
- `apps/tenant/src/app/(dashboard)/layout.tsx`

### 工程协同

- `.agents/skills/erp-feature-dev/**`
- `feature_list.json`
- `member.local.md`
- `.harness/features/ui-datatable-enterprise-framework/**`

## 附带修改与前置联动 (Spillover / 联动扩围)
>
> 自动扩围按目录聚合；单文件精确登记，同目录 ≥2 文件折叠为 `dir/**`。格式：`pattern # N files @ commit`

### 历史会话（DataTable / 权限 / 分页联动）

- `packages/ui/src/Sidebar.test.ts` # 1 file @ historical，联动 sidebar 改写
- `packages/ui/src/components/ExceptionList.tsx` # 1 file @ historical
- `packages/ui/src/components/MetricCard.tsx` # 1 file @ historical
- `packages/ui/src/components/ProcessStepper.tsx` # 1 file @ historical
- `packages/ui/src/components/feedback/**` # 4 files @ historical，Empty/Toast 空态范式
- `packages/ui/src/components/primitives/**` # 5 files @ historical，dialog/dropdown/sheet 等
- `packages/authorization/**` # 6 files @ historical，权限消费对齐（ability/catalog/field-policy）
- `packages/features/customer-center/**` # 12 files @ historical，分页与权限联动（已部分落入上方业务白名单）
- `packages/features/tenant-admin/src/components/**` # 9 files @ historical，DataTable 装配范式
- `packages/features/tenant-admin/src/permission-registry.ts` # 1 file @ historical，权限目录收敛
- `packages/features/procurement-center/src/components/ProcurementOrderCenter.tsx` # 1 file @ historical，表格范式对齐
- `packages/shared/src/utils/**` # 2 files @ historical，导出工具
- `apps/tenant/src/app/(dashboard)/settings/roles/page.tsx` # 1 file @ historical，权限页联动
- `apps/tenant/src/kernel/permissions.ts` # 1 file @ historical，权限内核
- `pnpm-lock.yaml` # 1 file @ historical，依赖变更
- `.harness/features/arch-authz-consolidation/**` # 5 files @ historical，特性沙盒交叉引用

### Harness 工程优化（token 瘦身）

- `scripts/**` # 2 files @ fb73ace，fail-only reporter + 边界通配符聚合
- `packages/ui/package.json` # 1 file @ fb73ace，test 挂 fail-only reporter
- `packages/shared/package.json` # 1 file @ fb73ace，test 挂 fail-only reporter
- `packages/auth/package.json` # 1 file @ fb73ace，test 挂 fail-only reporter
- `packages/authorization/package.json` # 1 file @ fb73ace，test 挂 fail-only reporter
- `packages/db-control/package.json` # 1 file @ fb73ace，test 挂 fail-only reporter
- `packages/db-tenant/package.json` # 1 file @ fb73ace，test 挂 fail-only reporter
- `packages/features/customer-center/package.json` # 1 file @ fb73ace，test 挂 fail-only reporter
- `packages/features/tenant-admin/package.json` # 1 file @ fb73ace，test 挂 fail-only reporter
- `packages/features/procurement-center/package.json` # 1 file @ fb73ace，test 挂 fail-only reporter
- `packages/features/control-admin/package.json` # 1 file @ fb73ace，test 挂 fail-only reporter
- `tooling/db-migrate/package.json` # 1 file @ fb73ace，test 挂 fail-only reporter
- `.harness/features/_template/scope.md` # 1 file @ fb73ace，扩围格式模板
- `.harness/agents/implementer.md` # 1 file @ 6d6912ef，联动修改自动登记
- `.harness/lifecycle/session-end.mjs` # 1 file @ 6d6912ef，联动修改自动登记
- `docs/**` # 5 files @ 66db3358，联动修改自动登记
- `AGENTS.md` # 1 file @ 66db3358，联动修改自动登记
- `"docs/archive/**` # 4 files @ 66db3358，联动修改自动登记

## 严禁修改的内容 (受保护区域)

- `apps/**`（上方 customer/globals/layout 白名单除外）
- `packages/features/**`（上方 customer-center 业务白名单除外）
- `packages/db-*/**`
- `packages/auth/**`
- `packages/authorization/**`（仅历史 spillover 记录，新改动需重新扩围）
