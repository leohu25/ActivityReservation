# 修改白名单与边界：权限体系统一排查与收敛重构 (arch-authz-consolidation)

## 允许修改的文件与目录 (修改白名单)

### 核心授权与内核
- `packages/authorization/src/**`
- `apps/tenant/src/kernel/permissions.ts`
- `apps/tenant/src/kernel/navigation.ts`
- `apps/tenant/src/kernel/registry.generated.ts`（仅由 sync 脚本再生）
- `apps/tenant/src/app/(dashboard)/settings/roles/page.tsx`

### 业务切片（权限相关）
- `packages/features/customer-center/src/contracts/**`
- `packages/features/customer-center/src/components/**`（权限衔接与测试）
- `packages/features/customer-center/src/actions.ts` / `src/server/**`（P3 守卫）
- `packages/features/customer-center/src/manifest.ts`
- `packages/features/procurement-center/src/contracts/**`、`manifest.ts`（对齐时）
- `packages/features/tenant-admin/src/components/RolePermissionManager.tsx` 及拆分子组件
- `packages/features/tenant-admin/src/permission-registry.ts`（删除/收敛）
- `packages/features/tenant-admin/src/services/tenant-role-service.ts`
- `packages/features/tenant-admin/src/types.ts`

### UI 组件（权限消费）
- `packages/ui/src/components/composite/data-table/DataTableActions.tsx`
- `packages/ui/src/components/composite/data-table/DataTableRowActions.tsx`
- `packages/ui/src/components/composite/data-table/DataTableRoot.tsx`
- `packages/ui/src/components/composite/data-table/DataTable.test.tsx`

### 认证边界
- `packages/auth/src/server/server.ts`
- `packages/auth/src/**/access-control.ts`

### 工程与文档
- `scripts/sync-features.mjs`
- `.agents/skills/erp-feature-dev/**`
- `.agents/skills/erp-feature-permissions/**`
- `.harness/memory/learnings.md`
- `.harness/memory/adr/`（新增 ADR 若需要）
- `.harness/features/arch-authz-consolidation/**`
- `feature_list.json`（本特性状态）

## 附带修改与前置联动

- `packages/ui` 单测：RowActions/ActionButton 行为变更时同步
- 各 `*View.test.tsx`：契约对齐断言
- `docs/Field_Level_Permission_Architecture_and_Implementation.md`：字段单点化后更新

## 严禁修改的内容 (受保护区域)

- 严禁破坏既有包公开导出（允许新增，删除需本特性内全仓替换完毕）
- 严禁修改与权限无关的业务逻辑（报价匹配、级联停用等领域规则）
- 严禁 `--no-verify` 绕过 pre-commit
- 严禁在未确认前将 P3 收紧直接视为「可静默上线」——需在 progress 记录用户确认
