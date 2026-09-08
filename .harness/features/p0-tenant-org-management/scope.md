# 修改白名单与边界：【P0】组织架构中心：部门树维护、岗位字典与直接录入建号 (p0-tenant-org-management)

## 允许修改的文件与目录 (修改白名单)

- `packages/features/tenant-admin/**`
- `apps/tenant/src/app/(dashboard)/organization/**`
- `packages/ui/src/components/layout/Sidebar.tsx`
- `feature_list.json`
- `.harness/features/p0-tenant-org-management/**`

## 严禁修改的内容 (受保护区域)

- 严禁篡改采购业务切片规则与不可逆状态机。
- 严禁调用 Better Auth 的全局用户封禁（遵循 R-04）。
