# 修改白名单与边界：【P1】租户三维审计安全体系 (p1-tenant-audit-logs)

## 允许修改的文件与目录 (修改白名单)

- `packages/db-tenant/**`
- `packages/features/tenant-admin/**`
- `packages/features/procurement-center/**`
- `apps/tenant/src/app/(dashboard)/audit/**`
- `packages/ui/src/components/layout/Sidebar.tsx`
- `feature_list.json`
- `.harness/features/p1-tenant-audit-logs/**`

## 严禁修改的内容 (受保护区域)

- 严禁篡改或物理删除已持久化的历史审计日志。
